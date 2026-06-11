import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const customer = sessionStorage.getItem("customer");

  if (!customer) {
    return <Navigate to="/" replace />;
  }

  return children;
}