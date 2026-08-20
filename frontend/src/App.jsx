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
import ViewBills from "./pages/ViewBills";
import SingleBill from "./pages/SingleBill";
import PaymentReceipt from "./pages/PaymentReceipt";
import Announcement from "./pages/Announcement";
import AnnouncementDeliveryStatus from "./pages/AnnouncementDeliveryStatus";
import BillDeliveryStatus from "./pages/BillDeliveryStatus";
import BusinessInfo from "./pages/BusinessInfo";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Default */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Public Routes */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/business-info"
        element={<BusinessInfo />}
      />

      {/* Protected Routes */}
      <Route element={<AdminLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-customer"
          element={
            <ProtectedRoute>
              <AddCustomer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-customer/:id"
          element={
            <ProtectedRoute>
              <EditCustomer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/:id"
          element={
            <ProtectedRoute>
              <ViewCustomer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/daily-entry"
          element={
            <ProtectedRoute>
              <DailyEntry />
            </ProtectedRoute>
          }
        />

        <Route
          path="/price-settings"
          element={
            <ProtectedRoute>
              <PriceSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <Billing />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-receipt/:id"
          element={
            <ProtectedRoute>
              <PaymentReceipt />
            </ProtectedRoute>
          }
        />

        <Route
          path="/announcement"
          element={
            <ProtectedRoute>
              <Announcement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bill-delivery-status"
          element={
            <ProtectedRoute>
              <BillDeliveryStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcement-delivery-status"
          element={
            <ProtectedRoute>
              <AnnouncementDeliveryStatus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/view-bills"
          element={
            <ProtectedRoute>
              <ViewBills />
            </ProtectedRoute>
          }
        />

        <Route
          path="/view-bills/:id"
          element={
            <ProtectedRoute>
              <SingleBill />
            </ProtectedRoute>
          }
        />
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
