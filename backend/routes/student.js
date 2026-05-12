const express = require("express");
const studentController = require("../controllers/studentController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/my-club-events", authMiddleware, studentController.getMyClubEvents);
router.get("/my-club-announcements", authMiddleware, studentController.getMyClubAnnouncements);
router.get("/overview-feed", authMiddleware, studentController.getOverviewFeed);
router.get("/my-club-request", authMiddleware, studentController.getMyClubRequest);
router.delete("/clubs/:clubId/leave", authMiddleware, studentController.leaveClub);

module.exports = router;
