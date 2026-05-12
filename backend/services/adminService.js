const db = require("../db");

const userFields = "id, full_name, email, student_id, niveau, filiere, role, created_at";

const getUsers = async () => {
  const [rows] = await db.query(
    `SELECT ${userFields}
     FROM users
     WHERE role IN ('STUDENT', 'PRESIDENT')
     ORDER BY created_at DESC, id DESC`
  );
  return rows;
};

const getUserDetails = async (id) => {
  const [userRows] = await db.query(
    `SELECT ${userFields}
     FROM users
     WHERE id = ? AND role IN ('STUDENT', 'PRESIDENT')`,
    [id]
  );

  const user = userRows[0] || null;
  if (!user) {
    return null;
  }

  const [presidentClubs] = await db.query(
    `SELECT
       id,
       name,
       status,
       theme,
       faculte,
       activite,
       created_at
     FROM clubs
     WHERE president_id = ?
     ORDER BY name ASC`,
    [id]
  );

  const [memberships] = await db.query(
    `SELECT
       m.id,
       m.club_id,
       COALESCE(m.role, 'MEMBER') AS role,
       m.status,
       m.created_at,
       c.name AS club_name,
       c.status AS club_status
     FROM memberships m
     INNER JOIN clubs c ON m.club_id = c.id
     WHERE m.user_id = ?
       AND COALESCE(UPPER(m.status), 'PENDING') = 'ACCEPTED'
     ORDER BY c.name ASC`,
    [id]
  );

  return { user, president_clubs: presidentClubs, memberships };
};

const resourceSelect = `
  SELECT
    a.id AS resource_id,
    a.id AS authorization_id,
    a.event_id,
    e.title AS event_title,
    c.name AS club_name,
    a.materiel,
    a.budget,
    a.status,
    a.admin_comment
  FROM authorizations a
  INNER JOIN events e ON a.event_id = e.id
  LEFT JOIN clubs c ON e.club_id = c.id
`;

const queryResources = async (whereClause = "", params = []) => {
  const [rows] = await db.query(
    `${resourceSelect}
     ${whereClause}
     ORDER BY a.id DESC
    `,
    params
  );
  return rows;
};

const getResources = async () => {
  return queryResources();
};

const getResourceById = async (id) => {
  const rows = await queryResources("WHERE a.id = ?", [id]);
  return rows[0] || null;
};

const updateResource = async (id, { status, admin_comment }) => {
  const [result] = await db.query(
    "UPDATE authorizations SET status = ?, admin_comment = ? WHERE id = ?",
    [status, admin_comment ?? null, id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getResourceById(id);
};

module.exports = {
  getUsers,
  getUserDetails,
  getResources,
  getResourceById,
  updateResource,
  getAuthorizations: getResources,
  getAuthorizationById: getResourceById,
  updateAuthorizationStatus: (id, status) => updateResource(id, { status, admin_comment: null }),
  getStudents: getUsers,
  getStudentDetails: getUserDetails,
};
