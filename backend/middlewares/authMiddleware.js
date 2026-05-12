const jwt = require("jsonwebtoken");
const config = require("../config");
const authService = require("../services/authService");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or invalid" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, config.jwtSecret);

    const currentUser = await authService.getUserById(payload.id);
    if (!currentUser) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
