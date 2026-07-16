import React, { useEffect, useState } from 'react';
import { FiX, FiDownload } from 'react-icons/fi';
import { SelectedAccountInfo } from '../Utilities/SelectedAccountInfo';
import '../../styles/modals/viewreceiptmodal.css'; // See CSS below

export const ViewARModal = ({ isOpen, onClose, orNumber, accountNumber, handleReceiptPdfAction }) => {
    const [pdfUrl, setPdfUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPdf = async () => {
            if (isOpen && orNumber) {
                setIsLoading(true);
                // Grab the URL from the shared cache (or fetch from endpoint)
                const url = await handleReceiptPdfAction(orNumber, 'getUrl');
                if (url) {
                    setPdfUrl(url);
                } else {
                    onClose(); // Close if download fails
                }
                setIsLoading(false);
            }
        };

        loadPdf();
    }, [isOpen, orNumber]);

    if (!isOpen) return null;

    return (
        <div className="receipt-modal-overlay">
            <div className="receipt-modal-panel">

                {/* Close Cross Top Right */}
                <button type="button" className="receipt-modal-close-btn" onClick={onClose}>
                    <FiX size={18} />
                </button>

                {/* Header Context Section */}
                <div className="receipt-section-header">
                    <div>
                        <h2>Acknowledgement Receipt</h2>
                        <p>Review your receipt contents below or download a local file copy.</p>
                    </div>
                </div>

                {/* Reusing your information badge summary component */}
                <SelectedAccountInfo account={accountNumber} />

                {/* Document Viewer Frame Container */}
                <div className="receipt-viewer-container">
                    {isLoading ? (
                        <div className="receipt-viewer-loader">
                            <p>Loading document stream secure wrapper...</p>
                        </div>
                    ) : (
                        <iframe
                            src={`${pdfUrl}#toolbar=0&navpanes=0&zoom=125`}
                            title={`Receipt Document ${orNumber}`}
                            className="receipt-pdf-frame"
                        />
                    )}
                </div>

                {/* Shared Cache Action Downloader Button */}
                <div className="receipt-modal-footer">
                    <button
                        type="button"
                        className="receipt-download-btn"
                        onClick={() => handleReceiptPdfAction(orNumber, 'download')}
                        disabled={isLoading}
                    >
                        <FiDownload />
                        Download PDF Document
                    </button>
                </div>

            </div>
        </div>
    );
};