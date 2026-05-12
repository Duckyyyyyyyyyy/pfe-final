const express = require("express");
const announcementController = require("../controllers/announcementController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/clubs/:clubId/announcements", announcementController.getClubAnnouncements);
router.post("/president/clubs/:clubId/announcements", authMiddleware, announcementController.createClubAnnouncement);
router.delete("/president/clubs/:clubId/announcements/:announcementId", authMiddleware, announcementController.deleteClubAnnouncement);

module.exports = router;
