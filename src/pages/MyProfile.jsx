import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi";
import { API_URL, emojiRegex } from "../constants/constants";
import { handleLogout } from "../constants/helpers";
import "../styles/myprofile.css";
import { showAlert } from "../components/Utilities/ShowAlert";

export default function MyProfile() {
    const { setCustomer } = useOutletContext();

    // Retrieve current customer details from session storage
    const customer = useMemo(() => {
        const storedCustomer = sessionStorage.getItem("customer");
        return storedCustomer ? JSON.parse(storedCustomer) : null;
    }, []);

    // Form Field States
    const [name, setName] = useState(customer?.name || "");
    const [email, setEmail] = useState(customer?.email || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Password Visibility Toggle States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Status UI States
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Real-time password validators matching registration conditions
    const rules = {
        length: password.length >= 6,
        alphaNumeric: /[a-zA-Z]/.test(password) && /\d/.test(password),
        uppercase: /[A-Z]/.test(password),
        specialChar: /[@$!%*?&]/.test(password),
    };

    const handleNameChange = (e) => {
        setName(e.target.value.replace(emojiRegex, ""));
    };

    // Unified onChange handler for both typing and pasting
    const handleEmailChange = (e) => {
        const sanitizedValue = e.target.value
            .replace(emojiRegex, "")
            .replace(/[^a-zA-Z0-9@._\-+]/g, "");
        setEmail(sanitizedValue);
    };

    const handlePasswordChange = (e) => {
        const sanitizedValue = e.target.value
            .replace(/\s/g, "")
            .replace(emojiRegex, "")
            .replace(/[^a-zA-Z0-9@$!%*?&]/g, "");
        setPassword(sanitizedValue);
    };

    const handleConfirmPasswordChange = (e) => {
        const sanitizedValue = e.target.value
            .replace(/\s/g, "")
            .replace(emojiRegex, "")
            .replace(/[^a-zA-Z0-9@$!%*?&]/g, "");
        setConfirmPassword(sanitizedValue);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        const isEmailChanged = email !== customer?.email; // Track if email specifically changed
        const isInfoChanged = name !== customer?.name || isEmailChanged;
        const isPasswordFilled = password.length > 0;

        if (!isInfoChanged && !isPasswordFilled) {
            showAlert({ mode: "error", title: "Incomplete Form", message: "No profile details were modified." });
            return;
        }

        if (isPasswordFilled) {
            if (!rules.length || !rules.alphaNumeric || !rules.uppercase || !rules.specialChar) {
                showAlert({ mode: "error", title: "Password can't be used", message: "Please fulfill all password eligibility conditions before saving." });
                return;
            }

            if (password !== confirmPassword) {
                showAlert({ mode: "error", title: "Password Mismatch", message: "Passwords do not match." });
                return;
            }
        }

        setLoading(true);

        try {
            let infoUpdatedSuccessfully = false;
            let passwordUpdatedSuccessfully = false;
            let updatedSessionData = { ...customer };

            if (isInfoChanged) {
                const infoData = new FormData();
                infoData.append("tag", "updateaccountinfo");
                infoData.append("old_email", customer?.email);
                infoData.append("new_email", email);
                infoData.append("new_account_name", name);
                infoData.append("uid", customer?.id);

                const infoResponse = await fetch(`${API_URL}/index.php`, {
                    method: "POST",
                    credentials: "include",
                    body: infoData,
                });

                if (infoResponse.status === 401) {
                    await handleLogout(setCustomer);
                    return;
                }

                const infoResult = await infoResponse.json();

                if (infoResult?.error || !infoResult?.success) {
                    throw new Error(infoResult?.msg || "Unable to update account details.");
                }

                updatedSessionData.name = name;
                updatedSessionData.email = email;
                infoUpdatedSuccessfully = true;
            }

            if (isPasswordFilled) {
                const pwdData = new FormData();
                pwdData.append("tag", "changepassword");
                if (isInfoChanged) {
                    pwdData.append("email", email);
                    pwdData.append("name", name);
                }
                pwdData.append("new_password", password);

                const pwdResponse = await fetch(`${API_URL}/index.php`, {
                    method: "POST",
                    credentials: "include",
                    body: pwdData,
                });

                if (pwdResponse.status === 401) {
                    await handleLogout(setCustomer);
                    return;
                }

                const pwdResult = await pwdResponse.json();

                if (pwdResult?.error || !pwdResult?.success) {
                    throw new Error(pwdResult?.msg || "Unable to process password change.");
                }

                passwordUpdatedSuccessfully = true;
            }

            if (infoUpdatedSuccessfully || passwordUpdatedSuccessfully) {
                // Determine if a logout is required (if password changed, or if info changed AND it was the email)
                const requiresLogout = passwordUpdatedSuccessfully || (infoUpdatedSuccessfully && isEmailChanged);

                if (infoUpdatedSuccessfully && !requiresLogout) {
                    // Only update session storage if they aren't getting kicked out anyway
                    sessionStorage.setItem("customer", JSON.stringify(updatedSessionData));
                    setCustomer(JSON.stringify(updatedSessionData));
                }

                setPassword("");
                setConfirmPassword("");
                setShowPassword(false);
                setShowConfirmPassword(false);

                let successString = "Profile updated successfully!";
                if (infoUpdatedSuccessfully && passwordUpdatedSuccessfully) {
                    successString = "Account information and password have been updated.";
                } else if (passwordUpdatedSuccessfully) {
                    successString = "Your password has been changed successfully.";
                }

                // Append logout warning notice to the user if applicable
                if (requiresLogout) {
                    successString += " You will be logged out. Please sign in again with your new credentials.";
                }

                // Trigger alert with the onConfirm callback
                showAlert({
                    mode: "success", // Fixed: changed from "error" to "success"
                    title: "Success",
                    message: successString,
                    onConfirm: async () => {
                        if (requiresLogout) {
                            await handleLogout(setCustomer);
                        }
                    }
                });
            }

        } catch (error) {
            console.error("Profile runtime workflow error:", error);
            showAlert({ mode: "error", title: "Error", message: error.message || "An unexpected error occurred." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <section className="profile-hero">
                <div>
                    <span className="profile-label">Account Settings</span>
                    <h1>My Profile</h1>
                    <p>
                        Manage your credentials, update your personalized display identity attributes,
                        and review configuration protocols safely.
                    </p>
                </div>
            </section>

            <div className="profile-layout-grid">
                <div className="profile-panel">
                    <div className="section-header">
                        <div>
                            <h2>Account Information</h2>
                            <p>Keep your contact metrics accurate to maintain security reachability.</p>
                        </div>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="profile-name">Account Name</label>
                            <div className="input-wrapper">
                                <FiUser className="input-icon" />
                                <input
                                    id="profile-name"
                                    type="text"
                                    value={name}
                                    onChange={handleNameChange}
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="profile-email">Email Address</label>
                            <div className="input-wrapper">
                                <FiMail className="input-icon" />
                                <input
                                    id="profile-email"
                                    type="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                        </div>

                        <hr className="form-divider" />

                        <div className="section-header">
                            <div>
                                <h2>Change Password</h2>
                                <p>Leave blank if you do not wish to adjust your current security entry credentials.</p>
                            </div>
                        </div>

                        <div className="form-grid-two-col">
                            <div className="form-group">
                                <label htmlFor="profile-password">New Password</label>
                                <div className="input-wrapper">
                                    <FiLock className="input-icon" />
                                    <input
                                        id="profile-password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={handlePasswordChange}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        style={{ position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", height: "100%" }}
                                    >
                                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>

                                {password.length > 0 && (
                                    <div className="password-checklist-grid" style={{ marginTop: "10px" }}>
                                        <span className={rules.length ? "met" : ""}>✓ Min 6 characters</span>
                                        <span className={rules.alphaNumeric ? "met" : ""}>✓ Alpha-numeric</span>
                                        <span className={rules.uppercase ? "met" : ""}>✓ 1 Uppercase</span>
                                        <span className={rules.specialChar ? "met" : ""}>✓ 1 Special (@$!%*?&)</span>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="profile-confirm-password">Confirm Password</label>
                                <div className="input-wrapper">
                                    <FiLock className="input-icon" />
                                    <input
                                        id="profile-confirm-password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={handleConfirmPasswordChange}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        style={{ position: "absolute", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", height: "100%" }}
                                    >
                                        {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions-wrapper">
                            <button
                                type="submit"
                                className="save-profile-btn"
                                disabled={loading}
                            >
                                {loading ? "Saving Changes..." : "Save Profile Settings"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}