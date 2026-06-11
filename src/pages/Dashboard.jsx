import { useEffect, useMemo, useState } from "react";
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
  FiFolderPlus,
} from "react-icons/fi";
import { API_URL } from "../constants/constants";
import PortalHeader from "../components/PortalHeader";
import PortalSidebar from "../components/PortalSidebar";
import PortalFooter from "../components/PortalFooter";
import "../styles/portal-layout.css";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [customer, setCustomer] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const demoAccounts = [
    {
      id: 1,
      type: "Main Account",
      account_number: "2382801",
      plate_number: "N/A",
      alias: "Primary Autosweep Account",
      balance: 3245.5,
      status: "Active",
      last_updated: "Today, 9:42 AM",
    },
    {
      id: 2,
      type: "Sub Account",
      account_number: "2382801",
      plate_number: "ABC1234",
      alias: "Family SUV",
      balance: 1245.5,
      status: "Active",
      last_updated: "Today, 9:40 AM",
    },
    {
      id: 3,
      type: "Sub Account",
      account_number: "2382801",
      plate_number: "XYZ9876",
      alias: "Office Car",
      balance: 530,
      status: "Active",
      last_updated: "Today, 8:15 AM",
    },
  ];

  useEffect(() => {
    const storedCustomer = sessionStorage.getItem("customer");

    if (storedCustomer) {
      setCustomer(JSON.parse(storedCustomer));
    }

    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("tag", "getaccounts");

      const response = await fetch(`${API_URL}/customer.php`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const result = await response.json();

      if (Number(result.success) === 1) {
        setAccounts(result.data || []);
      } else {
        setAccounts(demoAccounts);
      }
    } catch {
      setAccounts(demoAccounts);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      alert("Category name is required.");
      return;
    }

    setCategorySubmitting(true);

    try {
      const fd = new FormData();
      fd.append("tag", "addcategory");
      fd.append("userid", customer?.id || "");
      fd.append("category_name", categoryName.trim());
      fd.append("description", description.trim());

      const response = await fetch(`${API_URL}/usertest.php`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const result = await response.json();

      if (Number(result.success) === 1) {
        alert(result.message || "Category added successfully.");
        setCategoryName("");
        setDescription("");
      } else {
        alert(result.message || "Failed to add category.");
      }
    } catch (error) {
      alert("Something went wrong while adding category.");
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleLogout = async () => {
    const fd = new FormData();
    fd.append("tag", "logout");

    await fetch(`${API_URL}/usertest.php`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });

    sessionStorage.removeItem("customer");
    window.location.href = "/";
  };

  const formatPeso = (amount) => {
    const value = Number(amount || 0);

    return value.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  };

  const mainAccount = useMemo(() => {
    return accounts.find((item) => item.type === "Main Account") || accounts[0];
  }, [accounts]);

  const subAccounts = useMemo(() => {
    return accounts.filter((item) => item.type !== "Main Account");
  }, [accounts]);

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, item) => sum + Number(item.balance || 0), 0);
  }, [accounts]);

  const lowBalanceCount = useMemo(() => {
    return accounts.filter((item) => Number(item.balance || 0) < 700).length;
  }, [accounts]);

  const AccountActionButton = ({ icon, label }) => (
    <button type="button" className="account-action-btn">
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="portal-page">
      <PortalHeader customer={customer} onLogout={handleLogout} />

      <div className="portal-body">
        <PortalSidebar />

        <main className="portal-content">
          <section className="dashboard-hero">
            <div>
              <span className="dashboard-label">
                Customer Self-Service Portal
              </span>

              <h1>Hello, {customer?.fullname || "Customer"}</h1>

              <p>
                View your main Autosweep account, manage linked RFID vehicles,
                monitor balances, download statements, and review transaction
                activity.
              </p>
            </div>

            <button
              type="button"
              className="add-account-btn"
              onClick={handleAddCategory}
              disabled={categorySubmitting}
            >
              <FiPlusCircle />
              {categorySubmitting ? "Saving..." : "Add Category"}
            </button>
          </section>

          <section className="category-add-panel">
            <div className="section-header">
              <div>
                <h2>Add Category</h2>
                <p>Create a new category using your authenticated session.</p>
              </div>
            </div>

            <div className="category-form-grid">
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>

              <button
                type="button"
                className="category-save-btn"
                onClick={handleAddCategory}
                disabled={categorySubmitting}
              >
                <FiFolderPlus />
                {categorySubmitting ? "Saving..." : "Save Category"}
              </button>
            </div>
          </section>

          <section className="dashboard-kpis">
            <div className="kpi-card">
              <FiCreditCard />
              <div>
                <span>Total Balance</span>
                <strong>{formatPeso(totalBalance)}</strong>
              </div>
            </div>

            <div className="kpi-card">
              <FiTruck />
              <div>
                <span>Linked RFID Accounts</span>
                <strong>{accounts.length}</strong>
              </div>
            </div>

            <div className="kpi-card">
              <FiClock />
              <div>
                <span>Low Balance Alerts</span>
                <strong>{lowBalanceCount}</strong>
              </div>
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

              {loading ? (
                <div className="empty-card">Loading account details...</div>
              ) : (
                <div className="main-account-card">
                  <div className="main-account-top">
                    <div className="account-icon-large">
                      <FiUser />
                    </div>

                    <div>
                      <span className="account-type main">Main Account</span>
                      <h3>{mainAccount?.alias || "Primary Account"}</h3>
                      <p>Account No. {mainAccount?.account_number || "N/A"}</p>
                    </div>
                  </div>

                  <div className="main-balance-box">
                    <span>Total Available Balance</span>
                    <strong>{formatPeso(mainAccount?.balance)}</strong>
                    <small>
                      Last updated: {mainAccount?.last_updated || "N/A"}
                    </small>
                  </div>

                  <div className="main-account-actions">
                    <AccountActionButton
                      icon={<FiRefreshCw />}
                      label="Check Balance"
                    />
                    <AccountActionButton
                      icon={<FiDownload />}
                      label="Download SOA"
                    />
                    <AccountActionButton
                      icon={<FiActivity />}
                      label="Transactions"
                    />
                    <AccountActionButton
                      icon={<FiEdit3 />}
                      label="Assign Alias"
                    />
                  </div>
                </div>
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
                <button type="button" onClick={handleAddCategory}>
                  <FiFolderPlus />
                  <div>
                    <strong>Add Category</strong>
                    <span>Create a new customer category</span>
                  </div>
                  <FiChevronRight />
                </button>

                <button type="button">
                  <FiFileText />
                  <div>
                    <strong>Generate SOA</strong>
                    <span>Download statement of account</span>
                  </div>
                  <FiChevronRight />
                </button>

                <button type="button">
                  <FiActivity />
                  <div>
                    <strong>View History</strong>
                    <span>Check recent RFID transactions</span>
                  </div>
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </section>

          <section className="accounts-section">
            <div className="section-header">
              <div>
                <h2>Sub Accounts</h2>
                <p>
                  Vehicles and RFID tags linked under your main customer
                  account.
                </p>
              </div>

              <span className="sub-count-pill">
                {subAccounts.length} linked vehicles
              </span>
            </div>

            {loading ? (
              <div className="empty-card">Loading sub accounts...</div>
            ) : (
              <div className="sub-account-list">
                {subAccounts.map((account) => (
                  <div className="sub-account-row" key={account.id}>
                    <div className="vehicle-icon">
                      <FiTruck />
                    </div>

                    <div className="sub-account-main">
                      <div className="sub-account-title">
                        <h3>{account.alias || "Unnamed Vehicle"}</h3>

                        <span
                          className={`status-pill ${
                            account.status === "Low Balance" ? "warning" : ""
                          }`}
                        >
                          {account.status}
                        </span>
                      </div>

                      <div className="sub-account-meta">
                        <span>Account No. {account.account_number}</span>
                        <span>Plate No. {account.plate_number}</span>
                        <span>Updated {account.last_updated}</span>
                      </div>
                    </div>

                    <div className="sub-balance">
                      <span>Balance</span>
                      <strong>{formatPeso(account.balance)}</strong>
                    </div>

                    <div className="sub-actions">
                      <AccountActionButton
                        icon={<FiRefreshCw />}
                        label="Balance"
                      />
                      <AccountActionButton
                        icon={<FiDownload />}
                        label="SOA"
                      />
                      <AccountActionButton
                        icon={<FiActivity />}
                        label="History"
                      />
                      <AccountActionButton icon={<FiEdit3 />} label="Alias" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <PortalFooter />
    </div>
  );
}