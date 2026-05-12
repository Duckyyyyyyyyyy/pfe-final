const db = require("../db");

const registrationSelect = `
  SELECT
    ep.*,
    e.title,
    e.description,
    e.event_date,
    e.location,
    e.max_participants,
    e.status AS event_status,
    c.id AS club_id,
    c.name AS club_name
  FROM event_participation ep
  INNER JOIN events e ON ep.event_id = e.id
  LEFT JOIN clubs c ON e.club_id = c.id
`;

const registerToEvent = async (user_id, event_id) => {
  const existing = await getRegistrationByUserAndEvent(user_id, event_id);

  if (existing) {
    if (String(existing.status || "").toUpperCase() === "CANCELLED") {
      await db.query(
        "UPDATE event_participation SET status = 'REGISTERED' WHERE id = ?",
        [existing.id]
      );
    }

    return getRegistrationByUserAndEvent(user_id, event_id);
  }

  const [result] = await db.query(
    "INSERT INTO event_participation (user_id, event_id) VALUES (?, ?)",
    [user_id, event_id]
  );
  return getRegistrationByUserAndEvent(user_id, event_id);
};

const cancelRegistration = async (user_id, event_id) => {
  await db.query(
    "UPDATE event_participation SET status = 'CANCELLED' WHERE user_id = ? AND event_id = ?",
    [user_id, event_id]
  );
  return getRegistrationByUserAndEvent(user_id, event_id);
};

const getRegistrationsByUserId = async (userId) => {
  const [rows] = await db.query(
    `${registrationSelect} WHERE ep.user_id = ? ORDER BY e.event_date DESC, ep.id DESC`,
    [userId]
  );
  return rows;
};

const getRegistrationByUserAndEvent = async (userId, eventId) => {
  const [rows] = await db.query(
    `${registrationSelect} WHERE ep.user_id = ? AND ep.event_id = ? ORDER BY ep.id DESC LIMIT 1`,
    [userId, eventId]
  );
  return rows[0] || null;
};

module.exports = {
  registerToEvent,
  cancelRegistration,
  getRegistrationsByUserId,
  getRegistrationByUserAndEvent,
};
