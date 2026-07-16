import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
    FiFileText,
    FiSearch,
    FiCalendar,
    FiCreditCard,
    FiArrowRight,
    FiEye,
    FiDownload,
    FiChevronUp,
    FiChevronDown,
    FiChevronLeft,
    FiChevronRight,
    FiLayers
} from "react-icons/fi";

// 1. Import react-datepicker component and its style module
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Import moment for API date formatting consistent with your backend tags
import moment from "moment";

// Assuming API_URL and handleLogout exist or are passed down. Define/Import safely.
import { fetchSubAccounts, formatPeso, handleLogout } from "../constants/helpers";
import '../styles/salesinvoice.css'
import '../styles/modals/swalsierror.css';
import SearchableDropdown from "../components/Utilities/SearchableDropdown";
import { API_URL } from "../constants/constants";
import { ViewSIModal } from "../components/Modals/ViewSIModal";
import Swal from "sweetalert2";

export default function SalesInvoice() {
    // Session state hydration block layers
    const [customer, setCustomer] = useState(() => {
        const rawSession = sessionStorage.getItem("customer");
        return rawSession ? JSON.parse(rawSession) : null;
    });

    const pdfCacheSI = useRef({});

    // Sub-accounts pagination configurations
    const [subAccounts, setSubAccounts] = useState([]);
    const [dropdownPage, setDropdownPage] = useState(1);
    const [dropdownHasMore, setDropdownHasMore] = useState(false);
    const [dropdownIsLoading, setDropdownIsLoading] = useState(false);

    // Filter Controls Mapping States
    const [selectedAccount, setSelectedAccount] = useState("");
    const [selectedTrxnTagId, setSelectedTrxnTagId] = useState(null)
    const [selectedSegmentId, setSelectedSegmentId] = useState(null)

    // Date Picker Filter States
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);

    // Structured Grid States
    const [invoices, setInvoices] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

    // Inner Datagrid Pagination Parameters
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    //Modal States
    const [isViewSIModalOpen, setViewSIModalOpen] = useState(false)

    //Disable Row
    const [disabledInvoices, setDisabledInvoices] = useState({});

    const todayStr = moment().format('YYYY-MM-DD');

    // Async data loader tracking sub-accounts profiles
    const loadAccountsData = useCallback(async (pageNum, searchStr = "", isNewSearch = false) => {
        if (!customer?.email) return;

        setDropdownIsLoading(true);
        try {
            const resJson = await fetchSubAccounts({
                email: customer.email,
                page: pageNum,
                search: searchStr,
                setCustomer,
            });

            if (resJson && resJson.data) {
                const formattedSubs = resJson.data.map((sub) => ({
                    value: sub.account_number,
                    label: sub.alias ? `${sub.alias} (${sub.account_number})` : sub.account_number,
                }));

                setSubAccounts((prev) => (isNewSearch ? formattedSubs : [...prev, ...formattedSubs]));
                setDropdownHasMore(resJson.has_more || formattedSubs.length === 10);
            } else {
                setDropdownHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load sub-accounts:", error);
        } finally {
            setDropdownIsLoading(false);
        }
    }, [customer, setCustomer]);

    // Initial effect loader pipeline hook
    useEffect(() => {
        loadAccountsData(1, "", true);
    }, [loadAccountsData]);

    // Format available options parsing main and sub accounts safely
    const accountOptions = useMemo(() => {
        if (!customer) return [];
        const accounts = [];

        if (customer.account_number) {
            accounts.push({
                value: customer.account_number,
                label: customer.alias ? `${customer.alias} (${customer.account_number}) [Main]` : `${customer.account_number} [Main]`
            });
        }

        const uniqueSubs = subAccounts.filter((sub) => sub.value !== customer.account_number);
        return [...accounts, ...uniqueSubs];
    }, [customer, subAccounts]);

    // Handle Infinite scrolling events on dropdown targets
    const handleDropdownLoadMore = useCallback((searchQuery) => {
        if (dropdownIsLoading || !dropdownHasMore) return;

        const nextPage = dropdownPage + 1;
        setDropdownPage(nextPage);
        loadAccountsData(nextPage, searchQuery, false);
    }, [dropdownPage, dropdownIsLoading, dropdownHasMore, loadAccountsData]);

    // Pre-fill selection filters sequentially
    useEffect(() => {
        if (accountOptions.length > 0 && !selectedAccount) {
            setSelectedAccount(accountOptions[0].value);
        }
    }, [accountOptions, selectedAccount]);

    // Maximum boundary limit evaluation rules for "Date From"
    const maxDateFrom = useMemo(() => {
        const d = new Date(todayStr);
        d.setDate(d.getDate() - 1);
        return d;
    }, [todayStr]);

    // Dynamic constraints matrix evaluation context for "Date To" field
    const dateToConstraints = useMemo(() => {
        if (!dateFrom) return { min: null, max: null, disabled: true };

        const year = dateFrom.getFullYear();
        const month = dateFrom.getMonth();

        const minDateObj = new Date(year, month, dateFrom.getDate() + 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const yesterdayObj = new Date(todayStr);
        yesterdayObj.setDate(yesterdayObj.getDate() - 1);

        const finalMaxObj = lastDayOfMonth < yesterdayObj ? lastDayOfMonth : yesterdayObj;

        return {
            min: minDateObj,
            max: finalMaxObj,
            disabled: minDateObj > finalMaxObj
        };
    }, [dateFrom, todayStr]);

    // Bounds compliance monitor effect loop
    useEffect(() => {
        if (dateTo && dateToConstraints.min && (dateTo < dateToConstraints.min || dateTo > dateToConstraints.max)) {
            setDateTo(null);
        }
    }, [dateFrom, dateTo, dateToConstraints]);

    // Pagination dynamic tracking baseline metrics
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, entriesPerPage]);

    // Asynchronous network dynamic expansion loading sub-rows breakdown
    const toggleRow = async (id) => {
        const isCurrentlyExpanded = !!expandedRows[id];

        if (isCurrentlyExpanded) {
            setExpandedRows(prev => ({ ...prev, [id]: false }));
            return;
        }

        setExpandedRows(prev => ({ ...prev, [id]: true }));
        const targetInvoice = invoices.find(inv => inv.id === id);

        if (!targetInvoice || (targetInvoice.breakdown && targetInvoice.breakdown.length > 0)) {
            return;
        }

        try {
            const fd = new FormData();
            fd.append("tag", "requestsibreakdown");
            fd.append("account_number", selectedAccount);
            fd.append("tag_trxn_id", targetInvoice.transId);

            const response = await fetch(`${API_URL}/index.php`, {
                method: "POST",
                credentials: "include",
                body: fd,
            });

            if (response.status === 401) {
                await handleLogout(setCustomer);
                return;
            }

            if (!response.ok) throw new Error("Sub cost breakdown acquisition failed");

            const result = await response.json();

            if (result && result.success === 1 && Array.isArray(result.data)) {
                const formattedBreakdown = result.data.map((item) => ({
                    id: item.ID,
                    entry: item.EntryPlaza,
                    exit: item.ExitPlaza,
                    amount: parseFloat(item.TollTotall || 0)
                }));

                setInvoices(prevInvoices =>
                    prevInvoices.map(inv =>
                        inv.id === id ? { ...inv, breakdown: formattedBreakdown } : inv
                    )
                );
            }
        } catch (error) {
            console.error("Error fetching SI breakdown layout data:", error);
        }
    };

    // Live asynchronous search interface fetching main context rows
    const handleFetchInvoices = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setHasSearched(true);
        setExpandedRows({});

        try {
            const fd = new FormData();
            fd.append("tag", "requestsi");
            fd.append("account_number", selectedAccount);
            fd.append("date_from", moment(dateFrom).format('M/D/YYYY'));
            fd.append("date_to", moment(dateTo).format('M/D/YYYY'));

            const response = await fetch(`${API_URL}/index.php`, {
                method: "POST",
                credentials: "include",
                body: fd,
            });

            if (response.status === 401) {
                await handleLogout(setCustomer);
                return null;
            }

            if (!response.ok) {
                throw new Error(`Invoices server synchronization failed: ${response.status}`);
            }

            const result = await response.json();

            if (result && result.success === 1 && Array.isArray(result.data)) {
                const formattedData = result.data.map((item, idx) => ({
                    id: item.TagTransID || idx,
                    transId: String(item.TagTransID),
                    date: item.ExitDateTime,
                    entry: item.EntryPlaza,
                    exit: item.ExitPlaza,
                    amount: parseFloat(item.Amount || 0),
                    breakdown: []
                }));
                setInvoices(formattedData);
            } else {
                setInvoices([]);
            }
        } catch (error) {
            console.error("Request SI error logs:", error);
            setInvoices([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedInvoices = useMemo(() => {
        let items = [...invoices];

        if (searchTerm.trim() !== "") {
            const query = searchTerm.toLowerCase();
            items = items.filter(item =>
                item.transId.toLowerCase().includes(query) ||
                item.entry.toLowerCase().includes(query) ||
                item.exit.toLowerCase().includes(query) ||
                item.amount.toString().includes(query)
            );
        }

        if (sortConfig.key) {
            items.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        return items;
    }, [invoices, searchTerm, sortConfig]);

    const processedInvoices = useMemo(() => {
        const startIndex = (currentPage - 1) * entriesPerPage;
        return filteredAndSortedInvoices.slice(startIndex, startIndex + entriesPerPage);
    }, [filteredAndSortedInvoices, currentPage, entriesPerPage]);

    const totalPages = useMemo(() => Math.ceil(filteredAndSortedInvoices.length / entriesPerPage) || 1, [filteredAndSortedInvoices, entriesPerPage]);

    const entryMetrics = useMemo(() => {
        const total = filteredAndSortedInvoices.length;
        if (total === 0) return { from: 0, to: 0, total: 0 };
        const from = (currentPage - 1) * entriesPerPage + 1;
        const to = Math.min(currentPage * entriesPerPage, total);
        return { from, to, total };
    }, [filteredAndSortedInvoices, currentPage, entriesPerPage]);

    const SortIndicator = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <div className="si-sort-arrows"><FiChevronUp /><FiChevronDown /></div>;
        return sortConfig.direction === "asc" ? <FiChevronUp className="si-sort-active" /> : <FiChevronDown className="si-sort-active" />;
    };

    const handleInvoicePdfAction = useCallback(async (trxnTagId, segmentId, action = 'view') => {
        if (!trxnTagId || !segmentId) return null;

        const cacheKey = `${trxnTagId}_${segmentId}`;
        let fileURL = pdfCacheSI.current[cacheKey];

        if (!fileURL) {
            try {
                const fd = new FormData();
                fd.append("tag", "requestsifile");
                fd.append("trxn_tag_id", trxnTagId);
                fd.append("segment_id", segmentId);

                const response = await fetch(`${API_URL}/index.php`, {
                    method: "POST",
                    credentials: "include",
                    body: fd,
                });

                if (response.status === 401) {
                    await handleLogout(setCustomer);
                    return null;
                }

                // 2. CRITICAL DETECTOR: Read headers to check if server sent JSON error instead of PDF stream
                const contentType = response.headers.get("content-type") || "";
                if (contentType.includes("application/json") || !response.ok) {

                    // Parse out the exact error parameters sent back by PHP
                    const errorData = await response.json().catch(() => ({ msg: "Unable to Fetch SI File" }));

                    // Disable rows layout tracking state
                    setDisabledInvoices(prev => ({
                        ...prev,
                        [cacheKey]: true
                    }));

                    // 3. Fire styled SweetAlert2 Modal matching your layout standards
                    Swal.fire({
                        html: `
                        <div class="si-error-wrapper">
                            <div class="si-error-header">
                                <h2>Sales Invoice Unavailable</h2>
                                <p>The requested Sales Invoice document cannot be retrieved from the server at this moment</p>
                            </div>
                        </div>
                    `,
                        customClass: {
                            container: 'swal-si-container',
                            popup: 'swal-si-popup',
                            htmlContainer: 'swal-si-html-container',
                            actions: 'swal-si-actions',
                            confirmButton: 'swal-si-confirm-btn'
                        },
                        buttonsStyling: false,
                        confirmButtonText: 'Acknowledge',
                        showCloseButton: false,
                        allowOutsideClick: false
                    });

                    return null;
                }

                // If it is a clean application/pdf binary file, stream normally
                const pdfBlob = await response.blob();
                fileURL = window.URL.createObjectURL(pdfBlob);
                pdfCacheSI.current[cacheKey] = fileURL;

            } catch (error) {
                console.error("Error retrieving PDF document:", error);
                return null;
            }
        }

        if (action === 'download' && fileURL) {
            const timestamp = moment().format('YYYYMMDD_HHmmss');
            const downloadLink = document.createElement("a");
            downloadLink.href = fileURL;
            downloadLink.download = `SI_${trxnTagId}_${segmentId}_${timestamp}.pdf`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }

        return fileURL;
    }, []);

    const handleOpenModalViewerSI = (transTagId, segmentId) => {
        setSelectedTrxnTagId(transTagId);
        setSelectedSegmentId(segmentId);
        setViewSIModalOpen(true);
    };

    return (
        <>
            <section className="si-hero-banner">
                <div>
                    <span className="si-hero-badge">Transaction Records</span>
                    <h1>Sales Invoices</h1>
                    <p>Access, audit, and export comprehensive toll usage statements and structural sales invoicing lists linked directly to your RFID tags.</p>
                </div>
                <div className="si-hero-icon"><FiFileText /></div>
            </section>

            <section className="si-filter-panel">
                <form onSubmit={handleFetchInvoices} className="si-filter-grid">
                    <SearchableDropdown
                        label="Select Account No."
                        placeholder="Search Account..."
                        options={accountOptions}
                        selectedValue={selectedAccount}
                        onSelect={setSelectedAccount}
                        icon={FiCreditCard}
                        onLoadMore={handleDropdownLoadMore}
                        hasMore={dropdownHasMore}
                        isLoadingMore={dropdownIsLoading}
                        required
                    />

                    <div className="si-input-group">
                        <label htmlFor="dateFrom">Date From</label>
                        <div className="si-date-wrapper">
                            <FiCalendar className="si-field-icon" />
                            <DatePicker
                                id="dateFrom"
                                selected={dateFrom}
                                onChange={(date) => setDateFrom(date)}
                                maxDate={maxDateFrom}
                                dateFormat="MM/dd/yyyy"
                                placeholderText="mm/dd/yyyy"
                                autoComplete="off"
                                required
                            />
                        </div>
                    </div>

                    <div className="si-input-group">
                        <label htmlFor="dateTo">Date To</label>
                        <div className="si-date-wrapper">
                            <FiCalendar className="si-field-icon" />
                            <DatePicker
                                id="dateTo"
                                selected={dateTo}
                                onChange={(date) => setDateTo(date)}
                                minDate={dateToConstraints.min}
                                maxDate={dateToConstraints.max}
                                disabled={!dateFrom || dateToConstraints.disabled}
                                dateFormat="MM/dd/yyyy"
                                autoComplete="off"
                                placeholderText={!dateFrom ? "Select Timeframe" : "mm/dd/yyyy"}
                                required
                            />
                        </div>
                    </div>

                    <div className="si-btn-wrapper">
                        <button type="submit" className="si-fetch-btn" disabled={isLoading}>
                            {isLoading ? "Loading..." : "Fetch Invoices"}
                            <FiArrowRight />
                        </button>
                    </div>
                </form>
            </section>

            {hasSearched && (
                <section className="si-table-container">
                    <div className="si-table-toolbar">
                        <div className="si-entries-layout">
                            <span>Show</span>
                            <select className="si-entries-select" value={entriesPerPage} onChange={(e) => setEntriesPerPage(Number(e.target.value))}>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span>entries</span>
                        </div>

                        <div className="si-table-search-box-wrapper">
                            <FiSearch className="si-table-search-icon" />
                            <input
                                type="text"
                                placeholder="Quick search parameters..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="si-table-search-input"
                            />
                        </div>
                    </div>

                    <div className="si-responsive-overflow">
                        <table className="si-main-table">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort("transId")} className="si-sortable-th">
                                        <div className="si-th-content">Transaction ID <SortIndicator columnKey="transId" /></div>
                                    </th>
                                    <th onClick={() => handleSort("date")} className="si-sortable-th">
                                        <div className="si-th-content">Timestamp <SortIndicator columnKey="date" /></div>
                                    </th>
                                    <th onClick={() => handleSort("entry")} className="si-sortable-th">
                                        <div className="si-th-content">Entry Plaza <SortIndicator columnKey="entry" /></div>
                                    </th>
                                    <th onClick={() => handleSort("exit")} className="si-sortable-th">
                                        <div className="si-th-content">Exit Plaza <SortIndicator columnKey="exit" /></div>
                                    </th>
                                    <th onClick={() => handleSort("amount")} className="si-sortable-th si-text-right">
                                        <div className="si-th-content si-justify-end">Amount <SortIndicator columnKey="amount" /></div>
                                    </th>
                                    <th className="si-text-center" style={{ width: '100px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: entriesPerPage }).map((_, idx) => (
                                        <tr key={`si-skeleton-${idx}`} className="si-skeleton-row">
                                            <td>
                                                <div className="si-skeleton-line si-skeleton-badge"></div>
                                            </td>
                                            <td>
                                                <div className="si-skeleton-line si-skeleton-text short"></div>
                                                <div className="si-skeleton-line si-skeleton-text micro"></div>
                                            </td>
                                            <td>
                                                <div className="si-skeleton-line si-skeleton-text medium"></div>
                                            </td>
                                            <td>
                                                <div className="si-skeleton-line si-skeleton-text long"></div>
                                            </td>
                                            <td className="si-text-right">
                                                <div className="si-skeleton-line si-skeleton-text short" style={{ float: 'right' }}></div>
                                            </td>
                                            <td className="si-text-center">
                                                <div className="si-skeleton-line si-skeleton-btn"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : processedInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="si-table-empty">No invoice records found matching criteria.</td>
                                    </tr>
                                ) : (
                                    processedInvoices.map((invoice) => {
                                        const isExpanded = !!expandedRows[invoice.id];
                                        return (
                                            <React.Fragment key={invoice.id}>
                                                <tr className={isExpanded ? "si-row-parent-expanded" : ""}>
                                                    <td className="si-weight-bold si-color-primary">
                                                        <code className="si-code-badge">{invoice.transId}</code>
                                                    </td>
                                                    <td className="si-timestamp">
                                                        {new Date(invoice.date).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })}
                                                        <span className="si-sub-time">
                                                            {new Date(invoice.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                                        </span>
                                                    </td>
                                                    <td>{invoice.entry}</td>
                                                    <td>{invoice.exit}</td>
                                                    <td className="si-text-right si-weight-bold si-color-primary">{formatPeso(invoice.amount)}</td>
                                                    <td className="si-text-center">
                                                        <button
                                                            type="button"
                                                            className={`si-action-btn ${isExpanded ? 'si-btn-active-toggle' : 'si-btn-primary'}`}
                                                            onClick={() => toggleRow(invoice.id)}
                                                            style={{ gap: '4px' }}
                                                        >
                                                            {isExpanded ? "Hide" : "Details"}
                                                            <FiChevronDown style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                        </button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="si-accordion-nested-row">
                                                        <td colSpan="6">
                                                            <div className="si-accordion-wrapper">
                                                                <div className="si-nested-header">
                                                                    <h5>Usage Cost Breakdown Structure</h5>
                                                                    <span>Transaction ID Reference: <strong>{invoice.transId}</strong></span>
                                                                </div>
                                                                <table className="si-nested-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>ID</th>
                                                                            <th>From Plaza</th>
                                                                            <th>To Plaza</th>
                                                                            <th className="si-text-right">Net Value Charged</th>
                                                                            <th className="si-text-center" style={{ width: '160px' }}>Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {!invoice.breakdown || invoice.breakdown.length === 0 ? (
                                                                            <tr>
                                                                                <td colSpan="5" className="si-text-center" style={{ padding: '20px', color: '#888' }}>
                                                                                    Loading segment items breakdown data...
                                                                                </td>
                                                                            </tr>
                                                                        ) : (
                                                                            invoice.breakdown.map((item) => {
                                                                                const isRowDisabled = Boolean(disabledInvoices[`${invoice.transId}_${item.id}`]);
                                                                                return (
                                                                                    <tr key={item.id}>
                                                                                        <td><code className="si-code-badge">{item.id}</code></td>
                                                                                        <td className="si-uppercase">{item.entry}</td>
                                                                                        <td className="si-uppercase">{item.exit}</td>
                                                                                        <td className="si-text-right si-weight-bold si-color-primary">{formatPeso(item.amount)}</td>
                                                                                        <td className="si-text-center">
                                                                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                                                                <button
                                                                                                    className="si-action-btn si-btn-primary"
                                                                                                    title="View PDF Matrix"
                                                                                                    disabled={isRowDisabled}
                                                                                                    onClick={() => handleOpenModalViewerSI(invoice.transId, item.id)}
                                                                                                >
                                                                                                    <FiEye /> View
                                                                                                </button>
                                                                                                <button
                                                                                                    className="si-action-btn si-download-btn"
                                                                                                    title="Download Document Record"
                                                                                                    disabled={isRowDisabled}
                                                                                                    onClick={() => handleInvoicePdfAction(invoice.transId, item.id, 'download')}
                                                                                                >
                                                                                                    <FiDownload />
                                                                                                </button>
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                )
                                                                            })
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="si-footer-summary">
                        <span className="si-tracker-text">Showing {entryMetrics.from} to {entryMetrics.to} of {entryMetrics.total} entries</span>
                        <div className="si-pagination-wrapper">
                            <button className="si-page-arrow" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><FiChevronLeft /></button>
                            {Array.from({ length: totalPages }, (_, idx) => (
                                <button key={idx + 1} className={`si-page-number ${currentPage === idx + 1 ? "si-active-page" : ""}`} onClick={() => setCurrentPage(idx + 1)}>{idx + 1}</button>
                            ))}
                            <button className="si-page-arrow" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}><FiChevronRight /></button>
                        </div>
                    </div>
                </section>
            )}

            <ViewSIModal
                isOpen={isViewSIModalOpen}
                onClose={() => setViewSIModalOpen(false)}
                trxnId={selectedTrxnTagId}
                segmentId={selectedSegmentId}
                accountNumber={selectedAccount}
                handleInvoicePdfAction={handleInvoicePdfAction} // The dual identifier action handler we refactored
            />
        </>
    );
}