import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUserPlus,
  FiCheckCircle,
} from "react-icons/fi";
import "../styles/login.css";
import logo from "../assets/aslogo.png";
import { API_URL } from "../constants/constants";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setErrorMessage("");

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!formData.email || !formData.password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("tag", "login");
      fd.append("email", formData.email);
      fd.append("password", formData.password);

      const response = await fetch(`${API_URL}/usertest.php`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const result = await response.json();

      if (result.success === 1) {
        sessionStorage.setItem("customer", JSON.stringify(result.data));

        navigate("/dashboard");
      } else {
        setErrorMessage(result.message || "Invalid email or password.");
      }
    } catch (error) {
      setErrorMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="autosweep-login-page">
      <section className="login-hero-section">
        <div className="login-hero-overlay"></div>

        <div className="login-hero-content">
          <div className="hero-badge">RFID Customer Self-Service</div>

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
              <FiCheckCircle />
              Check Balance
            </div>

            <div className="hero-feature">
              <FiCheckCircle />
              Download SOA
            </div>

            <div className="hero-feature">
              <FiCheckCircle />
              View Transactions
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

          {errorMessage && (
            <div className="login-error-message">
              {errorMessage}
            </div>
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
                  name="remember"
                  checked={formData.remember}
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
                <FiUserPlus />
                Register Account
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