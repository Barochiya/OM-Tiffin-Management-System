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

// ===============================
// Middleware
// ===============================
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorMiddleware");

app.use(cors({
  origin: [
    "https://om-tiffin-management-system.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());
app.use(express.json());

// ===============================
// Logger
// ===============================
app.use((req, res, next) => {
  console.log(req.method, req.url);
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
app.use("/api/tiffins", tiffinRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/daily-entry", dailyEntryRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/payments", paymentRoutes);

// Dashboard
console.log("✅ Dashboard Route Registered");
app.use("/api/dashboard", dashboardRoutes);

// ===============================
// 404
// ===============================
app.use(notFound);

// ===============================
// Error Handler
// ===============================
app.use(errorHandler);

module.exports = app;