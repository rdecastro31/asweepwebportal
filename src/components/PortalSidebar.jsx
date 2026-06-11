import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiCreditCard,
  FiActivity,
  FiFileText,
  FiUser,
  FiHelpCircle,
  FiPhoneCall,
} from "react-icons/fi";

export default function PortalSidebar() {
  return (
    <aside className="portal-sidebar">
      <nav>

        <div className="sidebar-group">
      

          <NavLink to="/dashboard">
            <FiGrid />
            Dashboard
          </NavLink>

       
        </div>

        <div className="sidebar-divider"></div>

        <div className="sidebar-group">
          <div className="sidebar-group-title">
            ACCOUNT
          </div>

          <NavLink to="/profile">
            <FiUser />
            My Profile
          </NavLink>
        </div>

        <div className="sidebar-divider"></div>

        <div className="sidebar-group">
          <div className="sidebar-group-title">
            HELP CENTER
          </div>

          <NavLink to="/faq">
            <FiHelpCircle />
            FAQ
          </NavLink>

          <NavLink to="/contact-us">
            <FiPhoneCall />
            Contact Us
          </NavLink>
        </div>

      </nav>
    </aside>
  );
}