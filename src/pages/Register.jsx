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

const invalidEmails = ["na@yahoo.com", "na@gmail.com", "n@yahoo.com", "n@gmail.com"];

export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    account: "",
    plate: "",
    email: "",
    password: "",
    retypePassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "plate" ? value.toUpperCase() : value,
    }));
  };

  const isInvalidEmail = (email) => {
    if (!email) return true;
    return invalidEmails.includes(String(email).toLowerCase().trim());
  };

  const handleVerifyAccount = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      /**
       * Replace this with your real PHP API.
       *
       * Expected response sample:
       * {
       *   success: 1,
       *   data: {
       *     account_number: "123456789",
       *     plate_number: "ABC1234",
       *     email: "na@yahoo.com"
       *   }
       * }
       */

      const response = await fetch("https://yourdomain.com/api/customer.php", {
        method: "POST",
        body: JSON.stringify({
          tag: "check_account_plate",
          account: formData.account,
          plate: formData.plate,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success !== 1) {
        setMessage(result.message || "Account and plate number not found.");
        return;
      }

      const customer = result.data;
      setAccountData(customer);

      if (!isInvalidEmail(customer.email)) {
        setMessage(
          "This account already has a registered email. Please proceed to login or use forgot password."
        );
        return;
      }

      setFormData((prev) => ({
        ...prev,
        email: "",
      }));

      setStep(2);
    } catch (error) {
      setMessage("Unable to verify account. Please try again.");
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

    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://yourdomain.com/api/customer.php", {
        method: "POST",
        body: JSON.stringify({
          tag: "complete_registration",
          account: formData.account,
          plate: formData.plate,
          email: formData.email,
          password: formData.password,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success !== 1) {
        setMessage(result.message || "Registration failed.");
        return;
      }

      alert("Registration complete. You may now login.");
      navigate("/login");
    } catch (error) {
      setMessage("Unable to complete registration. Please try again.");
    } finally {
      setLoading(false);
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
                <p>{accountData?.account_number || formData.account}</p>
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
                  value={formData.email}
                  onChange={handleChange}
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
              {loading ? "Saving..." : "Complete Registration"}
            </button>
          </form>
        )}

        <Link to="/login" className="back-login-link">
          <FiArrowLeft />
          Back to Login
        </Link>
      </div>
    </div>
  );
}