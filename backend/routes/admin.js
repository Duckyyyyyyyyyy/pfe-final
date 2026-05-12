const express = require("express");
const adminController = require("../controllers/adminController");
const clubController = require("../controllers/clubController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/resources", authMiddleware, roleMiddleware("ADMIN"), adminController.getResources);
router.patch("/resources/:id", authMiddleware, roleMiddleware("ADMIN"), adminController.updateResource);
router.get("/authorizations", authMiddleware, roleMiddleware("ADMIN"), adminController.getAuthorizations);
router.put("/authorizations/:id/approve", authMiddleware, roleMiddleware("ADMIN"), adminController.approveAuthorization);
router.put("/authorizations/:id/reject", authMiddleware, roleMiddleware("ADMIN"), adminController.rejectAuthorization);
router.get("/clubs/:id/details", authMiddleware, roleMiddleware("ADMIN"), clubController.getClubDetails);
router.get("/clubs/:id/request-pdf", clubController.getClubRequestPdf);
router.get("/users", authMiddleware, roleMiddleware("ADMIN"), adminController.getUsers);
router.get("/users/:id/details", authMiddleware, roleMiddleware("ADMIN"), adminController.getUserDetails);
router.get("/students", authMiddleware, roleMiddleware("ADMIN"), adminController.getUsers);
router.get("/students/:id/details", authMiddleware, roleMiddleware("ADMIN"), adminController.getUserDetails);

module.exports = router;
