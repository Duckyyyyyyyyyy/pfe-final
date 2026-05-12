const authService = require("../services/authService");

const register = async (req, res) => {
  try {
    const { full_name, email, student_id, niveau, filiere, password } = req.body;

    if (!full_name || !email || !student_id || !niveau || !filiere || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await authService.findUserByEmailOrStudentId(email, student_id);
    if (existing.length > 0) {
      return res.status(409).json({ message: "User with that email or student ID already exists" });
    }

    const user = await authService.createUser({
      full_name,
      email,
      student_id,
      niveau,
      filiere,
      password,
    });

    return res.status(201).json({ message: "Registration successful", user: user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const authResult = await authService.authenticate(email, password);
    if (!authResult) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = authService.generateToken(authResult);
    return res.json({ message: "Login successful", token, user: authResult });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const me = async (req, res) => {
  try {
    return res.json({ user: req.user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  me,
};
