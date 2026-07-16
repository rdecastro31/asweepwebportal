import React, { useEffect, useState } from 'react';
import { FiX, FiDownload } from 'react-icons/fi';
import { SelectedAccountInfo } from '../Utilities/SelectedAccountInfo';
import '../../styles/modals/viewinvoicemodal.css';

export const ViewSIModal = ({ isOpen, onClose, trxnId, segmentId, accountNumber, handleInvoicePdfAction }) => {
    const [pdfUrl, setPdfUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPdf = async () => {
            if (isOpen && trxnId && segmentId) {
                setIsLoading(true);
                // Grab the URL from the shared compound key cache (or fetch from endpoint)
                const url = await handleInvoicePdfAction(trxnId, segmentId, 'getUrl');
                if (url) {
                    setPdfUrl(url);
                } else {
                    onClose(); // Close if download fails
                }
                setIsLoading(false);
            }
        };

        loadPdf();
    }, [isOpen, trxnId, segmentId]);

    if (!isOpen) return null;

    return (
        <div className="invoice-modal-overlay">
            <div className="invoice-modal-panel">

                {/* Close Cross Top Right */}
                <button type="button" className="invoice-modal-close-btn" onClick={onClose}>
                    <FiX size={18} />
                </button>

                {/* Header Context Section */}
                <div className="invoice-section-header">
                    <div>
                        <h2>Sales Invoice</h2>
                        <p>Review invoice contents below or download a local file copy.</p>
                    </div>
                </div>

                {/* Reusing your information badge summary component */}
                <SelectedAccountInfo account={accountNumber} />

                {/* Document Viewer Frame Container */}
                <div className="invoice-viewer-container">
                    {isLoading ? (
                        <div className="invoice-viewer-loader">
                            <p>Loading invoice document secure wrapper...</p>
                        </div>
                    ) : (
                        <iframe
                            src={`${pdfUrl}#toolbar=0&navpanes=0&zoom=125`}
                            title={`Sales Invoice Document ${trxnId}`}
                            className="invoice-pdf-frame"
                        />
                    )}
                </div>

                {/* Shared Cache Action Downloader Button */}
                <div className="invoice-modal-footer">
                    <button
                        type="button"
                        className="invoice-download-btn"
                        onClick={() => handleInvoicePdfAction(trxnId, segmentId, 'download')}
                        disabled={isLoading}
                    >
                        <FiDownload />
                        Download Sales Invoice
                    </button>
                </div>

            </div>
        </div>
    );
};