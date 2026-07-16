import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUserPlus,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import "../styles/login.css";
import logo from "../assets/logo3.png";
import { API_URL, emojiRegex } from "../constants/constants";
import { useOutletContext } from "react-router-dom";

const MAX_ATTEMPTS = 5;

export default function Login() {
  const { setCustomer } = useOutletContext();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Tracking metrics
  const [isLocked, setIsLocked] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember_me: false,
  });

  // Dynamically update remaining attempts when the user types a tracked email
  useEffect(() => {
    const emailKey = formData.email.toLowerCase().trim();
    if (!emailKey) {
      setAttemptsLeft(MAX_ATTEMPTS);
      setIsLocked(false);
      return;
    }

    // Check if tracked as locally locked out first
    const lockedAccounts = JSON.parse(localStorage.getItem("locked_accounts") || "[]");
    if (lockedAccounts.includes(emailKey)) {
      setIsLocked(true);
      setAttemptsLeft(0);
      setErrorMessage("Too many failed attempts. Your account has been locked.");
      return;
    }

    // Otherwise show dynamic countdown from localStorage tracking
    const allAttempts = JSON.parse(localStorage.getItem("email_login_attempts") || "{}");
    const currentFailures = allAttempts[emailKey] || 0;
    setAttemptsLeft(Math.max(0, MAX_ATTEMPTS - currentFailures));
    setIsLocked(false);
  }, [formData.email]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setErrorMessage("");
    setIsLocked(false); // Reset visual lock message when user corrects/modifies inputs

    let sanitizedValue = value;

    if (name === "email") {
      sanitizedValue = value.replace(/\s/g, "").replace(emojiRegex, "");
    } else if (name === "password") {
      sanitizedValue = value.replace(emojiRegex, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : sanitizedValue,
    }));
  };

  // Sends the API notification to the server to lock the account
  const notifyServerLockout = async (emailToLock) => {
    try {
      const lockData = new FormData();
      lockData.append("tag", "lockaccount");
      lockData.append("email", emailToLock);

      await fetch(`${API_URL}/index.php`, {
        method: "POST",
        credentials: "include",
        body: lockData,
      });
    } catch (error) {
      console.error("Failed to notify server of account lockout:", error);
    }
  };

  const handleFailedAttempt = async (userEmail) => {
    const emailKey = userEmail.toLowerCase().trim();
    const allAttempts = JSON.parse(localStorage.getItem("email_login_attempts") || "{}");

    const currentAttempts = (allAttempts[emailKey] || 0) + 1;
    allAttempts[emailKey] = currentAttempts;
    localStorage.setItem("email_login_attempts", JSON.stringify(allAttempts));

    const remaining = MAX_ATTEMPTS - currentAttempts;
    setAttemptsLeft(remaining);

    if (currentAttempts >= MAX_ATTEMPTS) {
      const lockedAccounts = JSON.parse(localStorage.getItem("locked_accounts") || "[]");
      if (!lockedAccounts.includes(emailKey)) {
        lockedAccounts.push(emailKey);
        localStorage.setItem("locked_accounts", JSON.stringify(lockedAccounts));
      }

      setIsLocked(true);
      setErrorMessage("Too many failed attempts. Your account has been locked.");
      await notifyServerLockout(emailKey);
    } else {
      setIsLocked(false);
      setErrorMessage("Invalid email or password.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.email || !formData.password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    const emailKey = formData.email.toLowerCase().trim();
    const lockedAccounts = JSON.parse(localStorage.getItem("locked_accounts") || "[]");
    const allAttempts = JSON.parse(localStorage.getItem("email_login_attempts") || "{}");

    setLoading(true);

    const lockAccountLocally = (msg) => {
      setIsLocked(true);
      setErrorMessage(msg || "This account has been locked. Please contact support for help.");
      setAttemptsLeft(0);

      if (!lockedAccounts.includes(emailKey)) {
        lockedAccounts.push(emailKey);
        localStorage.setItem("locked_accounts", JSON.stringify(lockedAccounts));
      }
    };

    const unlockAccountLocally = () => {
      setIsLocked(false);
      setAttemptsLeft(MAX_ATTEMPTS);
      delete allAttempts[emailKey];
      localStorage.setItem("email_login_attempts", JSON.stringify(allAttempts));

      const remainingLocks = lockedAccounts.filter(acc => acc !== emailKey);
      localStorage.setItem("locked_accounts", JSON.stringify(remainingLocks));
    };

    try {
      const fd = new FormData();
      fd.append("tag", "login");
      fd.append("email", formData.email);
      fd.append("password", formData.password);
      fd.append("remember_me", formData.remember_me);

      const response = await fetch(`${API_URL}/index.php`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const result = await response.json();

      // 1. SERVER ERROR FLOW (success: 0)
      if (result.success === 0) {
        const status = Number(result.account_status);

        if (status === 2 || status === 3) {
          lockAccountLocally("This account is locked. Please contact support or reset your password.");
          return;
        }

        // regular bad password payload (status === 1) -> trigger local countdown decay
        await handleFailedAttempt(formData.email);
        return;
      }

      // 2. SERVER SUCCESS FLOW (success: 1)
      if (result.success === 1) {
        const activeStatus = Number(result.data?.active);

        if (activeStatus === 2) {
          lockAccountLocally("This account has been locked. Please contact support for help.");
          return;
        }

        // If active status is 1 (Active) or 3 (Locked but authorized to login & change pass)
        unlockAccountLocally();

        // Save credentials to local session tracking
        const userDataString = JSON.stringify(result.data);
        sessionStorage.setItem("customer", userDataString);

        if (typeof setCustomer === "function") {
          setCustomer(userDataString);
        }
      }

    } catch (error) {
      console.error("Login connection error:", error);

      // Fallback: If network is dead, rely on local storage to enforce strict lockouts
      if (lockedAccounts.includes(emailKey)) {
        setIsLocked(true);
        setErrorMessage("This account is locally locked. Please reconnect to the internet to check status.");
        setAttemptsLeft(0);
      } else {
        setErrorMessage("Unable to connect to the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="autosweep-login-page">
      <section className="login-hero-section">
        <div className="login-hero-overlay"></div>

        <div className="login-hero-content">
          <h1>
            Autosweep
            <span>Customer Web Portal</span>
          </h1>
          <div className="hero-line"></div>
          <p>
            Manage your RFID account anytime, anywhere. Check your balance,
            download statements, view transactions, and update your account
            securely.
          </p>

          <div className="hero-features">
            <div className="hero-feature">
              <FiCheckCircle /> Check Balance
            </div>
            <div className="hero-feature">
              <FiCheckCircle /> Download SOA
            </div>
            <div className="hero-feature">
              <FiCheckCircle /> View Transactions
            </div>
          </div>
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-form-wrapper">
          <div className="login-logo-area">
            <img src={logo} alt="Autosweep Logo" className="autosweep-logo" />
          </div>

          <div className="login-heading">
            <h3>Welcome Back</h3>
            <p>Sign in to continue to your Autosweep RFID account.</p>
          </div>

          {/* COMBINED MESSAGE CONTAINER */}
          {!loading && (
            isLocked ? (
              <div className="login-lockout-message">
                <FiAlertTriangle className="lockout-icon" />
                <div>
                  <strong>Account Locked</strong>
                  <p>{errorMessage}</p>
                </div>
              </div>
            ) : (
              errorMessage && (
                <div className="combined-error-container">
                  <FiAlertTriangle className="combined-error-icon" />
                  <div className="combined-error-content">
                    <span className="main-error-msg">{errorMessage}</span>
                    {attemptsLeft < MAX_ATTEMPTS && attemptsLeft > 0 && (
                      <span className="sub-attempts-msg">
                        You have <strong>{attemptsLeft}</strong> login {attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining for this email.
                      </span>
                    )}
                  </div>
                </div>
              )
            )
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label>Email Address</label>
              <div className="login-input-box">
                <FiMail />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label>Password</label>
              <div className="login-input-box">
                <FiLock />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  name="remember_me"
                  checked={formData.remember_me}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="login-register-box">
              <span>Don&apos;t have an account?</span>
              <Link to="/register">
                <FiUserPlus /> Register Account
              </Link>
            </div>
          </form>

          <p className="login-footer-note">
            © {new Date().getFullYear()} Autosweep RFID. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}