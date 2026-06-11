import { useState } from "react";
import {
  FiHelpCircle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

import PortalHeader from "../components/PortalHeader";
import PortalSidebar from "../components/PortalSidebar";
import PortalFooter from "../components/PortalFooter";

export default function FAQ() {
  const customer = JSON.parse(
    sessionStorage.getItem("customer") || "{}"
  );

  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "How do I check my RFID balance?",
      answer:
        "Open your RFID Account dashboard and click the Balance button. The latest available balance will be displayed.",
    },
    {
      question: "How do I download my Statement of Account?",
      answer:
        "Select your RFID account and click Download SOA. You may choose a specific date range before generating the statement.",
    },
    {
      question: "How can I add another RFID account?",
      answer:
        "Click Add RFID Account from the sidebar and provide your account number, plate number, and registered email address.",
    },
    {
      question: "Can I rename my RFID account?",
      answer:
        "Yes. Click the Alias button on your RFID account card and assign a custom nickname such as Family Car or Office Vehicle.",
    },
    {
      question: "Why is my balance not updated?",
      answer:
        "Balance updates depend on the latest synchronization from the RFID system. Please refresh the page or try again after a few minutes.",
    },
    {
      question: "How do I reset my password?",
      answer:
        "Click Forgot Password on the login page and follow the instructions sent to your registered email address.",
    },
  ];

  return (
    <div className="portal-page">
      <PortalHeader customer={customer} />

      <div className="portal-body">
        <PortalSidebar />

        <main className="portal-content">
          <div className="faq-header-card">
            <FiHelpCircle />
            <div>
              <h1>Frequently Asked Questions</h1>
              <p>
                Find answers to common questions about your Autosweep RFID account.
              </p>
            </div>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() =>
                    setOpenIndex(openIndex === index ? -1 : index)
                  }
                >
                  <span>{faq.question}</span>

                  {openIndex === index ? (
                    <FiChevronUp />
                  ) : (
                    <FiChevronDown />
                  )}
                </button>

                {openIndex === index && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>

      <PortalFooter />
    </div>
  );
}