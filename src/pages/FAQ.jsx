import { useState, useEffect } from "react";
import { FiHelpCircle, FiChevronDown, FiChevronUp } from "react-icons/fi";
import "../styles/faq.css";
import { FAQ_API_URL } from "../constants/constants";

export default function FAQ() {
  const [faqData, setFaqData] = useState([]);
  const [openIndex, setOpenIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setIsLoading(true);

        // Prepare the form-data body required by the API
        const formData = new FormData();
        formData.append("tag", "getall");

        const response = await fetch(FAQ_API_URL, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Ensure data is an array before setting state
        setFaqData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch FAQs:", err);
        setError("Unable to load FAQs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  return (
    <>
      <div className="faq-header-card">
        <FiHelpCircle />
        <div>
          <h1>Frequently Asked Questions</h1>
          <p>
            Find answers to common questions about your Autosweep RFID account.
          </p>
        </div>
      </div>

      {/* Handle Loading State (Skeleton Loader) */}
      {isLoading && (
        <div className="faq-list explicit-skeleton-wrapper">
          {[1, 2, 3].map((n) => (
            <div key={n} className="faq-item skeleton-item">
              <div className="faq-question-skeleton">
                <div className="skeleton-line title-skeleton" />
                <div className="skeleton-icon" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Handle Error State */}
      {error && (
        <div className="faq-status-message error">{error}</div>
      )}

      {/* Handle Empty State */}
      {!isLoading && !error && faqData.length === 0 && (
        <div className="faq-status-message">No FAQs available at this time.</div>
      )}

      {/* FAQ List Render */}
      {!isLoading && !error && (
        <div className="faq-list">
          {faqData.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={faq.id} className={`faq-item ${isOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                </button>

                {isOpen && (
                  <div className="faq-answer">
                    {/* The API response contains embedded HTML classes and styling (e.g., MsoNormal). 
                      Using dangerouslySetInnerHTML handles this cleanly.
                    */}
                    <div dangerouslySetInnerHTML={{ __html: faq.answer }} />

                    {/* Embedded structural images render if available in the API response */}
                    {faq.imgUrl && (
                      <div className="faq-image-wrapper" style={{ marginTop: "16px" }}>
                        <img
                          src={faq.imgUrl}
                          alt="FAQ Information Attachment"
                          style={{ maxWidth: "100%", borderRadius: "12px", border: "1px solid var(--as-border)" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}