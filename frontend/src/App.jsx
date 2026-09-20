import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
import CustomerLayout from "./layouts/CustomerLayout";

import Login from "./pages/Login";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerAccountSetup from "./pages/CustomerAccountSetup";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerBillHistory from "./pages/CustomerBillHistory";
import CustomerBillDetail from "./pages/CustomerBillDetail";
import CustomerPaymentHistory from "./pages/CustomerPaymentHistory";
import CustomerTiffinPlan from "./pages/CustomerTiffinPlan";
import CustomerAnnouncements from "./pages/CustomerAnnouncements";
import CustomerChangePassword from "./pages/CustomerChangePassword";
import CustomerForgotPassword from "./pages/CustomerForgotPassword";
import CustomerForgotUserId from "./pages/CustomerForgotUserId";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import EditCustomer from "./pages/EditCustomer";
import ViewCustomer from "./pages/ViewCustomer";
import DailyEntry from "./pages/DailyEntry";
import BarcodeEntry from "./pages/BarcodeEntry";
import PriceSettings from "./pages/PriceSettings";
import Billing from "./pages/Billing";
import Payments from "./pages/Payments";
import ViewBills from "./pages/ViewBills";
import SingleBill from "./pages/SingleBill";
import PaymentReceipt from "./pages/PaymentReceipt";
import Announcement from "./pages/Announcement";
import WhatsAppInbox from "./pages/WhatsAppInbox";
import WhatsAppPaymentApproval from "./pages/WhatsAppPaymentApproval";
import AnnouncementDeliveryStatus from "./pages/AnnouncementDeliveryStatus";
import BillDeliveryStatus from "./pages/BillDeliveryStatus";
import CustomerModificationRequests from "./pages/CustomerModificationRequests";
import CustomerModificationSettings from "./pages/CustomerModificationSettings";
import BusinessInfo from "./pages/BusinessInfo";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerProtectedRoute from "./components/CustomerProtectedRoute";

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

	<Route path="/customer-login" element={<CustomerLogin />} />
       <Route path="/customer-account-setup" element={<CustomerAccountSetup />} />
       <Route
         path="/customer-forgot-password"
         element={<CustomerForgotPassword />}
       />


      <Route
        path="/customer-forgot-user-id"
        element={<CustomerForgotUserId />}
       />
      <Route element={<CustomerProtectedRoute />}>
        <Route element={<CustomerLayout />}>
          <Route
            path="/customer/dashboard"
            element={<CustomerDashboard />}
          />
          <Route
            path="/customer/profile"
            element={<CustomerProfile />}
          />
          <Route
            path="/customer/change-password"
            element={<CustomerChangePassword />}
          />
          <Route
            path="/customer/bills"
            element={<CustomerBillHistory />}
          />
          <Route
            path="/customer/bills/:billId"
            element={<CustomerBillDetail />}
          />
          <Route
            path="/customer/payments"
            element={<CustomerPaymentHistory />}
          />
          <Route
            path="/customer/tiffin-plan"
            element={<CustomerTiffinPlan />}
          />
          <Route
            path="/customer/announcements"
            element={<CustomerAnnouncements />}
          />
        </Route>
      </Route>

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
        path="/barcode-entry"
        element={
          <ProtectedRoute>
            <BarcodeEntry />
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
            path="/whatsapp-inbox"
            element={
              <ProtectedRoute>
                <WhatsAppInbox />
              </ProtectedRoute>
            }
          />

          <Route
            path="/whatsapp-payment-approval"
            element={
              <ProtectedRoute>
                <WhatsAppPaymentApproval />
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
        path="/customer-modification-requests"
        element={
          <ProtectedRoute>
            <CustomerModificationRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer-modification-settings"
        element={
          <ProtectedRoute>
            <CustomerModificationSettings />
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

      <Route
        path="*"
        element={
          <h1 className="text-center mt-20 text-3xl">
            404 - Page Not Found
          </h1>
        }
      />
      </Route>
    </Routes>
  );
}













