const express = require("express");
const eventController = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const checkClubStatus = require("../middlewares/checkClubStatus");

const router = express.Router();

router.post("/", authMiddleware, checkClubStatus, eventController.createEvent);
router.get("/", eventController.getEvents);
router.get("/registrations/mine", authMiddleware, eventController.getMyRegistrations);
router.post("/:id/approve", authMiddleware, roleMiddleware("ADMIN"), eventController.approveEvent);
router.post("/:id/reject", authMiddleware, roleMiddleware("ADMIN"), eventController.rejectEvent);
router.post("/:id/register", authMiddleware, eventController.registerForEvent);
router.post("/:id/cancel", authMiddleware, eventController.cancelEventRegistration);

module.exports = router;
