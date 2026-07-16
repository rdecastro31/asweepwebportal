import React, { useState, useEffect } from 'react';
import { FiEdit3, FiX } from 'react-icons/fi';
import '../../styles/modals/manageplatemodal.css';
import { API_URL } from '../../constants/constants';
import { SelectedAccountInfo } from '../Utilities/SelectedAccountInfo';
import { showAlert } from '../Utilities/ShowAlert';

export const ManagePlateModal = ({ isOpen, onClose, accountNumber, plateNumber, accountType, refreshData }) => {
    const [inputPlateNumber, setInputPlateNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sync input field state when the modal opens or the existing plate changes
    useEffect(() => {
        if (isOpen) {
            setInputPlateNumber(plateNumber);
        }
    }, [isOpen, plateNumber]);

    if (!isOpen) return null;

    // Alphanumeric validation and enforce uppercase
    const handlePlateChange = (e) => {
        const value = e.target.value;
        const cleanValue = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        setInputPlateNumber(cleanValue);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!inputPlateNumber.trim()) {
            showAlert({ mode: "error", message: "Plate number cannot be empty." });
            return;
        }

        setIsSubmitting(true);

        try {
            const fd = new FormData();
            fd.append("tag", "updateplate");
            fd.append("account_number", accountNumber);
            fd.append("new_plate_number", inputPlateNumber);

            const response = await fetch(`${API_URL}/index.php`, {
                method: "POST",
                credentials: "include",
                body: fd,
            });

            const result = await response.json();

            // Notice that your API returns $response["success"] = 1 or $response['error'] = 1
            if (Number(result.success) === 1) {
                if (accountType == 'main') {
                    const customer = JSON.parse(sessionStorage.getItem("customer") || "{}");
                    customer.plate_number = inputPlateNumber; // Update with the new input value
                    sessionStorage.setItem("customer", JSON.stringify(customer));
                }
                showAlert({
                    mode: "success",
                    title: "Plate Updated",
                    message: result.msg || "Sub-Account Plate Updated successfully."
                });
                refreshData();
                onClose();
            } else {
                showAlert({
                    mode: "error",
                    title: "Update Failed",
                    message: result.msg || "Unable to Update Sub-Account Plate."
                });
            }
        } catch (error) {
            showAlert({ mode: "error", title: "Unknown Error", message: "Something went wrong while updating the plate number." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="plate-modal-overlay">
            <div className="plate-modal-panel" onClick={(e) => e.stopPropagation()}>

                <button type="button" className="plate-modal-close-btn" onClick={onClose}>
                    <FiX size={18} />
                </button>

                <div className="plate-section-header">
                    <div>
                        <h2>Update Plate Number</h2>
                        <p>Update the registered license plate number for this account.</p>
                    </div>
                </div>

                {/* Account details summary card */}
                <SelectedAccountInfo account={accountNumber} plate={plateNumber} />

                <form onSubmit={handleSubmit} className="plate-form-vertical">
                    <div className="form-group">
                        <label>New Plate Number</label>
                        <input
                            type="text"
                            value={inputPlateNumber}
                            onChange={handlePlateChange}
                            placeholder="e.g. ABC1234"
                            maxLength={10}
                        />
                    </div>

                    <button
                        type="submit"
                        className="plate-save-btn"
                        disabled={isSubmitting || inputPlateNumber === plateNumber}
                    >
                        <FiEdit3 />
                        {isSubmitting ? "Updating..." : "Update Plate Number"}
                    </button>
                </form>
            </div>
        </div>
    );
};