const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const config = require("../config");

const findUserByEmailOrStudentId = async (email, student_id) => {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE email = ? OR student_id = ?",
    [email, student_id]
  );
  return rows;
};

const createUser = async ({ full_name, email, student_id, niveau, filiere, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    "INSERT INTO users (full_name, email, student_id, niveau, filiere, password) VALUES (?, ?, ?, ?, ?, ?)",
    [full_name, email, student_id, niveau, filiere, hashedPassword]
  );
  return {
    id: result.insertId,
    full_name,
    email,
    student_id,
    niveau,
    filiere,
    role: "STUDENT",
  };
};

const authenticate = async (email, password) => {
  if (email === config.admin.email && password === config.admin.password) {
    return { id: 0, email, role: "ADMIN" };
  }

  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    student_id: user.student_id,
    niveau: user.niveau,
    filiere: user.filiere,
    role: user.role,
  };
};

const getUserById = async (id) => {
  if (Number(id) === 0) {
    return {
      id: 0,
      email: config.admin.email,
      role: "ADMIN",
    };
  }

  const [rows] = await db.query(
    "SELECT id, email, full_name, student_id, niveau, filiere, role FROM users WHERE id = ?",
    [id]
  );

  return rows[0] || null;
};

const generateToken = (user) => {
  return jwt.sign(user, config.jwtSecret, { expiresIn: "12h" });
};

module.exports = {
  findUserByEmailOrStudentId,
  createUser,
  authenticate,
  getUserById,
  generateToken,
};
