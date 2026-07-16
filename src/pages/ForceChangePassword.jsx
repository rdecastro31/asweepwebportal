import { useState } from "react";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import "../styles/forcechangepassword.css";
import { API_URL, emojiRegex } from "../constants/constants";
import { handleLogout } from "../constants/helpers";

export default function ForceChangePassword({ customerData, setCustomer }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showRetypePassword, setShowRetypePassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const [formData, setFormData] = useState({
        password: "",
        retypePassword: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        // NEW: Strict Whitelist Filter
        // Strips spaces, emojis, AND any symbol that is NOT an alphanumeric character or part of your [@$!%*?&] whitelist
        const sanitizedValue = value
            .replace(/\s/g, "")
            .replace(emojiRegex, "")
            .replace(/[^a-zA-Z0-9@$!%*?&]/g, ""); // Instant-rejects characters like #, _, -, etc.

        setFormData((prev) => ({
            ...prev,
            [name]: sanitizedValue,
        }));
    };

    const rules = {
        length: formData.password.length >= 6,
        alphaNumeric: /[a-zA-Z]/.test(formData.password) && /\d/.test(formData.password),
        uppercase: /[A-Z]/.test(formData.password),
        // Ensures at least one approved special character is present[cite: 7]
        specialChar: /[@$!%*?&]/.test(formData.password),
    };

    const handleUpdatePasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (formData.password !== formData.retypePassword) {
            setMessage("Password and retype password do not match.");
            return;
        }

        if (!rules.length || !rules.alphaNumeric || !rules.uppercase || !rules.specialChar) {
            setMessage("Please fulfill all password eligibility conditions.");
            return;
        }

        setLoading(true);

        try {
            const payload = new FormData();
            payload.append("tag", "changepassword");
            payload.append("new_password", formData.password);

            const response = await fetch(`${API_URL}/index.php`, {
                method: "POST",
                credentials: "include",
                body: payload,
            });

            if (response.status === 401) {
                await handleLogout(setCustomer);
                return;
            }

            if (!response.ok) {
                throw new Error(`Accounts request failed with status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success !== 1) {
                setMessage(result.msg || "Failed to update password.");
                return;
            }

            const updatedCustomer = {
                ...customerData,
                active: 1
            };

            const userDataString = JSON.stringify(updatedCustomer);
            sessionStorage.setItem("customer", userDataString);

            if (typeof setCustomer === "function") {
                setCustomer(userDataString);
            }

        } catch (error) {
            setMessage("Unable to update password due to server connectivity problems.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="force-card">
            <div className="force-heading">
                <h2>Update Password</h2>
                <p>Your account is currently locked due to a password reset request. You must enter a new password to access your Customer Web Portal.</p>
            </div>

            {message && <div className="force-message">{message}</div>}

            <form onSubmit={handleUpdatePasswordSubmit}>
                <div className="force-field">
                    <label>New Password</label>
                    <div className="force-input-box">
                        <FiLock />
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Create strong password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                        <button
                            type="button"
                            className="force-eye-btn"
                            onClick={() => setShowPassword((prev) => !prev)}
                        >
                            {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </div>

                    <div className="force-checklist-grid">
                        <span className={rules.length ? "met" : ""}>✓ Min 6 characters</span>
                        <span className={rules.alphaNumeric ? "met" : ""}>✓ Alpha-numeric</span>
                        <span className={rules.uppercase ? "met" : ""}>✓ 1 Uppercase</span>
                        <span className={rules.specialChar ? "met" : ""}>✓ 1 Special (@$!%*?&)</span>
                    </div>
                </div>

                <div className="force-field">
                    <label>Retype New Password</label>
                    <div className="force-input-box">
                        <FiLock />
                        <input
                            type={showRetypePassword ? "text" : "password"}
                            name="retypePassword"
                            placeholder="Confirm new password"
                            value={formData.retypePassword}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                        <button
                            type="button"
                            className="force-eye-btn"
                            onClick={() => setShowRetypePassword((prev) => !prev)}
                        >
                            {showRetypePassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </div>
                </div>

                <button type="submit" className="force-submit-btn" disabled={loading}>
                    {loading ? "Updating Credentials..." : "Submit"}
                </button>
            </form>
        </div>
    );
}