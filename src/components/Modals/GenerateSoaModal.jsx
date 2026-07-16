import React, { useState, useMemo, useEffect } from 'react';
import { FiCalendar, FiDownload, FiExternalLink, FiInfo, FiX } from 'react-icons/fi';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import moment from "moment";
import '../../styles/modals/generatesoamodal.css';
import '../../styles/modals/soasuccessmodal.css';
import { SelectedAccountInfo } from '../Utilities/SelectedAccountInfo';
import { API_URL } from '../../constants/constants';
import { showAlert } from '../Utilities/ShowAlert';

const SOASwal = withReactContent(Swal);

export const GenerateSoaModal = ({ isOpen, onClose, customerEmail, accountNumber }) => {
    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const todayStr = useMemo(() => moment().format('YYYY-MM-DD'), []);

    // Sync and reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setDateFrom(null);
            setDateTo(null);
        }
    }, [isOpen]);

    // Maximum boundary limit evaluation rules for "Date From" (Yesterday)
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

    if (!isOpen) return null;

    // Helper function to trigger the globally customized SweetAlert2
    const triggerSuccessAlert = (isEmailSent, pdfUrl, pdfFileName) => {
        SOASwal.fire({
            html: (
                <>
                    <div className="soa-success-header">
                        <div className="success-icon-wrapper">
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin='round' height="32" width="32" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <div className="header-text-block">
                            <h2>Statement Generated</h2>
                            <p>Your Statement of Account (SOA) is ready for viewing and download.</p>
                        </div>
                    </div>

                    <SelectedAccountInfo account={accountNumber} />

                    {isEmailSent && (
                        <div className="soa-email-notice-card">
                            <div className="notice-icon">
                                <FiInfo />
                            </div>
                            <div className="notice-text">
                                <p>A copy has been sent to your registered email address.</p>
                                <span>Please note: The email link will expire and remain available for only <strong>7 days</strong>.</span>
                            </div>
                        </div>
                    )}
                </>
            ),
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: (<><FiDownload /> Download PDF Now</>),
            denyButtonText: (<><FiExternalLink /> View in New Tab</>),
            cancelButtonText: "Close",
            customClass: {
                container: 'swal-soa-container',
                popup: 'swal-soa-popup',
                htmlContainer: 'swal-soa-html-container',
                actions: 'swal-soa-actions',
                confirmButton: 'swal-soa-confirm-btn',
                cancelButton: 'swal-soa-cancel-btn',
                denyButton: 'swal-soa-deny-btn'
            },
            buttonsStyling: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
        }).then((result) => {
            if (result.isConfirmed) {
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = pdfFileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            else if (result.isDenied) {
                window.open(pdfUrl, '_blank', 'noopener,noreferrer');
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!dateFrom || !dateTo || isSubmitting) return;

        setIsSubmitting(true);

        // Standardize parameters using backend request structures
        const formattedDateFrom = moment(dateFrom).format('M/D/YYYY');
        const formattedDateTo = moment(dateTo).format('M/D/YYYY');

        try {
            const fd = new FormData();
            fd.append("tag", "requestsoa");
            fd.append("account_number", accountNumber);
            fd.append("date_from", formattedDateFrom);
            fd.append("date_to", formattedDateTo);

            const response = await fetch(`${API_URL}/index.php`, {
                method: "POST",
                credentials: "include",
                body: fd,
            });

            const result = await response.json();

            if (Number(result.success) === 1) {
                // Force the origin to start with https:// in production
                const secureOrigin = window.location.origin.replace(/^http:/i, "https:");

                // Combine it with your base URL
                const prodBase = `${secureOrigin}${import.meta.env.BASE_URL}`;
                const targetPdfUrl = (import.meta.env.PROD ? prodBase : `${API_URL}/`) + result.file_path;
                const targetPdfFileName = (result.file_path).replace("soa/", "");
                onClose();
                triggerSuccessAlert(result.isEmailSent, targetPdfUrl, targetPdfFileName);
            } else {
                showAlert({ mode: "error", message: result.msg || "Failed to generate statement of account." });
                onClose();
            }
        } catch (error) {
            showAlert({ mode: "error", message: "Something went wrong while managing the statement request." });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="date-modal-overlay" onClick={onClose}>
            <div className="date-modal-panel" onClick={(e) => e.stopPropagation()}>

                <button type="button" className="date-modal-close-btn" onClick={onClose}>
                    <FiX size={18} />
                </button>

                <div className="date-section-header">
                    <div>
                        <h2>Select Statement Period</h2>
                        <p>Choose a customized date range to filter your vehicle statements.</p>
                    </div>
                </div>

                <SelectedAccountInfo account={accountNumber} />

                <form onSubmit={handleSubmit} className="date-form-vertical">

                    <div className="form-group-container">
                        {/* Date From Field */}
                        <div className="form-group">
                            <label htmlFor="modalDateFrom">Date From</label>
                            <div className="modal-date-wrapper">
                                <FiCalendar className="modal-field-icon" />
                                <DatePicker
                                    id="modalDateFrom"
                                    selected={dateFrom}
                                    onChange={(date) => setDateFrom(date)}
                                    maxDate={maxDateFrom}
                                    dateFormat="MM/dd/yyyy"
                                    placeholderText="mm/dd/yyyy"
                                    autoComplete="off"
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                        </div>

                        {/* Date To Field */}
                        <div className="form-group">
                            <label htmlFor="modalDateTo">Date To</label>
                            <div className="modal-date-wrapper">
                                <FiCalendar className="modal-field-icon" />
                                <DatePicker
                                    id="modalDateTo"
                                    selected={dateTo}
                                    onChange={(date) => setDateTo(date)}
                                    minDate={dateToConstraints.min}
                                    maxDate={dateToConstraints.max}
                                    disabled={!dateFrom || dateToConstraints.disabled || isSubmitting}
                                    dateFormat="MM/dd/yyyy"
                                    autoComplete="off"
                                    placeholderText={!dateFrom ? "Select Timeframe" : "mm/dd/yyyy"}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="date-confirm-btn"
                        disabled={!dateFrom || !dateTo || isSubmitting}
                    >
                        <FiCalendar />
                        {isSubmitting ? "Generating..." : "Generate SOA"}
                    </button>
                </form>
            </div>
        </div>
    );
};