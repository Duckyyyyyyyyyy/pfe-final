const express = require("express");
const cors = require("cors");
const config = require("./config");
const authRoutes = require("./routes/auth");
const clubRoutes = require("./routes/clubs");
const membershipRoutes = require("./routes/memberships");
const eventRoutes = require("./routes/events");
const adminRoutes = require("./routes/admin");
const announcementRoutes = require("./routes/announcements");
const studentRoutes = require("./routes/student");
const db = require("./db");
const { ensureMembershipRoleColumn } = require("./services/schemaService");

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    res.json({
      message: "Backend and MySQL connected successfully",
      db_result: rows[0].result,
    });
  } catch (error) {
    res.status(500).json({ message: "Database connection failed", error: error.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api", membershipRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", announcementRoutes);
app.use("/api/student", studentRoutes);

const startServer = async () => {
  try {
    await ensureMembershipRoleColumn();
    console.log("Membership role column is ready");
  } catch (error) {
    console.error("Unable to verify memberships.role column:", error.message);
  }

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
};

startServer();
