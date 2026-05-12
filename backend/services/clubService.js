const db = require("../db");

const clubPublicColumns = `
  id,
  name,
  description,
  theme,
  faculte,
  activite,
  status,
  suspension_reason,
  created_by,
  president_id,
  created_at,
  updated_at
`;

const mapClubRow = (club) => {
  if (!club) {
    return null;
  }

  const { logo, request_pdf, ...publicClub } = club;

  return publicClub;
};

const decodeLogoForStorage = (logo) => {
  if (logo === undefined) {
    return undefined;
  }

  if (logo === null || logo === "") {
    return null;
  }

  if (Buffer.isBuffer(logo)) {
    return logo;
  }

  if (typeof logo === "string") {
    return Buffer.from(logo, "utf8");
  }

  return null;
};

const decodePdfForStorage = (pdf) => {
  if (!pdf) {
    return null;
  }

  if (Buffer.isBuffer(pdf)) {
    return pdf;
  }

  if (typeof pdf !== "string") {
    return null;
  }

  const dataUrlMatch = pdf.match(/^data:application\/pdf(?:;[^,]*)?;base64,(.+)$/i);
  if (dataUrlMatch) {
    return Buffer.from(dataUrlMatch[1], "base64");
  }

  return Buffer.from(pdf, "base64");
};

const normalizePdfBuffer = (pdf) => {
  if (!pdf) {
    return null;
  }

  let buffer = pdf;
  if (!Buffer.isBuffer(buffer) && buffer.type === "Buffer" && Array.isArray(buffer.data)) {
    buffer = Buffer.from(buffer.data);
  }

  if (typeof buffer === "string") {
    return decodePdfForStorage(buffer);
  }

  return Buffer.isBuffer(buffer) ? buffer : null;
};

const normalizeLogoBuffer = (logo) => {
  if (!logo) {
    return null;
  }

  let buffer = logo;
  if (!Buffer.isBuffer(buffer) && buffer.type === "Buffer" && Array.isArray(buffer.data)) {
    buffer = Buffer.from(buffer.data);
  }

  if (Buffer.isBuffer(buffer)) {
    const textValue = buffer.toString("utf8");
    const dataUrlMatch = textValue.match(/^data:image\/[a-z0-9.+-]+(?:;[^,]*)?;base64,(.+)$/i);
    if (dataUrlMatch) {
      return Buffer.from(dataUrlMatch[1], "base64");
    }
  }

  if (typeof buffer === "string") {
    const dataUrlMatch = buffer.match(/^data:image\/[a-z0-9.+-]+(?:;[^,]*)?;base64,(.+)$/i);
    return dataUrlMatch ? Buffer.from(dataUrlMatch[1], "base64") : Buffer.from(buffer, "utf8");
  }

  return Buffer.isBuffer(buffer) ? buffer : null;
};

const detectImageMimeType = (buffer) => {
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (buffer.length >= 6 && (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a")) {
    return "image/gif";
  }

  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }

  if (buffer.length >= 2 && buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return "image/bmp";
  }

  return "application/octet-stream";
};

const getClubLogo = async (id) => {
  const [rows] = await db.query("SELECT logo FROM clubs WHERE id = ?", [id]);
  const club = rows[0] || null;
  if (!club) {
    return null;
  }

  const buffer = normalizeLogoBuffer(club.logo);
  if (!buffer || buffer.length === 0) {
    return null;
  }

  const detectedMimeType = detectImageMimeType(buffer);
  const mimeType = detectedMimeType === "image/jpeg" || detectedMimeType === "image/png"
    ? detectedMimeType
    : "image/png";

  return { buffer, mimeType };
};

const createClub = async ({ name, description, logo, theme, faculte, activite, request_pdf, request_pdf_name, created_by }) => {
  const [acceptedMemberships] = await db.query(
    `SELECT id
     FROM memberships
     WHERE user_id = ?
       AND status = 'ACCEPTED'
     LIMIT 1`,
    [created_by]
  );

  if (acceptedMemberships.length > 0) {
    const error = new Error("Student already has an accepted membership");
    error.code = "STUDENT_ALREADY_ACCEPTED_MEMBER";
    throw error;
  }

  const [result] = await db.query(
    "INSERT INTO clubs (name, description, logo, theme, faculte, activite, request_pdf, request_pdf_name, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')",
    [name, description, decodeLogoForStorage(logo), theme, faculte, activite, decodePdfForStorage(request_pdf), request_pdf_name, created_by]
  );
  return await getClubById(result.insertId);
};

const getClubs = async () => {
  const [rows] = await db.query(
    `SELECT
       c.id,
       c.name,
       c.description,
       c.theme,
       c.faculte,
       c.activite,
       c.status,
       c.suspension_reason,
       c.created_by,
       c.president_id,
       c.created_at,
       c.updated_at,
       u.full_name AS creator_name,
       p.full_name AS president_name
     FROM clubs c
     LEFT JOIN users u ON c.created_by = u.id
     LEFT JOIN users p ON c.president_id = p.id
     ORDER BY c.created_at DESC`
  );
  return rows.map(mapClubRow);
};

const getClubById = async (id) => {
  const [rows] = await db.query(`SELECT ${clubPublicColumns} FROM clubs WHERE id = ?`, [id]);
  return mapClubRow(rows[0] || null);
};

const getClubByPresidentId = async (presidentId) => {
  const [rows] = await db.query(
    `SELECT
       c.id,
       c.name,
       c.description,
       c.theme,
       c.faculte,
       c.activite,
       c.status,
       c.suspension_reason,
       c.created_by,
       c.president_id,
       c.created_at,
       c.updated_at,
       u.full_name AS creator_name,
       p.full_name AS president_name
     FROM clubs c
     LEFT JOIN users u ON c.created_by = u.id
     LEFT JOIN users p ON c.president_id = p.id
     WHERE c.president_id = ?
     ORDER BY c.updated_at DESC, c.created_at DESC
     LIMIT 1`,
    [presidentId]
  );
  return mapClubRow(rows[0] || null);
};

const getClubDetails = async (id) => {
  const [clubRows] = await db.query(
    `SELECT
       c.id,
       c.name,
       c.description,
       c.theme,
       c.faculte,
       c.activite,
       c.status,
       c.request_pdf_name,
       u.full_name AS creator_name,
       p.full_name AS president_name
     FROM clubs c
     LEFT JOIN users u ON c.created_by = u.id
     LEFT JOIN users p ON c.president_id = p.id
     WHERE c.id = ?`,
    [id]
  );

  const club = mapClubRow(clubRows[0] || null);
  if (!club) {
    return null;
  }

  const [members] = await db.query(
    `SELECT
       m.id AS membership_id,
       u.id AS user_id,
       u.full_name,
       u.email,
       u.student_id,
       u.niveau,
       u.filiere,
       COALESCE(m.role, 'MEMBER') AS role
     FROM memberships m
     INNER JOIN users u ON m.user_id = u.id
     WHERE m.club_id = ? AND COALESCE(UPPER(m.status), 'PENDING') = 'ACCEPTED'
     ORDER BY u.full_name ASC`,
    [id]
  );

  const [events] = await db.query(
    `SELECT title, event_date, location
     FROM events
     WHERE club_id = ? AND COALESCE(UPPER(status), 'PENDING') = 'APPROVED'
     ORDER BY event_date ASC`,
    [id]
  );

  return { club, members, events };
};

const getClubRequestPdf = async (id) => {
  const [rows] = await db.query(
    "SELECT request_pdf, request_pdf_name FROM clubs WHERE id = ?",
    [id]
  );

  const club = rows[0] || null;
  if (!club) {
    return null;
  }

  return {
    buffer: normalizePdfBuffer(club.request_pdf),
    fileName: club.request_pdf_name || `club-${id}-request.pdf`,
  };
};

const updateClub = async (id, { name, description, logo, theme, faculte, activite }) => {
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push("name = ?");
    values.push(name);
  }
  if (description !== undefined) {
    updates.push("description = ?");
    values.push(description);
  }
  if (logo !== undefined) {
    updates.push("logo = ?");
    values.push(decodeLogoForStorage(logo));
  }
  if (theme !== undefined) {
    updates.push("theme = ?");
    values.push(theme);
  }
  if (faculte !== undefined) {
    updates.push("faculte = ?");
    values.push(faculte);
  }
  if (activite !== undefined) {
    updates.push("activite = ?");
    values.push(activite);
  }

  if (updates.length === 0) {
    return getClubById(id);
  }

  values.push(new Date());
  values.push(id);

  await db.query(
    `UPDATE clubs SET ${updates.join(", ")}, updated_at = ? WHERE id = ?`,
    values
  );
  return getClubById(id);
};

const approveClub = async (id) => {
  const club = await getClubById(id);
  if (!club) {
    return null;
  }

  await db.query(
    "UPDATE clubs SET status = 'APPROVED', president_id = created_by, updated_at = ? WHERE id = ?",
    [new Date(), id]
  );
  await db.query("UPDATE users SET role = 'PRESIDENT' WHERE id = ?", [club.created_by]);
  return getClubById(id);
};

const suspendClub = async (id, reason) => {
  await db.query(
    "UPDATE clubs SET status = 'SUSPENDED', suspension_reason = ?, updated_at = ? WHERE id = ?",
    [reason, new Date(), id]
  );
  return getClubById(id);
};

module.exports = {
  createClub,
  getClubs,
  getClubById,
  getClubByPresidentId,
  getClubDetails,
  getClubLogo,
  getClubRequestPdf,
  detectImageMimeType,
  updateClub,
  approveClub,
  suspendClub,
};
