import React, { useState } from 'react';
import { FiUserPlus, FiX } from 'react-icons/fi';
import '../../styles/modals/addaccountmodal.css';
import { API_URL } from '../../constants/constants';
import { showAlert } from '../Utilities/ShowAlert';

export const AddAccountModal = ({ isOpen, onClose, customerData, refreshData }) => {
    const [accountNumber, setAccountNumber] = useState('');
    const [plateNumber, setPlateNumber] = useState('');
    const [alias, setAlias] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    // STRICTLY numbers only (\D removes anything that is not a digit)
    const handleAccountChange = (e) => {
        const value = e.target.value;
        const cleanValue = value.replace(/\D/g, '');
        setAccountNumber(cleanValue);
    };

    // STRICTLY letters and numbers only, forced to UPPERCASE
    const handlePlateChange = (e) => {
        const value = e.target.value;
        const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
        setPlateNumber(cleanValue.toUpperCase());
    };

    // STRICTLY letters and numbers only (keeps original casing)
    const handleAliasChange = (e) => {
        const value = e.target.value;
        const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
        setAlias(cleanValue);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!accountNumber || !plateNumber) return;

        setIsSubmitting(true);

        try {
            const fd = new FormData();
            fd.append("tag", "addsubaccount");
            fd.append("account_number", accountNumber);
            fd.append("plate_number", plateNumber);
            fd.append("gname", alias);

            const response = await fetch(`${API_URL}/index.php`, {
                method: "POST",
                credentials: "include",
                body: fd,
            });

            const result = await response.json();

            if (Number(result.success) === 1) {
                showAlert({ mode: "success", message: result.msg || "Account added successfully." });
                setAccountNumber('');
                setPlateNumber('');
                refreshData();
                onClose();
            } else {
                showAlert({
                    mode: "error",
                    title: "Failed to Add Account",
                    message: result.msg || "Failed to add account."
                });
            }
        } catch (error) {
            showAlert({ mode: "error", message: "Something went wrong while adding account." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="account-modal-overlay">
            <div className="account-modal-panel" onClick={(e) => e.stopPropagation()}>

                <button type="button" className="account-modal-close-btn" onClick={onClose}>
                    <FiX size={18} />
                </button>

                <div className="section-header">
                    <div>
                        <h2>Add Account</h2>
                        <p>Link a new vehicle plate and account number to your system.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="account-form-vertical">
                    <div className="form-group">
                        <label>Account Number</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={accountNumber}
                            onChange={handleAccountChange}
                            placeholder="e.g. 123456789"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Plate Number</label>
                        <input
                            type="text"
                            value={plateNumber}
                            onChange={handlePlateChange}
                            placeholder="e.g. ABC1234"
                            required
                            style={{ textTransform: 'uppercase' }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Alias</label>
                        <input
                            type="text"
                            value={alias}
                            onChange={handleAliasChange}
                            placeholder="Optional"
                        />
                    </div>

                    <button
                        type="submit"
                        className="account-save-btn"
                        disabled={isSubmitting || !accountNumber || !plateNumber}
                    >
                        <FiUserPlus />
                        {isSubmitting ? "Saving..." : "Add Account"}
                    </button>
                </form>
            </div>
        </div>
    );
};