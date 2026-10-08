const express = require("express");
const router = express.Router();

const {
  getDashboard,
} = require("../controllers/dashboardController");

const protect = require('../middleware/authMiddleware');
const { getAdminNotifications, markNotificationsRead } = require('../controllers/adminNotificationsController');
router.get('/notifications', protect, getAdminNotifications);
router.post('/notifications/read', protect, markNotificationsRead);
router.get('/', protect, getDashboard);

module.exports = router;