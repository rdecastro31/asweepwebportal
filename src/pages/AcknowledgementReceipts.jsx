import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
    FiChevronRight
} from "react-icons/fi";

// 1. Import react-datepicker and its stylesheet
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { fetchSubAccounts, formatPeso, handleLogout } from "../constants/helpers";

import "../styles/receipts.css";
import SearchableDropdown from "../components/Utilities/SearchableDropdown";
import { API_URL } from "../constants/constants";
import moment from "moment";
import { ViewARModal } from "../components/Modals/ViewARModal";
import { showAlert } from "../components/Utilities/ShowAlert";

export default function AcknowledgementReceipts() {
    // Safely acquire initial active customer context from session context layers
    const [customer, setCustomer] = useState(() => {
        const rawSession = sessionStorage.getItem("customer");
        return rawSession ? JSON.parse(rawSession) : null;
    }, []);

    const pdfCacheAR = useRef({});

    // State parameters for sub-accounts pagination
    const [subAccounts, setSubAccounts] = useState([]);
    const [dropdownPage, setDropdownPage] = useState(1);
    const [dropdownHasMore, setDropdownHasMore] = useState(true);
    const [dropdownIsLoading, setDropdownIsLoading] = useState(false);

    // Searchable Account Dropdown Component States
    const [selectedAccount, setSelectedAccount] = useState("");
    const [selectedOR, setSelectedOR] = useState("")

    // Date Picker Filter States (Now initializing with null/Date objects instead of empty strings)
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);

    // Table Data & Interactions State Mapping
    const [receipts, setReceipts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

    // Pagination Configurations (Main Receipts Table)
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);

    //Modal States
    const [isViewARModalOpen, setViewARModalOpen] = useState(false)

    // Get current date constraints (Today is June 25, 2026)
    const todayStr = moment().format('YYYY-MM-DD');

    // Async loader logic to request and append paginated sub-accounts
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

    // Initial load hook execution for the dropdown items
    useEffect(() => {
        loadAccountsData(1, "", true);
    }, [loadAccountsData]);

    // Formulate clean searchable object collection options
    const accountOptions = useMemo(() => {
        if (!customer) return [];
        const accounts = [];

        if (customer.account_number) {
            accounts.push({
                value: customer.account_number,
                label: customer.alias ? `${customer.alias} (${customer.account_number}) [Main]` : `${customer.account_number} [Main]`
            });
        }

        // Avoid adding duplicated instances of the main account if present in API results
        const uniqueSubs = subAccounts.filter((sub) => sub.value !== customer.account_number);

        return [...accounts, ...uniqueSubs];
    }, [customer, subAccounts]);

    // Infinite scroll handler callback attached directly to dropdown context boundaries
    const handleDropdownLoadMore = useCallback((searchQuery) => {
        if (dropdownIsLoading || !dropdownHasMore) return;

        const nextPage = dropdownPage + 1;
        setDropdownPage(nextPage);
        loadAccountsData(nextPage, searchQuery, false);
    }, [dropdownPage, dropdownIsLoading, dropdownHasMore, loadAccountsData]);

    // Prefill default account state arrays on initial load
    useEffect(() => {
        if (accountOptions.length > 0 && !selectedAccount) {
            setSelectedAccount(accountOptions[0].value);
        }
    }, [accountOptions, selectedAccount]);

    // Compute maximum allowable date choice for "Date From" (Up to yesterday, as a Date Object)
    const maxDateFrom = useMemo(() => {
        const d = new Date(todayStr);
        d.setDate(d.getDate() - 1);
        return d;
    }, [todayStr]);

    // Dynamic constraints handler for "Date To" fields (Using Date Objects)
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

    // Reset Date To value if Date From causes previous selection to fall out of bounds
    useEffect(() => {
        if (dateTo && dateToConstraints.min && (dateTo < dateToConstraints.min || dateTo > dateToConstraints.max)) {
            setDateTo(null);
        }
    }, [dateFrom, dateTo, dateToConstraints]);

    // Reset page index back to 1 when search filters alter row lengths
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, entriesPerPage]);

    const handleFetchReceipts = async (e) => {
        e.preventDefault();
        console.log({ "account": selectedAccount, "dateFrom": dateFrom, "dateTo": dateTo })
        setIsLoading(true);
        setHasSearched(true);

        try {
            const fd = new FormData()
            fd.append("tag", "requestar")
            fd.append("account_number", selectedAccount)
            fd.append("date_from", moment(dateFrom).format('M/D/YYYY'))
            fd.append("date_to", moment(dateTo).format('M/D/YYYY'))

            const response = await fetch(`${API_URL}/index.php`, {
                method: "POST",
                credentials: "include",
                body: fd,
            })

            if (response.status === 401) {
                await handleLogout(setCustomer)
                return null
            }

            if (!response.ok) {
                throw new Error(`Accounts request failed with status: ${response.status}`)
            }

            // 1. Parse the JSON response
            const result = await response.json();

            // 2. Validate and map the data to match your MOCK_RECEIPTS format
            if (result && result.success === 1 && Array.isArray(result.data)) {
                const formattedReceipts = result.data.map((item, index) => ({
                    id: item.ORNumber || index, // Using ORNumber or index as a fallback unique ID
                    date: item.TRANSACTION_DATE,
                    paymentName: item.COLLECTING_AGENT,
                    amount: Number(item.AMOUNT), // Ensures it stays a number type
                    orNumber: item.ORNumber
                }));

                // 3. Update your component state (Replace 'setReceipts' with your actual state setter)
                setReceipts(formattedReceipts);
            } else {
                // Handle cases where api returns success: 0 or missing data array
                setReceipts([]);
                console.warn(result.msg || "No data found");
            }

        } catch (e) {
            console.error("Request AR", e);
            // Optional: clear receipts or set error state on failure
            // setReceipts([]); 
        } finally {
            setIsLoading(false);
        }
    };

    // Sorting Handler Logic
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    // Filtered and Sorted global records
    const filteredAndSortedReceipts = useMemo(() => {
        let items = [...receipts];

        if (searchTerm.trim() !== "") {
            const query = searchTerm.toLowerCase();
            items = items.filter(
                (item) =>
                    item.orNumber.toLowerCase().includes(query) ||
                    item.paymentName.toLowerCase().includes(query) ||
                    item.amount.toString().includes(query)
            );
        }

        if (sortConfig.key) {
            items.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === "asc" ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === "asc" ? 1 : -1;
                }
                return 0;
            });
        }

        return items;
    }, [receipts, searchTerm, sortConfig]);

    // Slice Dataset specifically for Active Page window bounds
    const processedReceipts = useMemo(() => {
        const startIndex = (currentPage - 1) * entriesPerPage;
        return filteredAndSortedReceipts.slice(startIndex, startIndex + entriesPerPage);
    }, [filteredAndSortedReceipts, currentPage, entriesPerPage]);

    const totalPages = useMemo(() => {
        return Math.ceil(filteredAndSortedReceipts.length / entriesPerPage) || 1;
    }, [filteredAndSortedReceipts, entriesPerPage]);

    const entryMetrics = useMemo(() => {
        const total = filteredAndSortedReceipts.length;
        if (total === 0) return { from: 0, to: 0, total: 0 };
        const from = (currentPage - 1) * entriesPerPage + 1;
        const to = Math.min(currentPage * entriesPerPage, total);
        return { from, to, total };
    }, [filteredAndSortedReceipts, currentPage, entriesPerPage]);

    const totalAmountSum = useMemo(() => {
        return filteredAndSortedReceipts.reduce((sum, item) => sum + item.amount, 0);
    }, [filteredAndSortedReceipts]);

    const SortIndicator = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <div className="sort-arrows-icon"><FiChevronUp /><FiChevronDown /></div>;
        return sortConfig.direction === "asc" ? <FiChevronUp className="sort-active" /> : <FiChevronDown className="sort-active" />;
    };

    const handleReceiptPdfAction = useCallback(async (orNumber, action = 'view') => {
        if (!orNumber) return null;

        // Ensure you point to .current!
        let fileURL = pdfCacheAR.current[orNumber];

        if (!fileURL) {
            try {
                const fd = new FormData();
                fd.append("tag", "requestarfile");
                fd.append("ar_number", orNumber);

                const response = await fetch(`${API_URL}/index.php`, {
                    method: "POST",
                    credentials: "include",
                    body: fd,
                });

                if (response.status === 401) {
                    // Adjust to your existing logout trigger logic
                    await handleLogout(setCustomer);
                    return null;
                }

                if (!response.ok) {
                    throw new Error(`PDF request failed with status: ${response.status}`);
                }

                const pdfBlob = await response.blob();
                fileURL = window.URL.createObjectURL(pdfBlob);

                // Save it to the cache .current reference
                pdfCacheAR.current[orNumber] = fileURL;

            } catch (error) {
                console.error("Error retrieving PDF document:", error);
                showAlert({ mode: "error", message: "Unable to process document request." });
                return null;
            }
        }

        // Execute background system UI layouts
        if (action === 'download') {
            const timestamp = moment().format('YYYYMMDD_HHmmss');
            const downloadLink = document.createElement("a");
            downloadLink.href = fileURL;
            downloadLink.download = `AR_${orNumber}_${timestamp}.pdf`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }

        return fileURL;
    }, []); // Wrapped in useCallback since you pass it down as a prop to ViewARModal

    const handleOpenModalViewer = (orNumber) => {
        setSelectedOR(orNumber);
        setViewARModalOpen(true);
    };

    return (
        <>
            <section className="receipts-hero">
                <div>
                    <span className="receipts-badge">Transaction Records</span>
                    <h1>Acknowledgement Receipts</h1>
                    <p>
                        View, search, filter, verify, and download official Acknowledgement Receipts (ARs) for your corporate or personal Autosweep RFID transactions.
                    </p>
                </div>
                <div className="hero-icon-wrapper">
                    <FiFileText />
                </div>
            </section>

            {/* Control Filter Matrix Block */}
            <section className="filter-control-panel">
                <form onSubmit={handleFetchReceipts} className="filter-form-layout">

                    {/* SEARCHABLE DROPDOWN MATRIX COMPONENT */}
                    <SearchableDropdown
                        label="Select Account No."
                        placeholder="Type to search accounts..."
                        options={accountOptions}
                        selectedValue={selectedAccount}
                        onSelect={setSelectedAccount}
                        icon={FiCreditCard}
                        onLoadMore={handleDropdownLoadMore}
                        hasMore={dropdownHasMore}
                        isLoadingMore={dropdownIsLoading}
                        required
                    />

                    {/* Date From (Adapted to DatePicker) */}
                    <div className="input-field-group">
                        <label htmlFor="dateFrom">Date From</label>
                        <div className="date-input-wrapper">
                            <FiCalendar className="field-icon" />
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

                    {/* Date To (Adapted to DatePicker) */}
                    <div className="input-field-group">
                        <label htmlFor="dateTo">Date To</label>
                        <div className="date-input-wrapper">
                            <FiCalendar className="field-icon" />
                            <DatePicker
                                id="dateTo"
                                selected={dateTo}
                                onChange={(date) => setDateTo(date)}
                                minDate={dateToConstraints.min}
                                maxDate={dateToConstraints.max}
                                disabled={!dateFrom || dateToConstraints.disabled}
                                dateFormat="MM/dd/yyyy"
                                autoComplete="off"
                                placeholderText={!dateFrom ? "Choose timeframe" : "mm/dd/yyyy"}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-submit-wrapper">
                        <button type="submit" className="fetch-records-btn" disabled={isLoading}>
                            {isLoading ? "Fetching..." : "Fetch Receipts"}
                            <FiArrowRight />
                        </button>
                    </div>
                </form>
            </section>

            {hasSearched && (
                <>
                    {/* Real-time Dynamic Results Analytics Strip */}
                    <section className="receipts-analytics-strip">
                        <div className="analytic-pill-card">
                            <span>Total Value Matches</span>
                            <strong>{formatPeso(totalAmountSum)}</strong>
                        </div>
                        <div className="analytic-pill-card">
                            <span>Matched Documents</span>
                            <strong>{filteredAndSortedReceipts.length} Entries</strong>
                        </div>
                    </section>

                    {/* Core Structured Datagrid Wrapper */}
                    <section className="datatable-view-container">
                        <div className="datatable-header-actions">
                            <div className="entries-selector-layout">
                                <span>Show</span>
                                <select
                                    className="entries-dropdown-select"
                                    value={entriesPerPage}
                                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                                <span>entries</span>
                            </div>

                            <div className="table-search-box-wrapper">
                                <FiSearch className="table-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Quick search parameters..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="table-search-input"
                                />
                            </div>
                        </div>

                        <div className="responsive-table-overflow">
                            <table className="custom-dashboard-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort("date")} className="sortable-th">
                                            <div className="th-content-layout">Date Timestamp <SortIndicator columnKey="date" /></div>
                                        </th>
                                        <th onClick={() => handleSort("paymentName")} className="sortable-th">
                                            <div className="th-content-layout">Payment Method <SortIndicator columnKey="paymentName" /></div>
                                        </th>
                                        <th onClick={() => handleSort("amount")} className="sortable-th text-right">
                                            <div className="th-content-layout justify-end">Amount <SortIndicator columnKey="amount" /></div>
                                        </th>
                                        <th onClick={() => handleSort("orNumber")} className="sortable-th">
                                            <div className="th-content-layout">OR / Receipt Number <SortIndicator columnKey="orNumber" /></div>
                                        </th>
                                        <th className="text-center">Action Context</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        Array.from({ length: entriesPerPage }).map((_, idx) => (
                                            <tr key={`ar-skeleton-${idx}`} className="ar-skeleton-row">
                                                <td>
                                                    <div className="ar-skeleton-line ar-skeleton-text short"></div>
                                                    <div className="ar-skeleton-line ar-skeleton-text micro"></div>
                                                </td>
                                                <td>
                                                    <div className="ar-skeleton-line ar-skeleton-badge"></div>
                                                </td>
                                                <td className="text-right">
                                                    <div className="ar-skeleton-line ar-skeleton-text short" style={{ float: 'right' }}></div>
                                                </td>
                                                <td>
                                                    <div className="ar-skeleton-line ar-skeleton-code"></div>
                                                </td>
                                                <td className="text-center">
                                                    <div className="ar-skeleton-line ar-skeleton-btn-group"></div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : processedReceipts.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="table-empty-state">No Acknowledgement Receipts (AR) match your current search parameter constraints.</td>
                                        </tr>
                                    ) : (
                                        processedReceipts.map((receipt) => (
                                            <tr key={receipt.id}>
                                                <td className="timestamp-cell">
                                                    {new Date(receipt.date).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                    })}{" "}
                                                    <span className="sub-time">
                                                        {new Date(receipt.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`payment-badge ${receipt.paymentName.toLowerCase()}`}>
                                                        {receipt.paymentName}
                                                    </span>
                                                </td>
                                                <td className="text-right weight-bold color-primary">
                                                    {formatPeso(receipt.amount)}
                                                </td>
                                                <td>
                                                    <code className="receipt-code-block">{receipt.orNumber}</code>
                                                </td>
                                                <td className="text-center">
                                                    <div className="table-action-button-group">
                                                        <button
                                                            className="row-action-btn primary"
                                                            title="View AR Details"
                                                            onClick={() => handleOpenModalViewer(receipt.orNumber)}
                                                        >
                                                            <FiEye /> View
                                                        </button>
                                                        <button
                                                            className="row-action-btn secondary"
                                                            title="Download AR PDF"
                                                            onClick={() => handleReceiptPdfAction(receipt.orNumber, 'download')}
                                                        >
                                                            <FiDownload />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginated Controller Footer Panel */}
                        <div className="datatable-footer-summary-layout">
                            <span className="entries-tracker-txt">
                                Showing {entryMetrics.from} to {entryMetrics.to} of {entryMetrics.total} entries
                            </span>

                            <div className="pagination-controls-wrapper">
                                <button
                                    className="pagination-arrow-btn"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    type="button"
                                    aria-label="Previous Page"
                                >
                                    <FiChevronLeft />
                                </button>

                                {Array.from({ length: totalPages }, (_, idx) => {
                                    const pageNum = idx + 1;
                                    return (
                                        <button
                                            key={pageNum}
                                            type="button"
                                            className={`pagination-number-btn ${currentPage === pageNum ? "active-page" : ""}`}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    className="pagination-arrow-btn"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    type="button"
                                    aria-label="Next Page"
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    </section>
                </>
            )}

            <ViewARModal
                isOpen={isViewARModalOpen}
                onClose={() => setViewARModalOpen(false)}
                orNumber={selectedOR}
                accountNumber={selectedAccount}
                handleReceiptPdfAction={handleReceiptPdfAction}
            />
        </>
    );
}