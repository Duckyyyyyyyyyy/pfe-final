const db = require("../db");

const acceptedMembershipFilter = "m.user_id = ? AND COALESCE(UPPER(m.status), 'PENDING') = 'ACCEPTED'";

const getMyClubEvents = async (userId) => {
  const [rows] = await db.query(
    `SELECT DISTINCT
       e.id,
       e.club_id,
       e.title,
       e.event_date,
       e.location,
       c.name AS club_name
     FROM memberships m
     INNER JOIN clubs c ON m.club_id = c.id
     INNER JOIN events e ON e.club_id = c.id
     WHERE ${acceptedMembershipFilter}
     ORDER BY e.event_date ASC, e.id ASC`,
    [userId]
  );

  return rows;
};

const getMyClubAnnouncements = async (userId) => {
  const [rows] = await db.query(
    `SELECT DISTINCT
       a.id,
       a.club_id,
       a.title,
       a.content,
       a.created_at,
       c.name AS club_name
     FROM memberships m
     INNER JOIN clubs c ON m.club_id = c.id
     INNER JOIN announcements a ON a.club_id = c.id
     WHERE ${acceptedMembershipFilter}
     ORDER BY a.created_at DESC, a.id DESC`,
    [userId]
  );

  return rows;
};

const getOverviewFeed = async (userId) => {
  const [events, announcements] = await Promise.all([
    getMyClubEvents(userId),
    getMyClubAnnouncements(userId),
  ]);

  return { events, announcements };
};

const getMyClubRequest = async (userId) => {
  const [rows] = await db.query(
    `SELECT
       id,
       name,
       description,
       theme,
       faculte,
       activite,
       status,
       suspension_reason,
       created_at
     FROM clubs
     WHERE created_by = ?
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

const leaveClub = async (userId, clubId) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [memberships] = await connection.query(
      `SELECT id
       FROM memberships
       WHERE user_id = ?
         AND club_id = ?
         AND status = 'ACCEPTED'
       LIMIT 1`,
      [userId, clubId]
    );

    if (memberships.length === 0) {
      await connection.rollback();
      return false;
    }

    await connection.query(
      `DELETE ep
       FROM event_participation ep
       INNER JOIN events e ON ep.event_id = e.id
       WHERE ep.user_id = ? AND e.club_id = ?`,
      [userId, clubId]
    );

    await connection.query(
      "DELETE FROM memberships WHERE user_id = ? AND club_id = ? AND status = 'ACCEPTED'",
      [userId, clubId]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getMyClubEvents,
  getMyClubAnnouncements,
  getOverviewFeed,
  getMyClubRequest,
  leaveClub,
};
