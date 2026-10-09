
import { lazy, Suspense } from "react";
import PageLoading from "./components/PageLoading";
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Plans = lazy(() => import("./pages/Plans"));
const Menu = lazy(() => import("./pages/Menu"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Contact = lazy(() => import("./pages/Contact"));
const Cart = lazy(() => import("./pages/Cart"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
import CustomerLayout from "./layouts/CustomerLayout";
import PublicWebsiteLayout from "./layouts/PublicWebsiteLayout";

const Login = lazy(() => import("./pages/Login"));
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const CustomerAccountSetup = lazy(() => import("./pages/CustomerAccountSetup"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const CustomerProfile = lazy(() => import("./pages/CustomerProfile"));
const CustomerBillHistory = lazy(() => import("./pages/CustomerBillHistory"));
const CustomerBillDetail = lazy(() => import("./pages/CustomerBillDetail"));
const CustomerPaymentHistory = lazy(() => import("./pages/CustomerPaymentHistory"));
const CustomerTiffinPlan = lazy(() => import("./pages/CustomerTiffinPlan"));
const CustomerAnnouncements = lazy(() => import("./pages/CustomerAnnouncements"));
const CustomerChangePassword = lazy(() => import("./pages/CustomerChangePassword"));
const CustomerForgotPassword = lazy(() => import("./pages/CustomerForgotPassword"));
const CustomerForgotUserId = lazy(() => import("./pages/CustomerForgotUserId"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CustomerLoginIdSender = lazy(() => import("./pages/CustomerLoginIdSender"));
import Customers from "./pages/Customers";
const Users = lazy(() => import("./pages/Users"));
const AddCustomer = lazy(() => import("./pages/AddCustomer"));
const EditCustomer = lazy(() => import("./pages/EditCustomer"));
const ViewCustomer = lazy(() => import("./pages/ViewCustomer"));
const MealDeliveries = lazy(() => import("./pages/MealDeliveries"));
const DailyEntry = lazy(() => import("./pages/DailyEntry"));
const BarcodeEntry = lazy(() => import("./pages/BarcodeEntry"));
const PriceSettings = lazy(() => import("./pages/PriceSettings"));
const Billing = lazy(() => import("./pages/Billing"));
const Payments = lazy(() => import("./pages/Payments"));
const ViewBills = lazy(() => import("./pages/ViewBills"));
const SingleBill = lazy(() => import("./pages/SingleBill"));
const PaymentReceipt = lazy(() => import("./pages/PaymentReceipt"));
const Announcement = lazy(() => import("./pages/Announcement"));
const WhatsAppInbox = lazy(() => import("./pages/WhatsAppInbox"));
const WhatsAppPaymentApproval = lazy(() => import("./pages/WhatsAppPaymentApproval"));
const AnnouncementDeliveryStatus = lazy(() => import("./pages/AnnouncementDeliveryStatus"));
const BillDeliveryStatus = lazy(() => import("./pages/BillDeliveryStatus"));
const CustomerModificationRequests = lazy(() => import("./pages/CustomerModificationRequests"));
const CustomerModificationSettings = lazy(() => import("./pages/CustomerModificationSettings"));
const BusinessInfo = lazy(() => import("./pages/BusinessInfo"));
const WebsiteSettings = lazy(() => import("./pages/WebsiteSettings"));
const WebsiteReviews = lazy(() => import("./pages/WebsiteReviews"));
const WebsiteOrders = lazy(() => import("./pages/WebsiteOrders"));
const WebsiteMenu = lazy(() => import("./pages/WebsiteMenu"));
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerProtectedRoute from "./components/CustomerProtectedRoute";
import { CartProvider } from "./context/CartContext";

export default function App() {
  return (
    <CartProvider>
      <Suspense fallback={<PageLoading />}><Routes>
      
            {/* Public Website */}
      <Route element={<PublicWebsiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      <Route path="/cart" element={<Cart />} />
      <Route path="/order-details" element={<OrderDetails />} />

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

      {/* Existing /admin bookmarks open the protected dashboard. */}
      <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

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
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
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

        <Route path="/meal-deliveries" element={<ProtectedRoute><MealDeliveries /></ProtectedRoute>} />
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
        path="/customer-login-id-sender"
        element={
          <ProtectedRoute>
            <CustomerLoginIdSender />
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
        path="/website-menu"
        element={
          <ProtectedRoute>
            <WebsiteMenu />
          </ProtectedRoute>
        }
      />
      <Route
        path="/website-settings"
        element={
          <ProtectedRoute>
            <WebsiteSettings />
          </ProtectedRoute>
        }
      />
      <Route path="/website-orders" element={<ProtectedRoute><WebsiteOrders /></ProtectedRoute>} />
      <Route
        path="/website-reviews"
        element={
          <ProtectedRoute>
            <WebsiteReviews />
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
      </Routes></Suspense>
    </CartProvider>
  );
}































