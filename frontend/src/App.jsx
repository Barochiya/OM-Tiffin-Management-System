import { Routes, Route, Navigate } from "react-router-dom";
import DailyEntry from "./pages/DailyEntry";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import EditCustomer from "./pages/EditCustomer";
import ViewCustomer from "./pages/ViewCustomer";
import PriceSettings from "./pages/PriceSettings"; // ✅ NEW
import Billing from "./pages/Billing";
import Payments from "./pages/Payments";
import PaymentReceipt from "./pages/PaymentReceipt";

export default function App() {
  return (
    <Routes>

      {/* Default */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Login */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      {/* Customers */}
      <Route
        path="/customers"
        element={<Customers />}
      />

      {/* Add Customer */}
      <Route
        path="/add-customer"
        element={<AddCustomer />}
      />

      {/* Edit Customer */}
      <Route
        path="/edit-customer/:id"
        element={<EditCustomer />}
      />

      {/* View Customer */}
      <Route
        path="/customer/:id"
        element={<ViewCustomer />}
      />

      {/* Price Settings */}
      <Route
        path="/price-settings"
        element={<PriceSettings />}
      />

      <Route
        path="/daily-entry"
        element={<DailyEntry />}
      />
      <Route
        path="/billing"
        element={<Billing />}
      />

      <Route
        path="/payments"
        element={<Payments />}
      />

      <Route
        path="/payment-receipt/:id"
        element={<PaymentReceipt />}
      />
      
      {/* 404 */}
      <Route
        path="*"
        element={
          <h1 className="text-center mt-20 text-3xl">
            404 - Page Not Found
          </h1>
        }
      />

    </Routes>
  );
}