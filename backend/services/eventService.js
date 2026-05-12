const db = require("../db");

const createEvent = async ({ club_id, title, description, event_date, location, max_participants, salle, materiel, budget }) => {
  const [result] = await db.query(
    "INSERT INTO events (club_id, title, description, event_date, location, max_participants) VALUES (?, ?, ?, ?, ?, ?)",
    [club_id, title, description, event_date, location, max_participants]
  );

  const eventId = result.insertId;
  try {
    await db.query(
      "INSERT INTO authorizations (event_id, salle, materiel, budget, status) VALUES (?, ?, ?, ?, 'PENDING')",
      [eventId, salle || null, materiel || null, budget || null]
    );
  } catch (error) {
    console.error("Failed to create event authorization", error);
  }

  return getEventById(eventId);
};

const getEvents = async () => {
  const [rows] = await db.query(
    `SELECT
       e.*,
       c.name AS club_name,
       c.status AS club_status,
       a.id AS authorization_id,
       a.salle,
       a.materiel,
       a.budget,
       a.status AS resource_status,
       a.admin_comment
     FROM events e
     LEFT JOIN clubs c ON e.club_id = c.id
     LEFT JOIN authorizations a ON a.event_id = e.id
     ORDER BY e.created_at DESC`
  );
  return rows;
};

const getEventById = async (id) => {
  const [rows] = await db.query("SELECT * FROM events WHERE id = ?", [id]);
  return rows[0] || null;
};

const approveEvent = async (id) => {
  await db.query("UPDATE events SET status = 'APPROVED', updated_at = ? WHERE id = ?", [new Date(), id]);
  return getEventById(id);
};

const rejectEvent = async (id) => {
  await db.query("UPDATE events SET status = 'REJECTED', updated_at = ? WHERE id = ?", [new Date(), id]);
  return getEventById(id);
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  approveEvent,
  rejectEvent,
};
