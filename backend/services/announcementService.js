const db = require("../db");

const getClubAnnouncements = async (clubId) => {
  const [rows] = await db.query(
    `SELECT id, club_id, title, content, created_at
     FROM announcements
     WHERE club_id = ?
     ORDER BY created_at DESC, id DESC`,
    [clubId]
  );
  return rows;
};

const createClubAnnouncement = async ({ club_id, title, content }) => {
  const [result] = await db.query(
    "INSERT INTO announcements (club_id, title, content) VALUES (?, ?, ?)",
    [club_id, title, content]
  );

  const [rows] = await db.query(
    "SELECT id, club_id, title, content, created_at FROM announcements WHERE id = ?",
    [result.insertId]
  );
  return rows[0] || null;
};

const deleteClubAnnouncement = async ({ club_id, id }) => {
  const [result] = await db.query(
    "DELETE FROM announcements WHERE id = ? AND club_id = ?",
    [id, club_id]
  );

  return result.affectedRows > 0;
};

module.exports = {
  getClubAnnouncements,
  createClubAnnouncement,
  deleteClubAnnouncement,
};
