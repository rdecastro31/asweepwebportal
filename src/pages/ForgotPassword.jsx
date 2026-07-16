import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiMail } from "react-icons/fi";
import "../styles/forgotpassword.css"; // Ensure this matches your directory structure
import logo from "../assets/aslogo.png";
import { API_URL, emojiRegex } from "../constants/constants";

export default function ForgotPassword() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleEmailChange = (e) => {
        // Disallow spaces and emojis entirely in the email address field input
        const sanitizedValue = e.target.value.replace(/\s/g, "").replace(emojiRegex, "");
        setEmail(sanitizedValue);
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const payload = new FormData();
            payload.append("tag", "forgotpassword");
            payload.append("email", email);

            const response = await fetch(`${API_URL}/index.php`, {
                method: "POST",
                body: payload,
            });

            const result = await response.json();

            // Adjusted to check for success explicitly, otherwise falls back to error message
            if (result.success === 1) {
                setStep(2);
            } else if (result.error === 1) {
                setMessage(result.msg || "An error occurred. Please try again.");
            } else {
                setMessage("An unexpected error occurred. Please try again.");
            }
        } catch (error) {
            setMessage("Unable to process request due to server connectivity problems. Please try again.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = (e) => {
        e.preventDefault();
        if (step > 1) {
            setStep(step - 1);
        } else {
            navigate("/login");
        }
    };

    return (
        <div className="forgot-page">
            <div className="forgot-card">
                <div className="forgot-logo-area">
                    <img src={logo} alt="Autosweep Logo" className="forgot-logo" />
                </div>

                <div className="forgot-heading">
                    <h2>Forgot Password</h2>
                    <p>Recover access to your Autosweep account.</p>
                </div>

                {/* Stepper tracking progress context */}
                <div className="forgot-stepper">
                    <div className={`step-item ${step >= 1 ? "active" : ""}`}>
                        <span>1</span>
                        <p>Verify Email</p>
                    </div>

                    <div className="step-line"></div>

                    <div className={`step-item ${step >= 2 ? "active" : ""}`}>
                        <span>2</span>
                        <p>Check Email</p>
                    </div>
                </div>

                {message && <div className="forgot-message">{message}</div>}

                {step === 1 && (
                    <form onSubmit={handleForgotPasswordSubmit}>
                        <div className="forgot-field">
                            <label>Email Address</label>
                            <div className="forgot-input-box">
                                <FiMail />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your registered email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <p className="forgot-field-help">
                                We'll send the next steps to this email address.
                            </p>
                        </div>

                        <button type="submit" className="forgot-submit-btn" disabled={loading}>
                            {loading ? "Processing..." : "Submit"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div className="forgot-success-pane">
                        <FiCheckCircle className="success-icon animate-pop" />
                        <h3>Email Sent!</h3>
                        <p>
                            An email containing the next steps has been sent.
                            <br />
                            Please check your inbox.
                        </p>
                        <button onClick={() => navigate("/login")} className="forgot-submit-btn">
                            Back to Login
                        </button>
                    </div>
                )}

                {step !== 2 && (
                    <Link onClick={handleBack} className="back-login-link">
                        <FiArrowLeft />
                        Back to Login
                    </Link>
                )}
            </div>
        </div>
    );
}