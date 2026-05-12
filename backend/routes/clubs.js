const express = require("express");
const multer = require("multer");
const clubController = require("../controllers/clubController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
const uploadClubFiles = (req, res, next) => {
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "request_pdf", maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    console.error("[routes/clubs] upload failed", error);
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Only PDF files up to 10MB are allowed." });
    }

    return res.status(400).json({ message: error.message || "Invalid file upload." });
  });
};

router.post(
  "/",
  authMiddleware,
  uploadClubFiles,
  clubController.createClub
);
router.get("/", clubController.getClubs);
router.get("/mine", authMiddleware, clubController.getMyClub);
router.get("/:id/logo", clubController.getClubLogo);
router.get("/:id/request-pdf", clubController.getClubRequestPdf);
router.get("/:id/details", clubController.getClubDetails);
router.put("/:id", authMiddleware, clubController.updateClub);
router.post("/:id/approve", authMiddleware, roleMiddleware("ADMIN"), clubController.approveClub);
router.post("/:id/suspend", authMiddleware, roleMiddleware("ADMIN"), clubController.suspendClub);

module.exports = router;
