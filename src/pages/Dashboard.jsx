import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  FiCreditCard,
  FiDownload,
  FiActivity,
  FiEdit3,
  FiPlusCircle,
  FiRefreshCw,
  FiTruck,
  FiUser,
  FiChevronRight,
  FiClock,
  FiFileText,
  FiSearch,
  FiX,
  FiChevronUp,
  FiDelete,
  FiTrash,
  FiClipboard,
} from "react-icons/fi";
import { API_URL } from "../constants/constants";
import "../styles/dashboard.css";
import CopyButton from "../components/Utilities/CopyButton";
import { fetchBalance, fetchDashboardKpis, fetchSubAccounts, formatPeso, handleLogout } from "../constants/helpers";
import { AddAccountModal } from "../components/Modals/AddAccountModal";
import { ManageAliasModal } from "../components/Modals/ManageAliasModal";
import { GenerateSoaModal } from "../components/Modals/GenerateSoaModal";
import { useNavigate, useOutletContext } from "react-router-dom";
import ActionDropdown from "../components/Utilities/ActionDropdown";
import { RiRectangleLine } from "react-icons/ri";
import { ManagePlateModal } from "../components/Modals/ManagePlateModal";
import { DeleteSubAccountModal } from "../components/Modals/DeleteSubAccountModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const { setCustomer, mainScrollRef } = useOutletContext();

  const customer = useMemo(() => {
    const storedCustomer = sessionStorage.getItem("customer");
    return storedCustomer ? JSON.parse(storedCustomer) : null;
  }, []);

  const [mainAccount, setMainAccount] = useState(() => {
    if (!customer) return null;
    return {
      id: customer.id,
      account_number: customer.account_number,
      plate_number: customer.plate_number,
      alias: customer.alias,
      balance: 0,
      type: 'main',
      status: customer.active === 1 ? "Active" : "Inactive",
      last_updated: "Loading...",
    };
  });

  const [dashboardKpiLoading, setDashboardKpiLoading] = useState(false);
  const [mainBalanceLoading, setMainBalanceLoading] = useState(false);
  const [subBalanceLoadingId, setSubBalanceLoadingid] = useState(null);
  const [subAccounts, setSubAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Pagination & Search States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Modal States
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false);
  const [isUpdatePlateModalOpen, setIsUpdatePlateModalOpen] = useState(false);
  const [isDeleteSubAccountModalOpen, setIsDeleteSubAccountModalOpen] = useState(false);
  const [isGenerateSoaModalOpen, setIsGenerateSoaModalOpen] = useState(false);

  // Search state references
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Floating Back to Top State
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Check if Action Dropdown is Open
  const [activeDropdownAccount, setActiveDropdownAccount] = useState(null);

  // Dashboard Kpis
  const [totalAccounts, setTotalAccounts] = useState(null)
  const [lastReloadMain, setLastReloadMain] = useState(null)
  const [createAtMain, setCreatedAtMain] = useState(null)

  const observerRef = useRef(null);

  const formatTimestamp = (unixTimestamp) => {
    if (!unixTimestamp) return "N/A";
    const date = new Date(unixTimestamp * 1000);
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getDashboardKpis = useCallback(async () => {
    if (!customer) return;
    setDashboardKpiLoading(true)

    try {
      const kpis = await fetchDashboardKpis()

      setTotalAccounts(kpis?.data?.total_accounts)
      setLastReloadMain(kpis?.data?.last_reload_main)
      setCreatedAtMain(kpis?.data?.account_created_date)
    } catch (error) {
      console.error("Failed to get Dashboard KPI Details:", error);
    } finally {
      setDashboardKpiLoading(false);
    }
  }, [customer])

  const getMainAccountBalance = useCallback(async () => {
    if (!customer?.account_number) return;
    setMainBalanceLoading(true);

    try {
      const accountData = await fetchBalance(customer?.account_number)
      const fetchedBalance = Number(accountData?.data?.available_balance || 0);

      setMainAccount((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          balance: fetchedBalance,
          last_updated: formatTimestamp(Math.floor(Date.now() / 1000)),
        };
      });

    } catch (error) {
      console.error("Failed to get Main Account Balance:", error);
    } finally {
      setMainBalanceLoading(false);
    }
  }, [customer]);

  const getSubAccountBalance = useCallback(async (account_number) => {
    if (!account_number) return;
    setSubBalanceLoadingid(account_number);

    try {
      const subAccountData = await fetchBalance(account_number);
      const fetchedBalance = Number(subAccountData?.data?.available_balance || 0);

      setSubAccounts((prev) =>
        prev.map((acc) => {
          // Find the matching subaccount
          if (acc.account_number === account_number) {
            // Recalculate status based on your loadAccounts logic
            const updatedStatus = fetchedBalance < 100 ? "Low Balance" : acc.status;

            return {
              ...acc,
              balance: fetchedBalance,
              status: updatedStatus === "Low Balance" ? "Low Balance" : acc.status, // Keeps "Active"/"Inactive" unless it's low
              last_updated: formatTimestamp(Math.floor(Date.now() / 1000)),
            };
          }
          // Return unchanged accounts
          return acc;
        })
      );

    } catch (error) {
      console.error("Failed to get Sub Account Balance:", error);
    } finally {
      setSubBalanceLoadingid(null);
    }
  }, []); // customer isn't used inside this function, so dependency array can be empty (or include formatTimestamp if it's not global)

  const loadAccounts = useCallback(async (pageNumber, clearExisting = false, search = "") => {
    if (!customer?.email) return;
    setLoading(true);

    try {
      const resJson = await fetchSubAccounts({
        email: customer.email,
        page: pageNumber,
        search,
        setCustomer
      });

      if (!resJson) return;

      const rawData = resJson?.data || [];
      const hasMoreData = resJson?.hasMore || false;

      const formattedRecords = rawData.map((sub, index) => ({
        id: `sub-${sub.account_number}-${sub.plate_number}`,
        account_number: sub.account_number,
        plate_number: sub.plate_number,
        alias: sub.alias,
        balance: sub.balance,
        type: 'sub',
        status: Number(sub.balance || 0) < 100 ? "Low Balance" : (sub.active === 1 ? "Active" : "Inactive"),
        last_updated: formatTimestamp(sub.time || Math.floor(Date.now() / 1000)),
      }));

      if (pageNumber === 1 || clearExisting) {
        setSubAccounts(formattedRecords);
      } else {
        setSubAccounts((prev) => {
          const existingIds = new Set(prev.map(acc => acc.id));
          // Filter out incoming items that already exist in the list
          const filteredNewRecords = formattedRecords.filter(acc => !existingIds.has(acc.id));
          return [...prev, ...filteredNewRecords];
        });
      }

      setHasMore(hasMoreData);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [customer, setCustomer]);

  useEffect(() => {
    if (customer) {
      getDashboardKpis();
      getMainAccountBalance();
      loadAccounts(1, true, debouncedSearchQuery);
    }
  }, [customer, getMainAccountBalance, loadAccounts, debouncedSearchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
      setPage(1);
    }, 1000);

    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    const container = mainScrollRef.current;

    if (!container) return;

    const handleScrollVisibility = () => {
      setShowBackToTop(container.scrollTop > 400);
    };

    container.addEventListener("scroll", handleScrollVisibility);

    handleScrollVisibility();

    return () => {
      container.removeEventListener("scroll", handleScrollVisibility);
    };
  }, [mainScrollRef]);

  useEffect(() => {
    if (initialLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            loadAccounts(nextPage, false, debouncedSearchQuery);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, initialLoading, loadAccounts, debouncedSearchQuery]);

  const handleMainAccountUpdates = () => {
    if (selectedAccount && selectedAccount.account_number === customer?.account_number) {
      const rawSession = sessionStorage.getItem("customer");
      if (rawSession) {
        const parsedSession = JSON.parse(rawSession);

        setCustomer(JSON.stringify(parsedSession));

        setMainAccount((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ...parsedSession,
            status: parsedSession.active === 1 ? "Active" : "Inactive"
          };
        });
      }
    }
  };

  const handleRefreshData = () => {
    getDashboardKpis();
    handleMainAccountUpdates();
    setPage(1);
    setHasMore(true);
    setSearchInput("");
    setDebouncedSearchQuery("");
    getMainAccountBalance();
    loadAccounts(1, true, "");
  };

  const handleAliasModal = (currentAccount) => {
    setSelectedAccount(currentAccount);
    setIsAliasModalOpen(true);
  };

  const handlePlateModal = (currentAccount) => {
    setSelectedAccount(currentAccount);
    setIsUpdatePlateModalOpen(true);
  };

  const handleDeleteSubAccount = (currentAccount) => {
    setSelectedAccount(currentAccount);
    setIsDeleteSubAccountModalOpen(true);
  };

  const handleGenerateSoaModal = (currentAccount) => {
    setSelectedAccount(currentAccount);
    setIsGenerateSoaModalOpen(true);
  };

  const scrollToTop = () => {
    mainScrollRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const AccountActionButton = ({ icon, label, onClick }) => (
    <button type="button" className="account-action-btn" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <>
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-label">Customer Web Portal</span>
          <h1>Hello, {customer?.name || "Customer"}</h1>
          <p>
            View your main Autosweep account, manage linked RFID vehicles,
            monitor balances, download statements, and review transaction activity.
          </p>
        </div>

        <button
          type="button"
          className="add-account-btn"
          onClick={() => setIsAddAccountModalOpen(true)}
        >
          <FiPlusCircle />
          {"Add Account"}
        </button>
      </section>

      <section className="dashboard-kpis">
        <div className="kpi-card">
          {dashboardKpiLoading ? (
            <div className="mask-skel-top">
              <div className="mask-skel-avatar db-shimmer"></div>
              <div className="mask-skel-meta-rows">
                <div className="mask-skel-line db-shimmer label"></div>
                <div className="mask-skel-line db-shimmer title"></div>
              </div>
            </div>
          ) : (
            <>
              <FiCreditCard />
              <div>
                <span>Total RFID Accounts</span>
                <strong>{totalAccounts}</strong>
              </div>
            </>
          )}
        </div>

        <div className="kpi-card">
          {dashboardKpiLoading ? (
            <div className="mask-skel-top">
              <div className="mask-skel-avatar db-shimmer"></div>
              <div className="mask-skel-meta-rows">
                <div className="mask-skel-line db-shimmer label"></div>
                <div className="mask-skel-line db-shimmer title"></div>
              </div>
            </div>
          ) : (
            <>
              <FiTruck />
              <div>
                <span>Last RFID Reload [Main]</span>
                <strong>{lastReloadMain}</strong>
              </div>
            </>
          )}
        </div>

        <div className="kpi-card">
          {dashboardKpiLoading ? (
            <div className="mask-skel-top">
              <div className="mask-skel-avatar db-shimmer"></div>
              <div className="mask-skel-meta-rows">
                <div className="mask-skel-line db-shimmer label"></div>
                <div className="mask-skel-line db-shimmer title"></div>
              </div>
            </div>
          ) : (
            <>
              <FiClock />
              <div>
                <span>Account Created [Main]</span>
                <strong>{createAtMain}</strong>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="dashboard-layout-grid">
        <div className="main-account-panel">
          <div className="section-header">
            <div>
              <h2>Main Account</h2>
              <p>Your primary Autosweep RFID customer account.</p>
            </div>
          </div>

          {initialLoading ? (
            <div className="main-account-skeleton">
              <div className="mask-skel-top">
                <div className="mask-skel-avatar db-shimmer"></div>
                <div className="mask-skel-meta-rows">
                  <div className="mask-skel-line db-shimmer label"></div>
                  <div className="mask-skel-line db-shimmer title"></div>
                </div>
              </div>
              <div className="mask-skel-box">
                <div className="mask-skel-line db-shimmer small-text"></div>
                <div className="mask-skel-line db-shimmer big-heading"></div>
                <div className="mask-skel-line db-shimmer timestamp"></div>
              </div>
              <div className="mask-skel-actions">
                <div className="mask-skel-btn db-shimmer"></div>
                <div className="mask-skel-btn db-shimmer"></div>
                <div className="mask-skel-btn db-shimmer"></div>
                <div className="mask-skel-btn db-shimmer"></div>
              </div>
            </div>
          ) : mainAccount ? (
            <div className="main-account-card">
              <div className="main-account-top">
                <div className="account-icon-large">
                  <FiUser />
                </div>
                <div>
                  <span className="account-type main">Main Account</span>
                  <h3>
                    {mainAccount.alias || "Account No.: " + mainAccount.account_number || "N/A"}
                    {!mainAccount.alias && <CopyButton textToCopy={mainAccount.account_number} tooltipText="Copy Account Number" />}
                  </h3>
                  {mainAccount.alias && mainAccount.account_number && (
                    <>
                      <p className="d-flex align-items-center">
                        <span>Account No.: {mainAccount.account_number}</span>
                        <CopyButton textToCopy={mainAccount.account_number} tooltipText="Copy Account Number" />
                      </p>
                      <p className="d-flex align-items-center">
                        <span>Plate No.: {mainAccount.plate_number}</span>
                        <CopyButton textToCopy={mainAccount.plate_number} tooltipText="Copy Plate Number" />
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="main-balance-box">
                <span>Available Balance</span>
                {mainBalanceLoading ? (
                  <div className="mask-skel-line db-shimmer big-heading"></div>
                ) : (
                  <strong className={mainAccount.balance < 100 ? 'is-low' : ''}>{formatPeso(mainAccount.balance)}</strong>
                )}
                <small>Last updated: {mainAccount.last_updated || "N/A"}</small>
              </div>

              <div className="main-account-actions">
                <AccountActionButton
                  icon={<FiRefreshCw className={mainBalanceLoading ? "spin-animate" : ""} />}
                  label={mainBalanceLoading ? "Checking..." : "Check Balance"}
                  onClick={getMainAccountBalance}
                />
                <AccountActionButton
                  icon={<FiDownload />}
                  label="Download SOA"
                  onClick={() => handleGenerateSoaModal(mainAccount)}
                />
                {/* <AccountActionButton
                  icon={<RiRectangleLine />}
                  label="Update Plate"
                  onClick={() => handlePlateModal(mainAccount)}
                /> */}
                <AccountActionButton
                  icon={<FiEdit3 />}
                  label={`${mainAccount.alias ? "Update" : "Assign"} Alias`}
                  onClick={() => handleAliasModal(mainAccount)}
                />
              </div>
            </div>
          ) : (
            <div className="empty-card">No main account setup detected.</div>
          )}
        </div>

        <div className="quick-actions-panel">
          <div className="section-header">
            <div>
              <h2>Quick Actions</h2>
              <p>Most used account services.</p>
            </div>
          </div>
          <div className="quick-action-list">
            <button type="button" onClick={() => handleGenerateSoaModal(mainAccount)}>
              <FiFileText />
              <div>
                <strong>Generate SOA [Main]</strong>
                <span>Download statement of account</span>
              </div>
              <FiChevronRight />
            </button>
            <button type="button" onClick={() => navigate("/sales-invoices")}>
              <FiFileText />
              <div>
                <strong>Sales Invoice</strong>
                <span>View your invoices</span>
              </div>
              <FiChevronRight />
            </button>
            <button type="button" onClick={() => navigate("/acknowledgement-receipts")}>
              <FiClipboard />
              <div>
                <strong>Acknowledgement Receipts</strong>
                <span>Check proof of successful payments</span>
              </div>
              <FiChevronRight />
            </button>
          </div>
        </div>
      </section>

      {/* Sub Accounts Section */}
      {totalAccounts > 1 && (
        <section className="accounts-section">
          <div className="section-header sub-accounts-header-container">
            <div>
              <h2>Sub Accounts</h2>
              <p>Vehicles and RFID tags linked under your main customer account.</p>
            </div>

            <div className="search-bar-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search Plate No. or Alias..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="subaccount-search-input"
              />
              {searchInput && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchInput("")}
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>

          {subAccounts.length > 0 ? (
            <div className="sub-account-list">
              {subAccounts.map((account) => (
                <div className={`sub-account-row ${activeDropdownAccount == account.id ? "is-dropdown-open" : ""}`}
                  key={account.id}>
                  <div className="vehicle-icon">
                    <FiTruck />
                  </div>

                  <div className="sub-account-main">
                    <div className="sub-account-title">
                      <h3>
                        {account.alias || "Account No.: " + account.account_number || "N/A"}
                        {!account.alias && <CopyButton textToCopy={account.account_number} tooltipText="Copy Account Number" />}
                      </h3>
                      <span className={`status-pill ${account.status === "Low Balance" ? "warning" : ""}`}>
                        {account.status}
                      </span>
                    </div>

                    <div className="sub-account-meta">
                      {account.alias && (
                        <span className="d-flex align-items-center">
                          Account No. {account.account_number}
                          <CopyButton textToCopy={account.account_number} tooltipText="Copy Account Number" />
                        </span>
                      )}
                      <span className="d-flex align-items-center">
                        Plate No. {account.plate_number}
                        <CopyButton textToCopy={account.plate_number} tooltipText="Copy Plate Number" />
                      </span>
                      <span>Updated {account.last_updated}</span>
                    </div>
                  </div>

                  <div className="sub-balance">
                    <span>Balance</span>
                    {subBalanceLoadingId == account.account_number ? (
                      <div className="mask-skel-line db-shimmer big-heading"></div>
                    ) : (
                      <strong className={account.balance < 100 ? 'is-low' : ''}>{formatPeso(account.balance)}</strong>
                    )}
                  </div>

                  <ActionDropdown
                    onOpen={() => setActiveDropdownAccount(account.id)}
                    onClose={() => setActiveDropdownAccount(null)}
                    actions={[
                      {
                        label: "Check Balance",
                        icon: <FiRefreshCw />,
                        onClick: () => getSubAccountBalance(account.account_number),
                      },
                      {
                        label: "Generate SOA",
                        icon: <FiDownload />,
                        onClick: () => handleGenerateSoaModal(account)
                      },
                      {
                        label: account.alias ? "Update" : "Assign" + " Alias",
                        icon: <FiEdit3 />,
                        onClick: () => handleAliasModal(account)
                      },
                      // {
                      //   label: "Update Plate",
                      //   icon: <RiRectangleLine />,
                      //   onClick: () => handlePlateModal(account)
                      // },
                      {
                        type: "divider"
                      },
                      {
                        label: "Remove",
                        icon: <FiTrash />,
                        isDestructive: true,
                        onClick: () => handleDeleteSubAccount(account),
                      }
                    ]} />
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="empty-search-card">
                {searchInput ? `No matching accounts found for "${searchInput}".` : "No linked sub-accounts setup detected."}
              </div>
            )
          )}


          {subAccounts.length > 0 && (
            <div ref={observerRef} className="scroll-sentinel">
              {loading && (
                <div className="infinite-scroll-loader">
                  <FiRefreshCw className="spin-animate" />
                  <span>Fetching matching records...</span>
                </div>
              )}
              {!hasMore && subAccounts.length > 0 && (
                <div className="end-of-records-msg">
                  All linked sub-accounts loaded successfully.
                </div>
              )}
            </div>
          )}

        </section>
      )}


      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        onClose={() => setIsAddAccountModalOpen(false)}
        customerData={customer}
        refreshData={handleRefreshData}
      />

      <ManageAliasModal
        isOpen={isAliasModalOpen}
        onClose={() => setIsAliasModalOpen(false)}
        accountNumber={selectedAccount?.account_number || ''}
        plateNumber={selectedAccount?.plate_number || ''}
        accountType={selectedAccount?.type}
        existingAlias={selectedAccount?.alias || ''}
        refreshData={handleRefreshData}
      />

      <ManagePlateModal
        isOpen={isUpdatePlateModalOpen}
        onClose={() => setIsUpdatePlateModalOpen(false)}
        accountNumber={selectedAccount?.account_number || ''}
        plateNumber={selectedAccount?.plate_number || ''}
        accountType={selectedAccount?.type}
        refreshData={handleRefreshData}
      />

      <DeleteSubAccountModal
        isOpen={isDeleteSubAccountModalOpen}
        onClose={() => setIsDeleteSubAccountModalOpen(false)}
        accountNumber={selectedAccount?.account_number || ''}
        plateNumber={selectedAccount?.plate_number || ''}
        refreshData={handleRefreshData}
      />

      <GenerateSoaModal
        isOpen={isGenerateSoaModalOpen}
        onClose={() => setIsGenerateSoaModalOpen(false)}
        customerEmail={customer?.email}
        accountNumber={selectedAccount?.account_number || ''}
      />

      {/* Floating Action Back to Top Button */}
      <button
        type="button"
        className={`floating-top-btn ${showBackToTop ? "visible" : ""}`}
        onClick={scrollToTop}
        title="Scroll to Top"
        aria-label="Scroll to top"
      >
        <FiChevronUp />
      </button>
    </>
  );
}