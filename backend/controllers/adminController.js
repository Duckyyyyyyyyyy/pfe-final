const adminService = require("../services/adminService");

const getUsers = async (req, res) => {
  try {
    const users = await adminService.getUsers();
    return res.json({ users, students: users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const details = await adminService.getUserDetails(userId);
    if (!details) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(details);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getResources = async (req, res) => {
  try {
    const resources = await adminService.getResources();
    return res.json({ resources });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateResource = async (req, res) => {
  try {
    const resourceId = Number(req.params.id);
    const status = String(req.body.status || "").trim().toUpperCase();
    const adminComment = req.body.admin_comment === undefined
      ? null
      : String(req.body.admin_comment || "").trim() || null;

    if (!Number.isInteger(resourceId) || resourceId <= 0) {
      return res.status(400).json({ message: "Invalid resource id" });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Resource status must be APPROVED or REJECTED" });
    }

    const resource = await adminService.updateResource(resourceId, {
      status,
      admin_comment: adminComment,
    });

    if (!resource) {
      return res.status(404).json({ message: "Resource request not found" });
    }

    return res.json({
      message: `Resource ${status.toLowerCase()}`,
      resource,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAuthorizations = async (req, res) => {
  try {
    const resources = await adminService.getResources();
    return res.json({ authorizations: resources });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateAuthorizationStatus = async (req, res, status) => {
  req.body.status = status;
  return updateResource(req, res);
};

const approveAuthorization = async (req, res) => {
  return updateAuthorizationStatus(req, res, "APPROVED");
};

const rejectAuthorization = async (req, res) => {
  return updateAuthorizationStatus(req, res, "REJECTED");
};

module.exports = {
  getUsers,
  getUserDetails,
  getResources,
  updateResource,
  getAuthorizations,
  approveAuthorization,
  rejectAuthorization,
  getStudents: getUsers,
  getStudentDetails: getUserDetails,
};
