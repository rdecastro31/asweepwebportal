import React, { useState, useEffect } from 'react';
import { FiEdit3, FiX, FiCreditCard, FiTruck } from 'react-icons/fi';
import '../../styles/modals/managealiasmodal.css';
import { API_URL } from '../../constants/constants';
import { SelectedAccountInfo } from '../Utilities/SelectedAccountInfo';
import { showAlert } from '../Utilities/ShowAlert';

export const ManageAliasModal = ({ isOpen, onClose, accountNumber, plateNumber, accountType, existingAlias = '', refreshData }) => {
    const [alias, setAlias] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Determine mode based on whether an existing alias is provided
    const isEditMode = Boolean(existingAlias);

    // Sync input field state when the modal opens or the existing alias changes
    useEffect(() => {
        if (isOpen) {
            setAlias(existingAlias);
        }
    }, [isOpen, existingAlias]);

    if (!isOpen) return null;

    // STRICTLY letters and numbers only (keeps original casing)
    const handleAliasChange = (e) => {
        const value = e.target.value;
        const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
        setAlias(cleanValue);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSubmitting(true);

        try {
            const fd = new FormData();
            fd.append("tag", "updatealias");
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
                if (accountType == 'main') {
                    const customer = JSON.parse(sessionStorage.getItem("customer") || "{}");
                    customer.alias = alias; // Update with the new input value
                    sessionStorage.setItem("customer", JSON.stringify(customer));
                }

                showAlert({
                    mode: "success",
                    title: "Alias Updated",
                    message: result.msg || `Alias ${isEditMode ? 'updated' : 'assigned'} successfully.`
                });
                if (!isEditMode) setAlias(''); // Clear only if it was a fresh creation
                refreshData();
                onClose();
            } else {
                showAlert({
                    mode: "error",
                    title: "Alias Update Failed",
                    message: result.msg || `Failed to ${isEditMode ? 'update' : 'assign'} alias.`
                });
            }
        } catch (error) {
            showAlert({ mode: "error", message: "Something went wrong while managing the alias." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="alias-modal-overlay">
            <div className="alias-modal-panel" onClick={(e) => e.stopPropagation()}>

                <button type="button" className="alias-modal-close-btn" onClick={onClose}>
                    <FiX size={18} />
                </button>

                <div className="alias-section-header">
                    <div>
                        <h2>{isEditMode ? 'Update Alias' : 'Assign Alias'}</h2>
                        <p>
                            {isEditMode
                                ? 'Modify the display nickname for this vehicle.'
                                : 'Create a unique display name or nickname for this vehicle.'
                            }
                        </p>
                    </div>
                </div>

                {/* NEW FEATURE: Record Information Summary Meta Badge Block */}
                <SelectedAccountInfo account={accountNumber} plate={plateNumber} />

                <form onSubmit={handleSubmit} className="alias-form-vertical">
                    <div className="form-group">
                        <label>Vehicle Alias</label>
                        <input
                            type="text"
                            value={alias}
                            onChange={handleAliasChange}
                            placeholder="e.g. PrimaryVehicle"
                        />
                    </div>

                    <button
                        type="submit"
                        className="alias-save-btn"
                        disabled={isSubmitting}
                    >
                        <FiEdit3 />
                        {isSubmitting ? "Saving..." : `${isEditMode ? 'Update' : 'Assign'} Alias`}
                    </button>
                </form>
            </div>
        </div>
    );
};