const Event = require("../models/events");
const Teams = require("../models/teams");
const User = require("../models/users");
const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

// Helper function to check if user is already registered for an event
const isUserRegisteredForEvent = async (userId, eventId) => {
  // Check if user is in any registered team for this event
  const registeredTeam = await Teams.findOne({
    eventId,
    isRegistered: true,
    $or: [{ leader: userId }, { "members.userId": userId }],
  });

  if (registeredTeam) {
    return true;
  }

  // Check if user is registered for solo event
  const event = await Event.findById(eventId);
  if (event) {
    const soloRegistration = event.applications.find(
      (app) => app.userId.toString() === userId.toString() && !app.teamId
    );

    if (soloRegistration) {
      return true;
    }
  }

  return false;
};

// Handle solo event registration
exports.registerSoloEvent = catchAsyncError(async (req, res, next) => {
  const { eventId } = req.body;
  const userId = req.user._id;

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Check if event is solo type
  if (event.event_type !== "solo") {
    return next(new ErrorHandler("This is not a solo event", 400));
  }

  // Check if user is already registered for this event (team or solo)
  const isAlreadyRegistered = await isUserRegisteredForEvent(userId, eventId);
  if (isAlreadyRegistered) {
    return next(
      new ErrorHandler("You are already registered for this event", 400)
    );
  }

  // Check event capacity for solo events
  if (event.maxApplications) {
    const soloApplications = event.applications.filter(app => !app.teamId);
    if (soloApplications.length >= event.maxApplications) {
      return next(new ErrorHandler("Event is full", 400));
    }
  }

  // Check registration deadline
  if (
    event.applicationDeadline &&
    new Date() > new Date(event.applicationDeadline)
  ) {
    return next(new ErrorHandler("Registration deadline has passed", 400));
  }

  // Add application to event
  event.applications.push({
    userId,
    appliedAt: new Date(),
  });

  await event.save();

  res.status(200).json({
    success: true,
    message: "Successfully registered for the event",
    event,
  });
});

// Handle group event registration - now requires team creation first
exports.registerGroupEvent = catchAsyncError(async (req, res, next) => {
  const { eventId, teamName } = req.body;
  const userId = req.user._id;

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Check if event is group type
  if (event.event_type !== "group") {
    return next(new ErrorHandler("This is not a group event", 400));
  }

  // Check if user is already registered for this event (team or solo)
  const isAlreadyRegistered = await isUserRegisteredForEvent(userId, eventId);
  if (isAlreadyRegistered) {
    return next(
      new ErrorHandler(
        "You are already registered for this event and cannot create a new team",
        400
      )
    );
  }

  // Check if user already has a team for this event (including unregistered teams)
  const existingTeam = await Teams.findOne({
    eventId,
    $or: [{ leader: userId }, { "members.userId": userId }],
  });

  if (existingTeam) {
    return next(
      new ErrorHandler("You are already part of a team for this event", 400)
    );
  }

  // Check event capacity for group events (count registered teams, not applications)
  if (event.maxApplications) {
    const registeredTeamsCount = await Teams.countDocuments({
      eventId,
      isRegistered: true,
    });
    if (registeredTeamsCount >= event.maxApplications) {
      return next(new ErrorHandler("Event is full", 400));
    }
  }

  // Check registration deadline
  if (
    event.applicationDeadline &&
    new Date() > new Date(event.applicationDeadline)
  ) {
    return next(new ErrorHandler("Registration deadline has passed", 400));
  }

  // Create a new team
  const team = await Teams.create({
    eventId,
    teamName,
    leader: userId,
    members: [{ userId }],
    maxMembers: event.maxTeamSize || 6,
  });

  res.status(201).json({
    success: true,
    message: "Team created successfully. You can now invite other members.",
    team,
    note: "To register the team for the event, complete your team and use the registerTeam endpoint",
  });
});
