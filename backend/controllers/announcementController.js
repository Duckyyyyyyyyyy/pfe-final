const announcementService = require("../services/announcementService");
const clubService = require("../services/clubService");

const getClubAnnouncements = async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    if (!Number.isInteger(clubId) || clubId <= 0) {
      return res.status(400).json({ message: "Invalid club id" });
    }

    const club = await clubService.getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const announcements = await announcementService.getClubAnnouncements(clubId);
    return res.json({ announcements });
  } catch (error) {
    console.error("[announcementController] getClubAnnouncements failed", error);
    return res.status(500).json({ message: error.message });
  }
};

const createClubAnnouncement = async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();

    if (!Number.isInteger(clubId) || clubId <= 0) {
      return res.status(400).json({ message: "Invalid club id" });
    }

    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required" });
    }

    const club = await clubService.getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (Number(club.president_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Only the club president can publish announcements" });
    }

    const announcement = await announcementService.createClubAnnouncement({
      club_id: clubId,
      title,
      content,
    });

    return res.status(201).json({ message: "Announcement published", announcement });
  } catch (error) {
    console.error("[announcementController] createClubAnnouncement failed", error);
    return res.status(500).json({ message: error.message });
  }
};

const deleteClubAnnouncement = async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const announcementId = Number(req.params.announcementId);

    if (!Number.isInteger(clubId) || clubId <= 0) {
      return res.status(400).json({ message: "Invalid club id" });
    }

    if (!Number.isInteger(announcementId) || announcementId <= 0) {
      return res.status(400).json({ message: "Invalid announcement id" });
    }

    const club = await clubService.getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (Number(club.president_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Only the club president can delete announcements" });
    }

    const deleted = await announcementService.deleteClubAnnouncement({
      club_id: clubId,
      id: announcementId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    return res.json({ message: "Announcement deleted", deleted: true, announcement_id: announcementId });
  } catch (error) {
    console.error("[announcementController] deleteClubAnnouncement failed", error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClubAnnouncements,
  createClubAnnouncement,
  deleteClubAnnouncement,
};
