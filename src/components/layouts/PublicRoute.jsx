import { Navigate, Outlet } from "react-router-dom";

// Accept customer as a prop from App.jsx
function PublicRoute({ customer, setCustomer }) {

    // If logged in, redirect them away from login/register to the dashboard
    if (customer) {
        return <Navigate to="/dashboard" replace />;
    }

    // If not logged in, render the public component (Login/Register)
    return <Outlet context={{ setCustomer }} />;
}

export default PublicRoute;