import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FAQ from "./pages/FAQ";
import ContactUs from "./pages/ContactUs";

import ProtectedRoute from "./components/layouts/ProtectedRoute";
import PublicRoute from "./components/layouts/PublicRoute";
import AcknowledgementReceipts from "./pages/AcknowledgementReceipts";
import SalesInvoices from "./pages/SalesInvoice";
import MyProfile from "./pages/MyProfile";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  const [customer, setCustomer] = useState(() => sessionStorage.getItem("customer"));

  return (
    <Router basename="/customer-portal">
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute customer={customer} setCustomer={setCustomer} />}>
          <Route index path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute customer={customer} setCustomer={setCustomer} />}>
          <Route index path="/dashboard" element={<Dashboard />} />
          <Route path="/sales-invoices" element={<SalesInvoices />} />
          <Route path="/acknowledgement-receipts" element={<AcknowledgementReceipts />} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact-us" element={<ContactUs />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;