const express = require("express");
const membershipController = require("../controllers/membershipController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/memberships/mine", authMiddleware, membershipController.getMyMemberships);
router.get("/clubs/:id/membership", authMiddleware, membershipController.getMyMembershipForClub);
router.get("/clubs/:id/members", authMiddleware, roleMiddleware(["ADMIN", "PRESIDENT"]), membershipController.getClubMembers);
router.get("/clubs/:id/requests", authMiddleware, roleMiddleware(["ADMIN", "PRESIDENT"]), membershipController.getClubRequests);
router.post("/clubs/:id/join", authMiddleware, membershipController.requestMembership);
router.post("/memberships/:id/accept", authMiddleware, roleMiddleware(["ADMIN", "PRESIDENT"]), membershipController.acceptMembership);
router.post("/memberships/:id/reject", authMiddleware, roleMiddleware(["ADMIN", "PRESIDENT"]), membershipController.rejectMembership);
router.delete("/memberships/:id", authMiddleware, roleMiddleware(["ADMIN", "PRESIDENT"]), membershipController.removeMembership);
router.patch("/president/clubs/:clubId/members/:userId/role", authMiddleware, roleMiddleware("PRESIDENT"), membershipController.updatePresidentMemberRole);
router.patch("/admin/clubs/:clubId/members/:userId/remove", authMiddleware, roleMiddleware("ADMIN"), membershipController.adminRemoveClubMember);

module.exports = router;
