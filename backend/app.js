const express = require("express");
const cors = require("cors");

const app = express();

console.log("🔥 app.js loaded");

// ===============================
// Routes
// ===============================

const tiffinRoutes = require("./routes/tiffinRoutes");
const adminRoutes = require("./routes/adminRoutes");
const priceRoutes = require("./routes/priceRoutes");
const dailyEntryRoutes = require("./routes/dailyEntryRoutes");
const billRoutes = require("./routes/billRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Razorpay Payment Gateway
const paymentGatewayRoutes = require("./routes/paymentGatewayRoutes");

// ===============================
// Middleware
// ===============================

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorMiddleware");

app.use(
  cors({
    origin: [
      "https://om-tiffin-management-system.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.options("*", cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ===============================
// Request Logger
// ===============================

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ===============================
// Home Route
// ===============================

app.get("/", (req, res) => {
  res.send("🚀 Welcome to OM Tiffin Management System API");
});
// ===============================
// API Routes
// ===============================

// Customers
app.use("/api/tiffins", tiffinRoutes);

// Admin
app.use("/api/admin", adminRoutes);

// Meal Prices
app.use("/api/prices", priceRoutes);

// Daily Entry
app.use("/api/daily-entry", dailyEntryRoutes);

// Monthly Bills
app.use("/api/bills", billRoutes);

// Manual Payments
app.use("/api/payments", paymentRoutes);

// Razorpay Payment Gateway
app.use(
  "/api/payment-gateway",
  paymentGatewayRoutes
);

// Dashboard
console.log(
  "✅ Dashboard Route Registered"
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

// ===============================
// 404 Handler
// ===============================

app.use(notFound);

// ===============================
// Global Error Handler
// ===============================

app.use(errorHandler);

// ===============================
// Export App
// ===============================

module.exports = app;
