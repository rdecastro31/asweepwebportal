import React, { useState, useEffect } from 'react';
import { FiTrash2, FiX, FiAlertTriangle } from 'react-icons/fi';
import '../../styles/modals/deletesubaccountmodal.css';
import { API_URL } from '../../constants/constants';
import { SelectedAccountInfo } from '../Utilities/SelectedAccountInfo';
import { showAlert } from '../Utilities/ShowAlert';
import { Link } from 'react-router-dom';

export const DeleteSubAccountModal = ({ isOpen, onClose, accountNumber, plateNumber, refreshData }) => {
    const [confirmAccount, setConfirmAccount] = useState('');
    const [confirmPlate, setConfirmPlate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset input states when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setConfirmAccount('');
            setConfirmPlate('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Standardize input validation matching your design patterns
    const handlePlateChange = (e) => {
        const value = e.target.value;
        const cleanValue = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        setConfirmPlate(cleanValue);
    };

    const handleAccountChange = (e) => {
        const value = e.target.value;
        const cleanValue = value.replace(/[^0-9]/g, ""); // Enforce numbers only for account confirmation
        setConfirmAccount(cleanValue);
    };

    // Button is disabled until both inputs match the target account details perfectly
    const isValidationMatching = confirmAccount === accountNumber && confirmPlate === plateNumber;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isValidationMatching) return;

        setIsSubmitting(true);

        try {
            const fd = new FormData();
            fd.append("tag", "deletesubaccount"); // Adjust this tag string if your backend uses a different naming convention
            fd.append("account_number", accountNumber); // Adjust this tag string if your backend uses a different naming convention
            fd.append("plate_number", plateNumber); // Adjust this tag string if your backend uses a different naming convention

            const response = await fetch(`${API_URL}/index.php`, {
                method: "POST",
                credentials: "include",
                body: fd,
            });

            const result = await response.json();

            if (Number(result.success) === 1) {
                showAlert({
                    mode: "success",
                    title: "Sub-Account Removed",
                    message: result.msg || "Sub-account deleted successfully."
                });
                refreshData();
                onClose();
            } else {
                showAlert({
                    mode: "error",
                    title: "Deletion Failed",
                    message: result.msg || "Unable to delete the sub-account."
                });
            }
        } catch (error) {
            showAlert({ mode: "error", message: "Something went wrong while deleting the sub-account." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="delete-modal-overlay">
            <div className="delete-modal-panel" onClick={(e) => e.stopPropagation()}>

                <button type="button" className="delete-modal-close-btn" onClick={onClose}>
                    <FiX size={18} />
                </button>

                <div className="delete-section-header">
                    <div>
                        <h2>Delete Sub-Account</h2>
                        <p>This action will remove the sub-account from your portal dashboard.</p>
                    </div>
                </div>

                {/* Info block displaying what is about to be deleted */}
                <SelectedAccountInfo account={accountNumber} plate={plateNumber} />

                {/* RFID Informational Notice Box */}
                <div className="delete-rfid-notice">
                    <FiAlertTriangle className="notice-icon" size={20} />
                    <p>
                        <strong>Important:</strong> Removing this sub-account from your dashboard does not deactivate its physical RFID tag. For deactivation requests, please contact <strong><Link to="/contact-us">Customer Care</Link></strong>.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="delete-form-vertical">
                    <p className="delete-instructions">
                        To confirm deletion, please re-type the account details below:
                    </p>

                    <div className="form-group">
                        <label>Confirm Account Number</label>
                        <input
                            type="text"
                            value={confirmAccount}
                            onChange={handleAccountChange}
                            placeholder={accountNumber}
                            className={confirmAccount && confirmAccount !== accountNumber ? 'input-error' : ''}
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm Plate Number</label>
                        <input
                            type="text"
                            value={confirmPlate}
                            onChange={handlePlateChange}
                            placeholder={plateNumber}
                            className={confirmPlate && confirmPlate !== plateNumber ? 'input-error' : ''}
                        />
                    </div>

                    <button
                        type="submit"
                        className="delete-action-btn"
                        disabled={isSubmitting || !isValidationMatching}
                    >
                        <FiTrash2 />
                        {isSubmitting ? "Deleting..." : "Delete Sub-Account"}
                    </button>
                </form>
            </div>
        </div>
    );
};