import { useState, useMemo, useEffect, useCallback } from "react";
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
  FiMessageSquare,
  FiCreditCard,
  FiAlertCircle,
} from "react-icons/fi";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "../styles/contactus.css";
import "../styles/modals/contactswal.css"; // Uniform modal styling referenced
import SearchableDropdown from "../components/Utilities/SearchableDropdown";
import { fetchSubAccounts } from "../constants/helpers";
import { CUSTOMER_CARE_API_URL, emojiRegex } from "../constants/constants";
import { SelectedAccountInfo } from "../components/Utilities/SelectedAccountInfo";

const ContactSwal = withReactContent(Swal);

const CONCERN_SUBJECTS = [
  "ADA Status",
  "Corporate Account Installation",
  "E-Pass Balance Transfer",
  "Incorrect Charging",
  "Lost Card",
  "Request for SOA",
  "Update Mobile Number",
  "Uncredited Load",
  "Unreadable Sticker",
  "Unable to Register Web Portal/Mobile App",
  "Others",
];

export default function ContactUs() {
  const [customer, setCustomer] = useState(() => {
    const rawSession = sessionStorage.getItem("customer");
    return rawSession ? JSON.parse(rawSession) : null;
  });

  // State parameters for sub-accounts pagination
  const [subAccounts, setSubAccounts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentSearch, setCurrentSearch] = useState("");

  // Form State parameters
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedConcern, setSelectedConcern] = useState("");
  const [messageText, setMessageText] = useState("");

  // Async core loader logic
  const loadAccountsData = useCallback(async (pageNum, searchStr = "", isNewSearch = false) => {
    if (!customer?.email) return;

    setIsLoadingMore(true);
    try {
      const resJson = await fetchSubAccounts({
        email: customer.email,
        page: pageNum,
        search: searchStr,
        setCustomer,
      });

      if (resJson && resJson.data) {
        const formattedSubs = resJson.data.map((sub) => {
          const plateInfo = sub.plate_number ? ` [${sub.plate_number}]` : "";
          return {
            value: JSON.stringify({ account: sub.account_number, plate: sub.plate_number || "" }),
            label: sub.alias
              ? `${sub.alias} (${sub.account_number})${plateInfo}`
              : `${sub.account_number}${plateInfo}`,
          };
        });

        setSubAccounts((prev) => (isNewSearch ? formattedSubs : [...prev, ...formattedSubs]));
        setHasMore(resJson.has_more || formattedSubs.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load sub-accounts:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [customer, setCustomer]);

  // Initial drop fetching trigger
  useEffect(() => {
    loadAccountsData(1, "", true);
  }, [loadAccountsData]);

  // Combines Main Account data + Paginated API Sub Accounts arrays safely
  const accountOptions = useMemo(() => {
    if (!customer) return [];
    const accounts = [];

    if (customer.account_number) {
      const mainPlateInfo = customer.plate_number ? ` [${customer.plate_number}]` : "";
      accounts.push({
        value: JSON.stringify({ account: customer.account_number, plate: customer.plate_number || "" }),
        label: customer.alias
          ? `${customer.alias} (${customer.account_number})${mainPlateInfo} [Main]`
          : `${customer.account_number}${mainPlateInfo} [Main]`,
      });
    }

    const uniqueSubs = subAccounts.filter((sub) => {
      try {
        const parsed = JSON.parse(sub.value);
        return parsed.account !== customer.account_number;
      } catch {
        return true;
      }
    });

    return [...accounts, ...uniqueSubs];
  }, [customer, subAccounts]);

  // Triggered when dropdown list approaches the bottom edge
  const handleLoadMore = useCallback((searchQuery) => {
    if (isLoadingMore || !hasMore) return;

    const nextPage = page + 1;
    setPage(nextPage);
    setCurrentSearch(searchQuery);
    loadAccountsData(nextPage, searchQuery, false);
  }, [page, isLoadingMore, hasMore, loadAccountsData]);

  // Default selection handler fallback loop execution
  useEffect(() => {
    if (accountOptions.length > 0 && !selectedAccount) {
      setSelectedAccount(accountOptions[0].value);
    }
  }, [accountOptions, selectedAccount]);

  // Uniform Success Alert Configuration
  const triggerSuccessAlert = (accountNum, plateNum) => {
    ContactSwal.fire({
      html: (
        <>
          <div className="contact-swal-header">
            <div className="icon-wrapper success">
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="32" width="32" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div className="text-block">
              <h2>Message Sent</h2>
              <p>Your concern has been successfully forwarded to Customer Care.</p>
            </div>
          </div>

          <SelectedAccountInfo account={accountNum} plate={plateNum} />
        </>
      ),
      showCancelButton: false,
      confirmButtonText: "Done",
      customClass: {
        container: "swal-contact-container",
        popup: "swal-contact-popup",
        htmlContainer: "swal-contact-html-container",
        actions: "swal-contact-actions",
        confirmButton: "swal-contact-confirm-btn success-theme-btn"
      },
      buttonsStyling: false,
      allowEscapeKey: true,
      allowOutsideClick: true
    });
  };

  // Uniform Error Alert Configuration
  const triggerErrorAlert = (errorMessage = "") => {
    ContactSwal.fire({
      html: (
        <>
          <div className="contact-swal-header">
            <div className="icon-wrapper error">
              <FiAlertCircle size={32} />
            </div>
            <div className="text-block">
              <h2>Submission Failed</h2>
              <p>{errorMessage || "We ran into an unexpected issue processing your ticket."}</p>
            </div>
          </div>
        </>
      ),
      showCancelButton: false,
      confirmButtonText: "Dismiss",
      customClass: {
        container: "swal-contact-container",
        popup: "swal-contact-popup",
        htmlContainer: "swal-contact-html-container",
        actions: "swal-contact-actions",
        confirmButton: "swal-contact-confirm-btn error-theme-btn"
      },
      buttonsStyling: false,
      allowEscapeKey: true,
      allowOutsideClick: true
    });
  };

  const handleMessageChange = (e) => {
    const rawValue = e.target.value;
    // Replace matching emoji unicode sets with an empty string
    const sanitizedValue = rawValue.replace(emojiRegex, "");
    setMessageText(sanitizedValue);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    let accountNum = "";
    let plateNum = "";

    try {
      if (selectedAccount) {
        const parsedAccount = JSON.parse(selectedAccount);
        accountNum = parsedAccount.account;
        plateNum = parsedAccount.plate;
      }
    } catch (err) {
      console.error("Failed parsing account JSON value: ", err);
    }

    const formData = new FormData();
    formData.append("tag", "insert");
    formData.append("name", customer?.name);
    formData.append("account", accountNum);
    formData.append("plate", plateNum);
    formData.append("email", customer?.email || "");
    formData.append("mobile", "N/A");
    formData.append("subject", selectedConcern);
    formData.append("msg", messageText);
    formData.append("atg", "");

    try {
      const response = await fetch(CUSTOMER_CARE_API_URL, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        triggerSuccessAlert(accountNum, plateNum);
        setMessageText(""); // Reset form message text field upon success
      } else {
        triggerErrorAlert();
      }
    } catch (err) {
      console.error(err);
      triggerErrorAlert("Cannot establish server communication right now.");
    }
  };

  return (
    <>
      <div className="contact-header-card">
        <FiMessageSquare />
        <div>
          <h1>Contact Us</h1>
          <p>Need assistance with your RFID account? Our support team is ready to help.</p>
        </div>
      </div>

      <div className="contact-grid">
        <div className="contact-card"><FiPhone /><h3>Customer Service Hotline</h3><p>(02) 5318-8655</p></div>
        <div className="contact-card"><FiMail /><h3>Email Support</h3><p>customercare@autosweeprfid.com</p></div>
        <div className="contact-card"><FiClock /><h3>Operating Hours</h3><p>Monday - Sunday</p><p>24/7 Customer Support</p></div>
        <div className="contact-card"><FiMapPin /><h3>Autosweep RFID Operations</h3><p>Skyway Toll Operations Bldg. G/F Toll Operations Bldg. Dona Soledad Ave. Brgy. Don Bosco Paranaque City</p></div>
      </div>

      <div className="contact-message-card">
        <h3>Send Us a Message</h3>
        <p className="form-subtitle">
          Logged in as <strong>{customer?.name || "Guest"}</strong> ({customer?.email || "No email detected"})
        </p>

        <form onSubmit={handleFormSubmit}>
          <div className="contact-form-grid">
            <SearchableDropdown
              label="Select Account No."
              placeholder="Type to filter accounts..."
              options={accountOptions}
              selectedValue={selectedAccount}
              onSelect={setSelectedAccount}
              icon={FiCreditCard}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              required
            />

            <SearchableDropdown
              label="Select Subject / Concern"
              placeholder="Search concern type..."
              options={CONCERN_SUBJECTS}
              selectedValue={selectedConcern}
              onSelect={setSelectedConcern}
              icon={FiAlertCircle}
              required
            />
          </div>

          <div className="form-field-group">
            <label>How can we help you?</label>
            <textarea
              rows="6"
              className="contact-textarea-field"
              placeholder="Provide explicit details regarding your account issue..."
              value={messageText}
              onChange={handleMessageChange}
              required
            />
          </div>

          <button type="submit" className="primary-btn">
            Send Message
          </button>
        </form>
      </div>
    </>
  );
}