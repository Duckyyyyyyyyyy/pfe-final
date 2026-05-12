const clubService = require("../services/clubService");

const checkClubStatus = async (req, res, next) => {
  const clubId = Number(req.body.club_id);
  if (!clubId) {
    return res.status(400).json({ message: "club_id is required" });
  }

  try {
    const club = await clubService.getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (club.status === "SUSPENDED") {
      return res.status(403).json({ message: "Cannot perform this action while club is suspended" });
    }

    req.club = club;
    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = checkClubStatus;
