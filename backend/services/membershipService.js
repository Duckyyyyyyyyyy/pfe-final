const db = require("../db");

const MEMBERSHIP_ROLES = ["MEMBER", "VICE_PRESIDENT", "TREASURER"];

const membershipSelect = `
  SELECT
    m.*,
    u.full_name AS user_name,
    u.email AS user_email,
    u.student_id,
    u.niveau,
    u.filiere,
    c.name AS club_name,
    c.status AS club_status
  FROM memberships m
  INNER JOIN users u ON m.user_id = u.id
  INNER JOIN clubs c ON m.club_id = c.id
`;

const requestMembership = async (user_id, club_id) => {
  const existing = await getMembershipForUserAndClub(user_id, club_id);
  const existingStatus = String(existing?.status || "").toUpperCase();

  if (existingStatus === "REJECTED" || existingStatus === "REMOVED") {
    await db.query(
      "UPDATE memberships SET status = 'PENDING', role = 'MEMBER' WHERE id = ?",
      [existing.id]
    );
    return getMembershipById(existing.id);
  }

  if (existingStatus === "PENDING") {
    const error = new Error("You have already requested to join this club");
    error.code = "MEMBERSHIP_REQUEST_EXISTS";
    throw error;
  }

  if (existingStatus === "ACCEPTED") {
    const error = new Error("You are already an accepted member of this club");
    error.code = "MEMBERSHIP_ALREADY_ACCEPTED";
    throw error;
  }

  const [result] = await db.query(
    "INSERT INTO memberships (user_id, club_id, role) VALUES (?, ?, 'MEMBER')",
    [user_id, club_id]
  );
  return getMembershipById(result.insertId);
};

const getMembershipById = async (id) => {
  const [rows] = await db.query(`${membershipSelect} WHERE m.id = ?`, [id]);
  return rows[0] || null;
};

const getMembershipsByUserId = async (userId) => {
  const [rows] = await db.query(
    `${membershipSelect} WHERE m.user_id = ? ORDER BY m.id DESC`,
    [userId]
  );
  return rows;
};

const getMembershipForUserAndClub = async (userId, clubId) => {
  const [rows] = await db.query(
    `${membershipSelect} WHERE m.user_id = ? AND m.club_id = ? ORDER BY m.id DESC LIMIT 1`,
    [userId, clubId]
  );
  return rows[0] || null;
};

const hasAcceptedMembership = async (userId, clubId) => {
  const [rows] = await db.query(
    `SELECT id
     FROM memberships
     WHERE user_id = ?
       AND club_id = ?
       AND COALESCE(UPPER(status), 'PENDING') = 'ACCEPTED'
     LIMIT 1`,
    [userId, clubId]
  );
  return rows.length > 0;
};

const hasAnyAcceptedMembership = async (userId) => {
  const [rows] = await db.query(
    `SELECT id
     FROM memberships
     WHERE user_id = ?
       AND status = 'ACCEPTED'
     LIMIT 1`,
    [userId]
  );
  return rows.length > 0;
};

const getClubMembershipRequests = async (clubId) => {
  const [rows] = await db.query(
    `${membershipSelect}
     WHERE m.club_id = ? AND COALESCE(UPPER(m.status), 'PENDING') = 'PENDING'
     ORDER BY m.id DESC`,
    [clubId]
  );
  return rows;
};

const getClubMembers = async (clubId) => {
  const [rows] = await db.query(
    `${membershipSelect}
     WHERE m.club_id = ? AND COALESCE(UPPER(m.status), 'PENDING') = 'ACCEPTED'
     ORDER BY u.full_name ASC`,
    [clubId]
  );
  return rows;
};

const acceptMembership = async (id) => {
  await db.query("UPDATE memberships SET status = 'ACCEPTED', role = 'MEMBER' WHERE id = ?", [id]);
  return getMembershipById(id);
};

const rejectMembership = async (id) => {
  await db.query("UPDATE memberships SET status = 'REJECTED' WHERE id = ?", [id]);
  return getMembershipById(id);
};

const rejectMembershipForUserInClub = async (clubId, userId) => {
  const [result] = await db.query(
    "UPDATE memberships SET status = 'REJECTED' WHERE club_id = ? AND user_id = ? AND status = 'ACCEPTED'",
    [clubId, userId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getMembershipForUserAndClub(userId, clubId);
};

const removeMembership = async (id) => {
  await db.query("UPDATE memberships SET status = 'REMOVED' WHERE id = ?", [id]);
  return getMembershipById(id);
};

const getAcceptedMembershipForUserInClub = async (clubId, userId) => {
  const [rows] = await db.query(
    `${membershipSelect}
     WHERE m.club_id = ?
       AND m.user_id = ?
       AND COALESCE(UPPER(m.status), 'PENDING') = 'ACCEPTED'
     ORDER BY m.id DESC
     LIMIT 1`,
    [clubId, userId]
  );
  return rows[0] || null;
};

const updateMembershipRole = async (clubId, userId, role) => {
  const membership = await getAcceptedMembershipForUserInClub(clubId, userId);
  if (!membership) {
    return null;
  }

  await db.query("UPDATE memberships SET role = ? WHERE id = ?", [role, membership.id]);
  return getMembershipById(membership.id);
};

module.exports = {
  MEMBERSHIP_ROLES,
  requestMembership,
  getMembershipById,
  getMembershipsByUserId,
  getMembershipForUserAndClub,
  hasAcceptedMembership,
  hasAnyAcceptedMembership,
  getClubMembershipRequests,
  getClubMembers,
  acceptMembership,
  rejectMembership,
  rejectMembershipForUserInClub,
  removeMembership,
  getAcceptedMembershipForUserInClub,
  updateMembershipRole,
};
