const express = require("express");

const router = express.Router();

const {
  getAnnouncementStatus,
} = require(
  "../controllers/announcementStatusController"
);

router.get(
  "/",
  getAnnouncementStatus
);

module.exports = router;