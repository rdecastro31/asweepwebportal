import { FiBell, FiLogOut, FiUser } from "react-icons/fi";
import logo from "../assets/aslogo.png";

export default function PortalHeader({ customer, onLogout }) {
  return (
    <header className="portal-header">
      <div className="portal-brand">
        <img src={logo} alt="Autosweep" />
        <div>
          <strong>Autosweep Portal</strong>
          <span>Customer Web Portal</span>
        </div>
      </div>

      <div className="portal-header-actions">
        {/* <button className="header-icon-btn"><FiBell /></button> */}

        <div className="customer-pill custom-tooltip-container">
          <FiUser />
          <span>
            {customer?.name
              ? customer.name.length > 35
                ? `${customer.name.substring(0, 35)}...`
                : customer.name
              : "Customer"}
          </span>

          {/* Custom Tooltip - Only breaks out to show if name is strictly over 35 characters */}
          {customer?.name && customer.name.length > 35 && (
            <span className="custom-tooltip">{customer.name}</span>
          )}
        </div>

        <button className="logout-btn" onClick={onLogout}>
          <FiLogOut />
          Logout
        </button>
      </div>
    </header>
  );
}