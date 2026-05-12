const membershipService = require("../services/membershipService");
const clubService = require("../services/clubService");

const normalizeStatus = (value) => String(value || "PENDING").toUpperCase();
const normalizeMembershipRole = (value) => String(value || "").trim().toUpperCase();

const canManageClubMembership = (user, club) => {
  return user.role === "ADMIN" || club.president_id === user.id;
};

const requestMembership = async (req, res) => {
  try {
    const userId = req.user.id;
    const clubId = Number(req.params.id);

    const club = await clubService.getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (normalizeStatus(club.status) !== "APPROVED") {
      return res.status(400).json({ message: "You can only join approved clubs" });
    }

    const membership = await membershipService.requestMembership(userId, clubId);
    return res.status(201).json({ message: "Membership request created", membership });
  } catch (error) {
    console.error("[membershipController] requestMembership failed", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "You have already requested to join this club" });
    }
    if (error.code === "MEMBERSHIP_REQUEST_EXISTS") {
      return res.status(409).json({ message: "You have already requested to join this club" });
    }
    if (error.code === "MEMBERSHIP_ALREADY_ACCEPTED") {
      return res.status(409).json({ message: "You are already an accepted member of this club" });
    }
    return res.status(500).json({ message: error.message });
  }
};

const getMyMemberships = async (req, res) => {
  try {
    const memberships = await membershipService.getMembershipsByUserId(req.user.id);
    return res.json({ memberships });
  } catch (error) {
    console.error("[membershipController] getMyMemberships failed", error);
    return res.status(500).json({ message: error.message });
  }
};

const getMyMembershipForClub = async (req, res) => {
  try {
    const clubId = Number(req.params.id);
    const membership = await membershipService.getMembershipForUserAndClub(req.user.id, clubId);
    return res.json({ membership });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getClubMembers = async (req, res) => {
  try {
    const clubId = Number(req.params.id);
    const club = await clubService.getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!canManageClubMembership(req.user, club)) {
      return res.status(403).json({ message: "Only club president or admin can view members" });
    }

    const memberships = await membershipService.getClubMembers(clubId);
    return res.json({ memberships });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getClubRequests = async (req, res) => {
  try {
    const clubId = Number(req.params.id);
    const club = await clubService.getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!canManageClubMembership(req.user, club)) {
      return res.status(403).json({ message: "Only club president or admin can view membership requests" });
    }

    const memberships = await membershipService.getClubMembershipRequests(clubId);
    return res.json({ memberships });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const acceptMembership = async (req, res) => {
  try {
    const membershipId = Number(req.params.id);
    const user = req.user;

    const membership = await membershipService.getMembershipById(membershipId);
    if (!membership) {
      return res.status(404).json({ message: "Membership request not found" });
    }

    const club = await clubService.getClubById(membership.club_id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!canManageClubMembership(user, club)) {
      return res.status(403).json({ message: "Only club president or admin can accept membership" });
    }

    if (normalizeStatus(membership.status) !== "PENDING") {
      return res.status(400).json({ message: "Only pending requests can be accepted" });
    }

    const acceptedMembership = await membershipService.acceptMembership(membershipId);
    return res.json({ message: "Membership accepted", membership: acceptedMembership });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const rejectMembership = async (req, res) => {
  try {
    const membershipId = Number(req.params.id);
    const membership = await membershipService.getMembershipById(membershipId);
    if (!membership) {
      return res.status(404).json({ message: "Membership request not found" });
    }

    const club = await clubService.getClubById(membership.club_id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!canManageClubMembership(req.user, club)) {
      return res.status(403).json({ message: "Only club president or admin can reject membership" });
    }

    if (normalizeStatus(membership.status) !== "PENDING") {
      return res.status(400).json({ message: "Only pending requests can be rejected" });
    }

    const rejectedMembership = await membershipService.rejectMembership(membershipId);
    return res.json({ message: "Membership rejected", membership: rejectedMembership });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const removeMembership = async (req, res) => {
  try {
    const membershipId = Number(req.params.id);
    const membership = await membershipService.getMembershipById(membershipId);
    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }

    const club = await clubService.getClubById(membership.club_id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!canManageClubMembership(req.user, club)) {
      return res.status(403).json({ message: "Only club president or admin can remove members" });
    }

    if (normalizeStatus(membership.status) !== "ACCEPTED") {
      return res.status(400).json({ message: "Only accepted members can be removed" });
    }

    const removedMembership = await membershipService.removeMembership(membershipId);
    return res.json({ message: "Member removed", membership: removedMembership });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const adminRemoveClubMember = async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const userId = Number(req.params.userId);

    if (!Number.isInteger(clubId) || clubId <= 0 || !Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid club or user id" });
    }

    const club = await clubService.getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const rejectedMembership = await membershipService.rejectMembershipForUserInClub(clubId, userId);
    if (!rejectedMembership) {
      return res.status(400).json({ message: "Only accepted members can be removed" });
    }

    return res.json({ message: "Member removed from club", membership: rejectedMembership });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updatePresidentMemberRole = async (req, res) => {
  try {
    const clubId = Number(req.params.clubId);
    const userId = Number(req.params.userId);
    const role = normalizeMembershipRole(req.body?.role);

    if (!Number.isInteger(clubId) || clubId <= 0 || !Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid club or user id" });
    }

    if (!membershipService.MEMBERSHIP_ROLES.includes(role)) {
      return res.status(400).json({ message: "Role must be MEMBER, VICE_PRESIDENT, or TREASURER" });
    }

    const club = await clubService.getClubById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (Number(club.president_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Only this club president can update member roles" });
    }

    const membership = await membershipService.updateMembershipRole(clubId, userId, role);
    if (!membership) {
      return res.status(404).json({ message: "Accepted membership not found" });
    }

    return res.json({ message: "Member role updated", membership });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  requestMembership,
  getMyMemberships,
  getMyMembershipForClub,
  getClubMembers,
  getClubRequests,
  acceptMembership,
  rejectMembership,
  removeMembership,
  adminRemoveClubMember,
  updatePresidentMemberRole,
};
