const eventService = require("../services/eventService");
const clubService = require("../services/clubService");
const eventParticipationService = require("../services/eventParticipationService");
const membershipService = require("../services/membershipService");

const createEvent = async (req, res) => {
  try {
    const { club_id, title, description, event_date, location, max_participants, salle, materiel, budget } = req.body;
    const user = req.user;

    if (!club_id || !title) {
      return res.status(400).json({ message: "club_id and title are required" });
    }

    const club = await clubService.getClubById(Number(club_id));
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (club.status !== "APPROVED") {
      return res.status(400).json({ message: "Events can only be created for approved clubs" });
    }

    if (club.status === "SUSPENDED") {
      return res.status(403).json({ message: "Cannot create events for suspended clubs" });
    }

    if (user.role !== "ADMIN" && club.president_id !== user.id) {
      return res.status(403).json({ message: "Only club president or admin may create events for this club" });
    }

    const event = await eventService.createEvent({
      club_id,
      title,
      description,
      event_date,
      location,
      max_participants,
      salle,
      materiel,
      budget,
    });

    return res.status(201).json({ message: "Event created and pending approval", event });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getEvents = async (req, res) => {
  try {
    const events = await eventService.getEvents();
    return res.json({ events });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await eventParticipationService.getRegistrationsByUserId(req.user.id);
    return res.json({ registrations });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const approveEvent = async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const event = await eventService.getEventById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status === "APPROVED") {
      return res.status(400).json({ message: "Event is already approved" });
    }

    const approvedEvent = await eventService.approveEvent(eventId);
    return res.json({ message: "Event approved successfully", event: approvedEvent });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const rejectEvent = async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const event = await eventService.getEventById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status === "REJECTED") {
      return res.status(400).json({ message: "Event is already rejected" });
    }

    if (event.status === "APPROVED") {
      return res.status(400).json({ message: "Approved event cannot be rejected" });
    }

    const rejectedEvent = await eventService.rejectEvent(eventId);
    return res.json({ message: "Event rejected successfully", event: rejectedEvent });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const registerForEvent = async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const userId = req.user.id;

    const event = await eventService.getEventById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "APPROVED") {
      return res.status(400).json({ message: "You can only register for approved events" });
    }

    const isAcceptedMember = await membershipService.hasAcceptedMembership(userId, event.club_id);
    if (!isAcceptedMember) {
      return res.status(403).json({ message: "Vous devez être membre du club pour vous inscrire à cet événement" });
    }

    const registration = await eventParticipationService.registerToEvent(userId, eventId);
    return res.status(201).json({ message: "Registered for event", registration });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "You are already registered for this event" });
    }
    return res.status(500).json({ message: error.message });
  }
};

const cancelEventRegistration = async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const userId = req.user.id;

    const registration = await eventParticipationService.cancelRegistration(userId, eventId);
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    return res.json({ message: "Event registration cancelled", registration });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getMyRegistrations,
  approveEvent,
  rejectEvent,
  registerForEvent,
  cancelEventRegistration,
};
