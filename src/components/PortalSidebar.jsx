import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiUser,
  FiHelpCircle,
  FiPhoneCall,
  FiFile,
  FiClipboard,
} from "react-icons/fi";

export default function PortalSidebar() {
  return (
    <aside className="portal-sidebar">
      <nav className="sidebar-nav">
        {/* Core Navigation Group */}
        <div className="sidebar-group">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
            <FiGrid />
            <span>Dashboard</span>
          </NavLink>
        </div>

        <div className="sidebar-divider"></div>

        {/* Account Management Group */}
        <div className="sidebar-group">
          <div className="sidebar-group-title">TRANSACTIONS</div>

          <NavLink to="/sales-invoices" className={({ isActive }) => isActive ? "active" : ""}>
            <FiFile />
            <span>Sales Invoices</span>
          </NavLink>
          <NavLink to="/acknowledgement-receipts" className={({ isActive }) => isActive ? "active" : ""}>
            <FiClipboard />
            <span>Acknowledgement Receipts</span>
          </NavLink>
        </div>

        <div className="sidebar-divider"></div>

        {/* Account Management Group */}
        <div className="sidebar-group">
          <div className="sidebar-group-title">ACCOUNT</div>

          <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>
            <FiUser />
            <span>My Profile</span>
          </NavLink>
        </div>

        <div className="sidebar-divider"></div>

        {/* Support Group */}
        <div className="sidebar-group">
          <div className="sidebar-group-title">HELP CENTER</div>

          <NavLink to="/faq" className={({ isActive }) => isActive ? "active" : ""}>
            <FiHelpCircle />
            <span>FAQ</span>
          </NavLink>

          <NavLink to="/contact-us" className={({ isActive }) => isActive ? "active" : ""}>
            <FiPhoneCall />
            <span>Contact Us</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}