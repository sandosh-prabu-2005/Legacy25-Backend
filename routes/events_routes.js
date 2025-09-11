const express = require("express");
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
} = require("../controllers/eventsController");
const router = express.Router();
const { isAuthenticatedUser } = require("../middlewares/authenticate");

// Event routes
router.route("/events").post(isAuthenticatedUser, createEvent);
router.route("/events").get(getAllEvents);
router.route("/events/:id").get(getEventById); // public route, no auth middleware
router.route("/events/:id").put(isAuthenticatedUser, updateEvent);
router.route("/events/:id").delete(isAuthenticatedUser, deleteEvent);
router.route("/events/register").post(isAuthenticatedUser, registerForEvent);

module.exports = router;
