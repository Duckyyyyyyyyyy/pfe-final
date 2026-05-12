const clubService = require("../services/clubService");
const membershipService = require("../services/membershipService");

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";
const allowedLogoMimeTypes = new Set(["image/png", "image/jpeg"]);

const createClub = async (req, res) => {
  try {
    const { name, description, theme, faculte, activite } = req.body;
    const logoFile = req.files?.logo?.[0];
    const pdfFile = req.files?.request_pdf?.[0];
    const created_by = req.user.id;

    const hasAcceptedMembership = await membershipService.hasAnyAcceptedMembership(created_by);
    if (hasAcceptedMembership) {
      return res.status(403).json({
        message: "Vous \u00eates d\u00e9j\u00e0 membre d\u2019un club. Veuillez quitter vos clubs avant de cr\u00e9er une demande de club.",
      });
    }

    const missingFields = Object.entries({
      name,
      theme,
      faculte,
      activite,
      description,
      logo: logoFile,
      request_pdf: pdfFile,
    })
      .filter(([, value]) => isBlank(value))
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Please fill all required fields and attach logo + PDF.",
      });
    }

    if (pdfFile.mimetype !== "application/pdf") {
      return res.status(400).json({ message: "Only PDF files are allowed." });
    }

    const logoMimeType = clubService.detectImageMimeType(logoFile.buffer);
    if (!allowedLogoMimeTypes.has(logoMimeType)) {
      return res.status(400).json({ message: "Only PNG or JPEG logos are allowed." });
    }

    const club = await clubService.createClub({
      name: String(name).trim(),
      description: String(description).trim(),
      logo: logoFile.buffer,
      theme: String(theme).trim(),
      faculte: String(faculte).trim(),
      activite: String(activite).trim(),
      request_pdf: pdfFile.buffer,
      request_pdf_name: String(pdfFile.originalname || "club-request.pdf").trim(),
      created_by,
    });
    return res.status(201).json({ message: "Club created and pending approval", club });
  } catch (error) {
    console.error("[clubController] createClub failed", error);
    if (error.code === "STUDENT_ALREADY_ACCEPTED_MEMBER") {
      return res.status(403).json({ message: "Vous \u00eates d\u00e9j\u00e0 membre d\u2019un club. Veuillez quitter vos clubs avant de cr\u00e9er une demande de club." });
    }
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Only PDF files up to 10MB are allowed." });
    }
    return res.status(500).json({ message: error.message });
  }
};

const getClubs = async (req, res) => {
  try {
    const clubs = await clubService.getClubs();
    return res.json({ clubs });
  } catch (error) {
    console.error("[clubController] getClubs failed", error);
    return res.status(500).json({ message: error.message });
  }
};

const getMyClub = async (req, res) => {
  try {
    if (req.user.role !== "PRESIDENT" && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Only presidents or admins may access this resource" });
    }

    const club = await clubService.getClubByPresidentId(req.user.id);
    if (!club) {
      return res.status(404).json({ message: "Managed club not found" });
    }

    return res.json({ club });
  } catch (error) {
    console.error("[clubController] getMyClub failed", error);
    return res.status(500).json({ message: error.message });
  }
};

const getClubDetails = async (req, res) => {
  try {
    const clubId = Number(req.params.id);
    if (!Number.isInteger(clubId) || clubId <= 0) {
      return res.status(400).json({ message: "Invalid club id" });
    }

    const details = await clubService.getClubDetails(clubId);

    if (!details) {
      return res.status(404).json({ message: "Club not found" });
    }

    return res.json(details);
  } catch (error) {
    console.error("[clubController] getClubDetails failed", error);
    return res.status(500).json({ message: error.message });
  }
};

const getClubLogo = async (req, res) => {
  try {
    const clubId = Number(req.params.id);
    if (!Number.isInteger(clubId) || clubId <= 0) {
      return res.status(400).json({ message: "Invalid club id" });
    }

    const logo = await clubService.getClubLogo(clubId);
    if (!logo) {
      return res.status(404).json({ message: "Club logo not found" });
    }

    res.setHeader("Content-Type", logo.mimeType);
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.send(logo.buffer);
  } catch (error) {
    console.error("[clubController] getClubLogo failed", error);
    return res.status(500).json({ message: error.message });
  }
};

const getClubRequestPdf = async (req, res) => {
  try {
    const clubId = Number(req.params.id);
    if (!Number.isInteger(clubId) || clubId <= 0) {
      return res.status(400).json({ message: "Invalid club id" });
    }

    const pdf = await clubService.getClubRequestPdf(clubId);
    if (!pdf) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!pdf.buffer) {
      return res.status(404).json({ message: "Club request PDF not found" });
    }

    const fileName = String(pdf.fileName || `club-${clubId}-request.pdf`).replace(/["\r\n]/g, "");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    return res.send(pdf.buffer);
  } catch (error) {
    console.error("[clubController] getClubRequestPdf failed", error);
    return res.status(500).json({ message: error.message });
  }
};

const updateClub = async (req, res) => {
  try {
    const clubId = Number(req.params.id);
    const { name, description, logo, theme, faculte, activite } = req.body;
    const user = req.user;

    const club = await clubService.getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (user.role !== "ADMIN" && club.created_by !== user.id && club.president_id !== user.id) {
      return res.status(403).json({ message: "Only club creator, president, or admin may update this club" });
    }

    const updatedClub = await clubService.updateClub(clubId, { name, description, logo, theme, faculte, activite });
    return res.json({ message: "Club updated successfully", club: updatedClub });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const approveClub = async (req, res) => {
  try {
    const clubId = Number(req.params.id);
    const club = await clubService.getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (club.status === "APPROVED") {
      return res.status(400).json({ message: "Club is already approved" });
    }

    const approvedClub = await clubService.approveClub(clubId);
    return res.json({ message: "Club approved successfully", club: approvedClub });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const suspendClub = async (req, res) => {
  try {
    const clubId = Number(req.params.id);
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ message: "Suspension reason is required" });
    }

    const club = await clubService.getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const suspendedClub = await clubService.suspendClub(clubId, reason);
    return res.json({ message: "Club suspended successfully", club: suspendedClub });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createClub,
  getClubs,
  getMyClub,
  getClubDetails,
  getClubLogo,
  getClubRequestPdf,
  updateClub,
  approveClub,
  suspendClub,
};
