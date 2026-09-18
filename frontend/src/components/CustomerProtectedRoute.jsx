import { Navigate, Outlet } from "react-router-dom";
const CustomerProtectedRoute = () => {
  const token = sessionStorage.getItem("customerToken");
  if (!token) {
    return <Navigate to="/customer-login" replace />;
  }
  return <Outlet />;
};
export default CustomerProtectedRoute;
