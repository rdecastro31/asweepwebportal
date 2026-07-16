import { FiCreditCard, FiTruck } from "react-icons/fi"
import '../../styles/selectedaccountinfo.css'

export const SelectedAccountInfo = ({ account, plate }) => {
    return <div className="summary-box">
        {account && (
            <div className="summary-item">
                <FiCreditCard className="summary-icon" />
                <div className="summary-text-wrapper">
                    <span className="summary-label">Account Number</span>
                    <strong className="summary-value">{account || 'N/A'}</strong>
                </div>
            </div>
        )}
        {plate && (
            <div className="summary-item">
                <FiTruck className="summary-icon" />
                <div className="summary-text-wrapper">
                    <span className="summary-label">Plate Number</span>
                    <strong className="summary-value plate-highlight">{plate || 'N/A'}</strong>
                </div>
            </div>
        )}
    </div>
}