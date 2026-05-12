const studentService = require("../services/studentService");

const getMyClubEvents = async (req, res) => {
  try {
    const events = await studentService.getMyClubEvents(req.user.id);
    return res.json({ events });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMyClubAnnouncements = async (req, res) => {
  try {
    const announcements = await studentService.getMyClubAnnouncements(req.user.id);
    return res.json({ announcements });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getOverviewFeed = async (req, res) => {
  try {
    const feed = await studentService.getOverviewFeed(req.user.id);
    return res.json(feed);
  } catch (error) {
    console.error("[studentController] getOverviewFeed failed", error);
    return res.status(500).json({ message: error.message });
  }
};

const getMyClubRequest = async (req, res) => {
  try {
    const clubRequest = await studentService.getMyClubRequest(req.user.id);
    return res.json({ clubRequest });
  } catch (error) {
    console.error("[studentController] getMyClubRequest failed", error);
    return res.status(500).json({ message: error.message });
  }
};

const leaveClub = async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    if (!Number.isInteger(clubId) || clubId <= 0) {
      return res.status(400).json({ message: "Invalid club id" });
    }

    const leftClub = await studentService.leaveClub(req.user.id, clubId);
    if (!leftClub) {
      return res.status(400).json({ message: "You are not an accepted member of this club." });
    }

    return res.json({ message: "You left the club successfully" });
  } catch (error) {
    console.error("[studentController] leaveClub failed", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyClubEvents,
  getMyClubAnnouncements,
  getOverviewFeed,
  getMyClubRequest,
  leaveClub,
};
