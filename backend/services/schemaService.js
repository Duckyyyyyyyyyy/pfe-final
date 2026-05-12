const db = require("../db");
const { MEMBERSHIP_ROLES } = require("./membershipService");

const membershipRoleEnum = `ENUM('${MEMBERSHIP_ROLES.join("','")}')`;

const ensureMembershipRoleColumn = async () => {
  const [columns] = await db.query("SHOW COLUMNS FROM memberships LIKE 'role'");

  if (columns.length === 0) {
    await db.query(
      `ALTER TABLE memberships ADD COLUMN role ${membershipRoleEnum} NOT NULL DEFAULT 'MEMBER'`
    );
    return;
  }

  await db.query(
    `UPDATE memberships
     SET role = CASE UPPER(role)
       WHEN 'VICE_PRESIDENT' THEN 'VICE_PRESIDENT'
       WHEN 'TREASURER' THEN 'TREASURER'
       ELSE 'MEMBER'
     END`
  );

  await db.query(
    `ALTER TABLE memberships MODIFY COLUMN role ${membershipRoleEnum} NOT NULL DEFAULT 'MEMBER'`
  );
};

module.exports = {
  ensureMembershipRoleColumn,
};
