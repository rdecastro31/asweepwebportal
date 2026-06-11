import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
  FiMessageSquare,
} from "react-icons/fi";

import PortalHeader from "../components/PortalHeader";
import PortalSidebar from "../components/PortalSidebar";
import PortalFooter from "../components/PortalFooter";

export default function ContactUs() {
  const customer = JSON.parse(
    sessionStorage.getItem("customer") || "{}"
  );

  return (
    <div className="portal-page">
      <PortalHeader customer={customer} />

      <div className="portal-body">
        <PortalSidebar />

        <main className="portal-content">
          <div className="contact-header-card">
            <FiMessageSquare />

            <div>
              <h1>Contact Us</h1>
              <p>
                Need assistance? Our support team is ready to help.
              </p>
            </div>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <FiPhone />

              <h3>Customer Service Hotline</h3>

              <p>(02) 5318-8655</p>
            </div>

            <div className="contact-card">
              <FiMail />

              <h3>Email Support</h3>

              <p>customer.service@autosweeprfid.com</p>
            </div>

            <div className="contact-card">
              <FiClock />

              <h3>Operating Hours</h3>

              <p>Monday - Sunday</p>
              <p>24/7 Customer Support</p>
            </div>

            <div className="contact-card">
              <FiMapPin />

              <h3>Main Office</h3>

              <p>
                Skyway Operations and Maintenance Corporation
              </p>
              <p>Metro Manila, Philippines</p>
            </div>
          </div>

          <div className="contact-message-card">
            <h3>Send Us a Message</h3>

            <form>
              <div className="contact-form-grid">
                <input
                  type="text"
                  placeholder="Full Name"
                />

                <input
                  type="email"
                  placeholder="Email Address"
                />
              </div>

              <input
                type="text"
                placeholder="Subject"
              />

              <textarea
                rows="6"
                placeholder="How can we help you?"
              />

              <button type="submit" className="primary-btn">
                Send Message
              </button>
            </form>
          </div>
        </main>
      </div>

      <PortalFooter />
    </div>
  );
}