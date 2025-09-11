const catchAsyncError = require("../middlewares/catchAsyncError");
const Event = require("../models/events");
const Teams = require("../models/teams");
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

// Create new event
const createEvent = catchAsyncError(async (req, res, next) => {
  const {
    event_id,
    name,
    event_type,
    clubInCharge,
    coordinatorName,
    coordinatorDept,
    description,
    organizing_club,
    minTeamSize,
    maxTeamSize,
    venue,
    event_date,
    registration_deadline,
    maxApplications,
    applicationDeadline,
    rules,
    staff_incharges,
    registrationAmount,
  } = req.body;

  // Set default values based on event type
  const finalMinTeamSize = minTeamSize || (event_type === "group" ? 2 : 1);
  const finalMaxTeamSize = maxTeamSize || (event_type === "group" ? 6 : 1);

  const event = await Event.create({
    event_id,
    name,
    event_type,
    clubInCharge: clubInCharge || organizing_club || "",
    coordinatorName: coordinatorName || "",
    coordinatorDept: coordinatorDept || "",
    description: description || "",
    organizing_club: organizing_club || clubInCharge || "",
    minTeamSize: finalMinTeamSize,
    maxTeamSize: finalMaxTeamSize,
    venue: venue || "",
    event_date,
    registration_deadline,
    maxApplications,
    applicationDeadline,
    rules: rules || [],
    staff_incharges: staff_incharges || [],
    createdBy: req.user.id,
    registrationAmount: isNaN(parseFloat(registrationAmount))
      ? 0
      : Math.max(parseFloat(registrationAmount), 0),
  });

  res.status(201).json({
    success: true,
    event,
    message: "Event created successfully",
  });
});

// Get all events with enhanced seat and team information, with pagination
const getAllEvents = catchAsyncError(async (req, res, next) => {
  try {
    // Pagination: parse page and limit from query params
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    // Aggregation pipeline to compute team/seat stats
    const pipeline = [
      {
        $lookup: {
          from: "teams",
          localField: "_id",
          foreignField: "eventId",
          as: "eventTeams",
        },
      },
      {
        $addFields: {
          registeredTeamsCount: {
            $size: {
              $filter: {
                input: "$eventTeams",
                cond: { $eq: ["$$this.isRegistered", true] },
              },
            },
          },
          totalTeamsCount: { $size: "$eventTeams" },
          actualSeatsTaken: {
            $cond: {
              if: { $eq: ["$event_type", "group"] },
              then: {
                $size: {
                  $filter: {
                    input: "$eventTeams",
                    cond: { $eq: ["$$this.isRegistered", true] },
                  },
                },
              },
              else: { $size: "$applications" },
            },
          },
          availableSeats: {
            $cond: {
              if: { $ifNull: ["$maxApplications", false] },
              then: {
                $subtract: [
                  "$maxApplications",
                  {
                    $cond: {
                      if: { $eq: ["$event_type", "group"] },
                      then: {
                        $size: {
                          $filter: {
                            input: "$eventTeams",
                            cond: { $eq: ["$$this.isRegistered", true] },
                          },
                        },
                      },
                      else: { $size: "$applications" },
                    },
                  },
                ],
              },
              else: null,
            },
          },
        },
      },
      {
        $project: {
          eventTeams: 0,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ];

    // Execute pipeline
    const events = await Event.aggregate(pipeline);
    const totalEvents = await Event.countDocuments();
    const totalPages = Math.ceil(totalEvents / limit);

    return res.status(200).json({
      success: true,
      events,
      totalEvents,
      totalPages,
      page,
      message: "Events fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching events:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err && err.message ? err.message : String(err),
    });
  }
});

// Get event by ID with registration information
const getEventById = catchAsyncError(async (req, res, next) => {
  console.log("[getEventById] Looking for event with ID:", req.params.id);

  try {
    const mongoose = require("mongoose");

    // Try to match by event_id first, then by ObjectId
    let matchCondition = { event_id: req.params.id };
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      matchCondition = {
        $or: [
          { event_id: req.params.id },
          { _id: new mongoose.Types.ObjectId(req.params.id) },
        ],
      };
    }

    // Get event with team information using aggregation
    const eventWithInfo = await Event.aggregate([
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: "teams",
          localField: "_id",
          foreignField: "eventId",
          as: "eventTeams",
        },
      },
      {
        $addFields: {
          registeredTeamsCount: {
            $size: {
              $filter: {
                input: "$eventTeams",
                cond: { $eq: ["$$this.isRegistered", true] },
              },
            },
          },
          totalTeamsCount: { $size: "$eventTeams" },
          // For group events, count registered teams (not individual members)
          // For solo events, count applications directly
          actualSeatsTaken: {
            $cond: {
              if: { $eq: ["$event_type", "group"] },
              then: {
                $size: {
                  $filter: {
                    input: "$eventTeams",
                    cond: { $eq: ["$$this.isRegistered", true] },
                  },
                },
              }, // Count registered teams for group events
              else: { $size: "$applications" }, // Count individual applications for solo events
            },
          },
          availableSeats: {
            $cond: {
              if: { $ifNull: ["$maxApplications", false] },
              then: {
                $subtract: [
                  "$maxApplications",
                  {
                    $cond: {
                      if: { $eq: ["$event_type", "group"] },
                      then: {
                        $size: {
                          $filter: {
                            input: "$eventTeams",
                            cond: { $eq: ["$$this.isRegistered", true] },
                          },
                        },
                      }, // Subtract registered teams for group events
                      else: { $size: "$applications" }, // Subtract individual applications for solo events
                    },
                  },
                ],
              },
              else: null,
            },
          },
        },
      },
      {
        $project: {
          eventTeams: 0, // Remove eventTeams from response to keep it clean
        },
      },
    ]);

    console.log(
      "[getEventById] Found event with info:",
      eventWithInfo.length > 0
    );

    if (!eventWithInfo || eventWithInfo.length === 0) {
      return next(new ErrorHandler("Event not found", 404));
    }

    const event = eventWithInfo[0];

    res.status(200).json({
      success: true,
      event,
      message: "Event fetched successfully",
    });
  } catch (err) {
    console.error("[getEventById] Error fetching event:", err);
    return next(new ErrorHandler("Error fetching event", 500));
  }
});

// Update event
const updateEvent = catchAsyncError(async (req, res, next) => {
  const {
    eventName,
    eventType,
    clubInCharge,
    coordinatorName,
    coordinatorDept,
  } = req.body;

  const event = await Event.findOne({ eventId: req.params.id });

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  event.eventName = eventName || event.eventName;
  event.eventType = eventType || event.eventType;
  event.clubInCharge = clubInCharge || event.clubInCharge;
  event.coordinatorName = coordinatorName || event.coordinatorName;
  event.coordinatorDept = coordinatorDept || event.coordinatorDept;

  await event.save();

  res.status(200).json({
    success: true,
    event,
    message: "Event updated successfully",
  });
});

// Delete event
const deleteEvent = catchAsyncError(async (req, res, next) => {
  const event = await Event.findOne({ eventId: req.params.id });

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  await event.deleteOne();

  res.status(200).json({
    success: true,
    message: "Event deleted successfully",
  });
});

// Register for event (solo events)
const registerForEvent = catchAsyncError(async (req, res, next) => {
  const { eventId } = req.body;
  const userId = req.user._id;

  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event not found" });
  }

  // Check if user is already registered for this event (team or solo)
  const isAlreadyRegistered = await isUserRegisteredForEvent(userId, eventId);
  if (isAlreadyRegistered) {
    return res.status(400).json({
      success: false,
      message: "You are already registered for this event",
    });
  }

  // Check if event is active
  if (!event.isActive) {
    return res
      .status(400)
      .json({ success: false, message: "Event is not active" });
  }

  // Check if event is full
  if (
    event.maxApplications &&
    event.applications.length >= event.maxApplications
  ) {
    return res.status(400).json({ success: false, message: "Event is full" });
  }

  // Check if registration deadline has passed
  if (
    event.applicationDeadline &&
    new Date() > new Date(event.applicationDeadline)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Registration deadline has passed" });
  }

  // Add user to applications
  event.applications.push({
    userId: userId,
    appliedAt: new Date(),
    status: "pending",
  });

  await event.save();

  res.status(200).json({
    success: true,
    message: "Successfully registered for the event",
    event,
  });
});

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
};
