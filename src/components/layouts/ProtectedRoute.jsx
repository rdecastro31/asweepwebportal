import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import PortalHeader from "../PortalHeader";
import PortalSidebar from "../PortalSidebar";
import PortalFooter from "../PortalFooter";
import "../../styles/portal-layout.css";
import { handleLogout } from "../../constants/helpers";
import ForceChangePassword from "../../pages/ForceChangePassword";
import { API_URL } from "../../constants/constants";

// Worker import moved here
import HeartbeatWorker from "../../workers/heartbeat.worker.js?worker";

export default function ProtectedRoute({ customer, setCustomer }) {
  const [isValidating, setIsValidating] = useState(!customer);
  const mainScrollRef = useRef(null);

  // 1. Session Verification Effect
  useEffect(() => {
    const verifySessionOnProtected = async () => {
      if (customer) {
        setIsValidating(false);
        return;
      }

      try {
        const fd = new FormData();
        fd.append("tag", "verify_session");

        const response = await fetch(`${API_URL}/index.php`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });

        const result = await response.json();

        if (result.success === 1) {
          const userString = JSON.stringify(result.data);
          sessionStorage.setItem("customer", userString);
          setCustomer(userString);
        } else {
          sessionStorage.removeItem("customer");
          setCustomer(null);
        }
      } catch (error) {
        console.error("Session verification failed:", error);
        sessionStorage.removeItem("customer");
        setCustomer(null);
      } finally {
        setIsValidating(false);
      }
    };

    verifySessionOnProtected();
  }, [customer, setCustomer]);

  // 2. Heartbeat Worker Effect (Only runs when validation passes and customer exists)
  useEffect(() => {
    if (!customer || isValidating) return;

    const worker = new HeartbeatWorker();

    worker.onmessage = (e) => {
      if (e.data.status === "unauthorized") {
        worker.terminate();
        sessionStorage.removeItem("customer");
        setCustomer(null);
      }
    };

    worker.postMessage({
      action: "start",
      apiUrl: API_URL,
      interval: 300000,
    });

    return () => {
      worker.terminate();
    };
  }, [customer, isValidating, setCustomer]);

  // Loading indicator for validation phase
  if (isValidating) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return <Navigate to="/login" replace />;
  }

  const customerData = typeof customer === "string" ? JSON.parse(customer) : customer;
  const requiresPasswordReset = customerData?.active === 3 || customerData?.active === "3";

  if (requiresPasswordReset) {
    return (
      <div className="portal-page">
        <PortalHeader
          customer={customerData}
          onLogout={() => handleLogout(setCustomer)}
        />
        <div className="portal-body" style={{ justifyContent: "center", alignItems: "center" }}>
          <ForceChangePassword customerData={customerData} setCustomer={setCustomer} />
        </div>
        <PortalFooter />
      </div>
    );
  }

  return (
    <div className="portal-page">
      <PortalHeader
        customer={customerData}
        onLogout={() => handleLogout(setCustomer)}
      />
      <div className="portal-body">
        <PortalSidebar />
        <main className="portal-content" ref={mainScrollRef}>
          <Outlet context={{ setCustomer, mainScrollRef }} />
        </main>
      </div>
      <PortalFooter />
    </div>
  );
}