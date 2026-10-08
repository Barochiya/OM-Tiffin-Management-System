const express = require("express");
const router = express.Router();

const {
  getDashboard,
} = require("../controllers/dashboardController");

const protect = require('../middleware/authMiddleware');
const { getAdminNotifications } = require('../controllers/adminNotificationsController');
router.get('/notifications', protect, getAdminNotifications);
router.get('/', protect, getDashboard);

module.exports = router;