import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import EditCustomer from "./pages/EditCustomer";
import ViewCustomer from "./pages/ViewCustomer";
import DailyEntry from "./pages/DailyEntry";
import PriceSettings from "./pages/PriceSettings";
import Billing from "./pages/Billing";
import Payments from "./pages/Payments";
import PaymentReceipt from "./pages/PaymentReceipt";
import Announcement from "./pages/Announcement";

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

      {/* Admin Layout */}
      <Route element={<AdminLayout />}>

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/customers"
          element={<Customers />}
        />

        <Route
          path="/add-customer"
          element={<AddCustomer />}
        />

        <Route
          path="/edit-customer/:id"
          element={<EditCustomer />}
        />

        <Route
          path="/customer/:id"
          element={<ViewCustomer />}
        />

        <Route
          path="/daily-entry"
          element={<DailyEntry />}
        />

        <Route
          path="/price-settings"
          element={<PriceSettings />}
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
        <Route path="/announcement" element={<Announcement />} />

      </Route>

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