import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiCreditCard,
  FiHash,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import "../styles/register.css";
import logo from "../assets/aslogo.png";
import { API_URL, emojiRegex } from "../constants/constants";

const invalidEmails = ["na@yahoo.com", "na@gmail.com", "n@yahoo.com", "n@gmail.com"];

// Helper function to mask the email for UI display
const maskEmail = (email) => {
  if (!email || !email.includes("@")) return "";

  const [localPart, domain] = email.split("@");

  // If the local part is too short (1 or 2 characters), mask everything except the first character
  if (localPart.length <= 2) {
    const maskLength = localPart.length - 1;
    return `${localPart[0]}${"*".repeat(maskLength)}@${domain}`;
  }

  // Otherwise, keep the first and last character, and mask everything in between
  const maskLength = localPart.length - 2;
  return `${localPart[0]}${"*".repeat(maskLength)}${localPart[localPart.length - 1]}@${domain}`;
};

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [message, setMessage] = useState("");

  const [isEmailInputDisabled, setEmailInputDisabled] = useState(false);

  const [formData, setFormData] = useState({
    account: "",
    plate: "",
    email: "",
    password: "",
    retypePassword: "",
    name: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    let sanitizedValue = value;

    if (name === "account") {
      // Restrict to digits only
      sanitizedValue = value.replace(/\D/g, "");
    } else if (name === "plate") {
      // Restrict to alpha-numeric characters and force uppercase
      sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    } else if (name === "email") {
      // Disallow spaces and emojis entirely
      sanitizedValue = value.replace(/\s/g, "").replace(emojiRegex, "");
    } else if (name === "password" || name === "retypePassword") {
      // Strict Whitelist Filter: Strips spaces, emojis, AND any symbol NOT in [a-zA-Z0-9@$!%*?&]
      sanitizedValue = value
        .replace(/\s/g, "")
        .replace(emojiRegex, "")
        .replace(/[^a-zA-Z0-9@$!%*?&]/g, ""); // Instant-rejects unlisted characters like #
    }

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const isInvalidEmail = (email) => {
    if (!email) return true;
    return invalidEmails.includes(String(email).toLowerCase().trim());
  };

  // ==========================================
  // REAL-TIME PASSWORD VALIDATORS
  // ==========================================
  const rules = {
    length: formData.password.length >= 6,
    alphaNumeric: /[a-zA-Z]/.test(formData.password) && /\d/.test(formData.password),
    uppercase: /[A-Z]/.test(formData.password),
    specialChar: /[@$!%*?&]/.test(formData.password),
  };

  const handleVerifyAccount = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const localCheckPayload = new FormData();
      localCheckPayload.append("tag", "checkaccount");
      localCheckPayload.append("account_number", formData.account);
      localCheckPayload.append("plate_number", formData.plate);

      const dbCheckRes = await fetch(`${API_URL}/index.php`, {
        method: "POST",
        body: localCheckPayload,
      });

      const dbCheckResult = await dbCheckRes.json();

      if (dbCheckResult.success !== 1) {
        setMessage(dbCheckResult.msg || "Error performing database check.");
        return;
      }

      if (dbCheckResult.exist === true) {
        setMessage("This account and plate number combination is already registered. Please login.");
        return;
      }

      const accountPayload = new FormData();
      accountPayload.append("tag", "checkaccountams");
      accountPayload.append("account_number", formData.account);

      const platePayload = new FormData();
      platePayload.append("tag", "checkplateams");
      platePayload.append("plate", formData.plate);

      const accountRes = await fetch(`${API_URL}/index.php`, {
        method: "POST",
        body: accountPayload,
      });

      const plateRes = await fetch(`${API_URL}/index.php`, {
        method: "POST",
        body: platePayload,
      });

      const accountResult = await accountRes.json();
      const plateResult = await plateRes.json();

      if (accountResult.success !== 1 || !accountResult.data) {
        setMessage(accountResult.msg || "Account number not found in AMS.");
        return;
      }
      if (plateResult.success !== 1 || !plateResult.data) {
        setMessage(plateResult.msg || "Plate number not found in AMS.");
        return;
      }

      const accountDataFromAms = accountResult.data;
      const plateDataFromAms = plateResult.data;

      const accIDFromAccountCheck = accountDataFromAms.AccountID;
      const accIDFromPlateCheck = plateDataFromAms.AccountID;

      const plateFromAccountCheck = String(accountDataFromAms.PlateNumber || "").trim().toUpperCase();
      const atgPlateFromAccountCheck = String(accountDataFromAms.ATGPlateNumber || "").trim().toUpperCase();

      const plateFromPlateCheck = String(plateDataFromAms.PlateNumber || "").trim().toUpperCase();
      const atgPlateFromPlateCheck = String(plateDataFromAms.ATGPlateNumber || "").trim().toUpperCase();

      const isAccountMatch = accIDFromAccountCheck && accIDFromPlateCheck && (accIDFromAccountCheck === accIDFromPlateCheck);

      const isPlateMatch =
        (plateFromAccountCheck && plateFromAccountCheck === plateFromPlateCheck) ||
        (atgPlateFromAccountCheck && atgPlateFromAccountCheck === atgPlateFromPlateCheck) ||
        (plateFromAccountCheck && plateFromAccountCheck === atgPlateFromPlateCheck) ||
        (atgPlateFromAccountCheck && atgPlateFromAccountCheck === plateFromPlateCheck);

      if (!isAccountMatch || !isPlateMatch) {
        setMessage("Verification failed: Account number and Plate number records do not match in AMS.");
        return;
      }

      setAccountData(accountDataFromAms);

      const existingEmail = accountDataFromAms.EmailAddress || plateDataFromAms.EmailAddress;
      const isValidExistingEmail = !isInvalidEmail(existingEmail);

      setFormData((prev) => ({
        ...prev,
        name: accountDataFromAms.FirstName + " " + accountDataFromAms.LastName || "AUTOSWEEP TO GO",
        email: isValidExistingEmail ? existingEmail : "",
      }));

      setEmailInputDisabled(isValidExistingEmail);
      setStep(2);
    } catch (error) {
      setMessage("Unable to verify details due to server connectivity problems. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e) => {
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
      const completeRegistrationPayload = new FormData();
      completeRegistrationPayload.append("tag", "register");
      completeRegistrationPayload.append("account_number", formData.account);
      completeRegistrationPayload.append("plate_number", formData.plate);
      completeRegistrationPayload.append("email", formData.email); // Sends the raw unmasked email address
      completeRegistrationPayload.append("password", formData.password);
      completeRegistrationPayload.append("name", formData.name);

      const response = await fetch(`${API_URL}/index.php`, {
        method: "POST",
        body: completeRegistrationPayload,
      });

      const result = await response.json();

      if (result.success !== 1) {
        setMessage(result.msg || "Registration failed.");
        return;
      }

      setStep(3);
    } catch (error) {
      setMessage("Unable to complete registration. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterBack = (e) => {
    e.preventDefault();
    if (step > 1) {
      setStep(step - 1);
    } else if (step === 1) {
      navigate("/login");
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-logo-area">
          <img src={logo} alt="Autosweep Logo" className="register-logo" />
        </div>

        <div className="register-heading">
          <h2>Verify Autosweep Account</h2>
          <p>Verify your Autosweep RFID account.</p>
        </div>

        <div className="register-stepper">
          <div className={`step-item ${step >= 1 ? "active" : ""}`}>
            <span>1</span>
            <p>Verify Account</p>
          </div>

          <div className="step-line"></div>

          <div className={`step-item ${step >= 2 ? "active" : ""}`}>
            <span>2</span>
            <p>Set Login Details</p>
          </div>

          <div className="step-line"></div>

          <div className={`step-item ${step >= 3 ? "active" : ""}`}>
            <span>3</span>
            <p>Register Done</p>
          </div>
        </div>

        {message && <div className="register-message">{message}</div>}

        {step === 1 && (
          <form onSubmit={handleVerifyAccount}>
            <div className="register-field">
              <label>Account Number</label>
              <div className="register-input-box">
                <FiCreditCard />
                <input
                  type="text"
                  name="account"
                  placeholder="Enter account number"
                  value={formData.account}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label>Plate Number</label>
              <div className="register-input-box">
                <FiHash />
                <input
                  type="text"
                  name="plate"
                  placeholder="Enter plate number"
                  value={formData.plate}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button type="submit" className="register-submit-btn" disabled={loading}>
              {loading ? "Checking..." : "Verify Account"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleCompleteRegistration}>
            <div className="verified-box">
              <FiCheckCircle />
              <div>
                <strong>Account verified</strong>
                <p>{accountData?.account_number || formData.account} | {accountData?.plate_number || formData.plate}</p>
              </div>
            </div>

            <div className="register-field">
              <label>Email Address</label>
              <div className="register-input-box">
                <FiMail />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your active email"
                  /* Masks view only if autofilled/disabled; otherwise handles raw keyboard input state */
                  value={isEmailInputDisabled ? maskEmail(formData.email) : formData.email}
                  onChange={handleChange}
                  disabled={isEmailInputDisabled || loading}
                  required
                />
              </div>
            </div>

            <div className="register-field">
              <label>Password</label>
              <div className="register-input-box">
                <FiLock />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="register-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <div className="password-checklist-grid">
                <span className={rules.length ? "met" : ""}>✓ Min 6 characters</span>
                <span className={rules.alphaNumeric ? "met" : ""}>✓ Alpha-numeric</span>
                <span className={rules.uppercase ? "met" : ""}>✓ 1 Uppercase</span>
                <span className={rules.specialChar ? "met" : ""}>✓ 1 Special (@$!%*?&)</span>
              </div>
            </div>

            <div className="register-field">
              <label>Retype Password</label>
              <div className="register-input-box">
                <FiLock />
                <input
                  type={showRetypePassword ? "text" : "password"}
                  name="retypePassword"
                  placeholder="Retype password"
                  value={formData.retypePassword}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="register-eye-btn"
                  onClick={() => setShowRetypePassword((prev) => !prev)}
                >
                  {showRetypePassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="register-submit-btn" disabled={loading}>
              {loading ? "Saving..." : "Submit"}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="register-success-pane">
            <FiCheckCircle className="success-icon animate-pop" />
            <h3>Registration Complete!</h3>
            <p>Your Autosweep RFID account is now active.</p>
            <button onClick={() => navigate("/login")} className="register-submit-btn">
              Back to Login
            </button>
          </div>
        )}

        {step !== 3 && (
          <Link onClick={handleRegisterBack} className="back-login-link">
            <FiArrowLeft />
            {step === 1 ? "Back to Login" : "Go Back"}
          </Link>
        )}
      </div>
    </div>
  );
}