const AdminInvite = require("../models/adminInvite");
const Events = require("../models/events");
const Users = require("../models/users");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

// Helper function to map club names to valid enum values
const mapClubName = (clubName) => {
  const validClubs = [
    "FINE ARTS",
    "LITERARY",
    "PHOTOGRAPHY",
    "BLUESKY",
    "INNOVATIVE",
    "NATURE",
    "HEALTH",
    "SUSTAINABLE",
    "RIFLE",
    "CONSUMER",
    "NCC",
    "READERS",
    "NSS",
    "HERITAGE",
  ];

  // If the club name is already valid, return as is
  if (validClubs.includes(clubName)) {
    return clubName;
  }

  // Map common variations to exact club names
  const clubMapping = {
    FINE_ARTS: "FINE ARTS",
    BLUE_SKY: "BLUESKY",
    "BLUE SKY": "BLUESKY",
    "BLUESKY FORUM": "BLUESKY",
    "READERS CLUB": "READERS",
    "READERS'": "READERS",
    "PHOTOGRAPHY CLUB": "PHOTOGRAPHY",
    "LITERARY CLUB": "LITERARY",
    "INNOVATIVE CLUB": "INNOVATIVE",
    "NATURE CLUB": "NATURE",
    "HEALTH CLUB": "HEALTH",
    "SUSTAINABLE CLUB": "SUSTAINABLE",
    "CONSUMER CLUB": "CONSUMER",
    "NATIONAL CADET CORPS": "NCC",
    "NATIONAL SERVICE SCHEME": "NSS",
    "HERITAGE CLUB": "HERITAGE",
    Heritage: "HERITAGE",
    // Legacy mappings for backward compatibility
    "Blue Sky Forum": "BLUESKY",
    "Readers' Club": "READERS",
    "Photography Club": "PHOTOGRAPHY",
    "Dance Club": "FINE ARTS",
    "Music Club": "FINE ARTS",
    "Drama Club": "LITERARY",
    "Tech Club": "INNOVATIVE",
    "Literary Club": "LITERARY",
    "Sports Club": "NCC",
    "Cultural Club": "FINE ARTS",
  };

  return clubMapping[clubName] || "FINE ARTS"; // Default fallback
};

// @desc    Send admin invitation
// @route   POST /api/v1/admin/invite
// @access  Super Admin only
const sendAdminInvite = catchAsyncError(async (req, res, next) => {
  const { email, club, eventId } = req.body;

  if (!email || !club || !eventId) {
    return next(
      new ErrorHandler("Email, club, and event ID are required", 400)
    );
  }

  // Check if user is super admin
  if (!req.user.isSuperAdmin) {
    return next(new ErrorHandler("Access denied. Super admin only.", 403));
  }

  // Validate event exists
  const event = await Events.findById(eventId);
  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Check if user already exists with this email
  const existingUser = await Users.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new ErrorHandler("User with this email already exists", 400));
  }

  // Check if there's already a pending invite for this email and event
  const existingInvite = await AdminInvite.findOne({
    email: email.toLowerCase(),
    eventId,
    isUsed: false,
    inviteTokenExpire: { $gt: Date.now() },
  });

  if (existingInvite) {
    return next(
      new ErrorHandler("Invitation already sent for this email and event", 400)
    );
  }

  // Check if an admin is already assigned to this event
  const existingEventAdmin = await Users.findOne({
    role: "admin",
    assignedEvent: eventId,
  });

  if (existingEventAdmin) {
    return next(
      new ErrorHandler(
        `An admin (${existingEventAdmin.email}) is already assigned to this event`,
        400
      )
    );
  }

  // Check if there's already a pending invite for this event (any email)
  const existingEventInvite = await AdminInvite.findOne({
    eventId,
    isUsed: false,
    inviteTokenExpire: { $gt: Date.now() },
  });

  if (existingEventInvite) {
    return next(
      new ErrorHandler(
        `A pending invitation for this event already exists (sent to ${existingEventInvite.email})`,
        400
      )
    );
  }

  // Create new invitation with provided club or map from event
  const mappedClubName = mapClubName(club);

  const adminInvite = new AdminInvite({
    email: email.toLowerCase(),
    name: "Pending Admin", // Placeholder name, will be set during registration
    eventId,
    clubName: mappedClubName,
    invitedBy: req.user._id,
  });

  const inviteToken = adminInvite.generateInviteToken();
  await adminInvite.save();

  // Send invitation email
  const inviteUrl = `${process.env.FRONTEND_URL}/admin/signup/${inviteToken}`;
  console.log("Invite URL sent: ", inviteUrl);
  const emailData = {
    email: email,
    subject: "Admin Invitation - Legacy 2025",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're Invited to be an Event Admin!</h2>
        <p>Hello,</p>
        <p>You have been invited to be an admin for the following event:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin: 0; color: #555;">${event.name}</h3>
          <p style="margin: 5px 0; color: #666;">Club: ${
            event.clubInCharge || event.organizing_club
          }</p>
          <p style="margin: 5px 0; color: #666;">Event Type: ${
            event.event_type
          }</p>
        </div>
        <p>As an admin, you'll be able to:</p>
        <ul>
          <li>Manage event registrations</li>
          <li>View participant details</li>
          <li>Update event information</li>
          <li>Monitor event statistics</li>
        </ul>
        <p>Click the button below to complete your admin registration:</p>
        <a href="${inviteUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Accept Invitation</a>
        <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
        <p style="color: #666; font-size: 14px;">If you can't click the button, copy and paste this link: ${inviteUrl}</p>
        <hr style="margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">This invitation was sent by ${
          req.user.name
        } (Super Admin)</p>
      </div>
    `,
  };

  try {
    await sendEmail(emailData);

    res.status(200).json({
      success: true,
      message: "Admin invitation sent successfully",
      data: {
        email,
        eventName: event.name,
        clubName: event.clubInCharge || event.organizing_club,
        expiresAt: adminInvite.inviteTokenExpire,
      },
    });
  } catch (error) {
    console.error("Email sending error:", error);
    // If email fails, remove the invitation
    await AdminInvite.findByIdAndDelete(adminInvite._id);
    return next(new ErrorHandler("Failed to send invitation email", 500));
  }
});

// @desc    Get invitation details
// @route   GET /api/v1/admin/invite/:token
// @access  Public
const getInviteDetails = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  // Hash token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const invite = await AdminInvite.findOne({
    inviteToken: hashedToken,
    inviteTokenExpire: { $gt: Date.now() },
    isUsed: false,
  }).populate(
    "eventId",
    "name event_type clubInCharge organizing_club description"
  );

  if (!invite) {
    return next(new ErrorHandler("Invalid or expired invitation token", 400));
  }

  res.status(200).json({
    success: true,
    data: {
      email: invite.email,
      event: invite.eventId,
      clubName: invite.clubName,
      expiresAt: invite.inviteTokenExpire,
    },
  });
});

// @desc    Complete admin signup using invitation
// @route   POST /api/v1/admin/signup/:token
// @access  Public
const completeAdminSignup = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const { name, password, gender } = req.body;

  if (!name || !password || !gender) {
    return next(new ErrorHandler("All fields are required", 400));
  }

  // Hash token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const invite = await AdminInvite.findOne({
    inviteToken: hashedToken,
    inviteTokenExpire: { $gt: Date.now() },
    isUsed: false,
  }).populate("eventId");

  if (!invite) {
    return next(new ErrorHandler("Invalid or expired invitation token", 400));
  }

  // Check if user already exists
  const existingUser = await Users.findOne({ email: invite.email });
  if (existingUser) {
    return next(new ErrorHandler("User with this email already exists", 400));
  }

  // Create new admin user
  const mappedClubName = mapClubName(invite.clubName);

  const adminUser = new Users({
    name,
    email: invite.email,
    password,
    gender,
    level: "UG", // Default level for admins
    degree: "BE", // Default degree for admins
    dept: "Administration", // Default department for admins
    year: "0", // For admins, we use "0" instead of student year
    phoneNumber: "9999999999", // Default phone for admins
    college: "SSN College of Engineering", // Default college for admins
    city: "Chennai", // Default city for admins
    role: "admin",
    club: mappedClubName,
    assignedEvent: invite.eventId._id, // Assign the admin to the specific event
    isVerified: true, // Auto-verify invited admins
  });

  await adminUser.save();

  // Add admin to event's staff_incharges
  await Events.findByIdAndUpdate(invite.eventId._id, {
    $push: {
      staff_incharges: {
        adminId: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        club: mappedClubName,
      },
    },
  });

  // Mark invitation as used
  invite.isUsed = true;
  invite.usedAt = new Date();
  invite.adminId = adminUser._id;
  await invite.save();

  // Generate JWT token
  const jwtToken = adminUser.getJwtToken();

  res.status(201).json({
    success: true,
    message: "Admin account created successfully",
    token: jwtToken,
    user: {
      _id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      club: adminUser.club,
      assignedEvent: {
        _id: invite.eventId._id,
        name: invite.eventId.name,
        event_type: invite.eventId.event_type,
      },
    },
  });
});

// @desc    Get all sent invitations
// @route   GET /api/v1/admin/invites
// @access  Super Admin only
const getAllInvites = catchAsyncError(async (req, res, next) => {
  if (!req.user.isSuperAdmin) {
    return next(new ErrorHandler("Access denied. Super admin only.", 403));
  }

  const invites = await AdminInvite.find({})
    .populate("eventId", "name event_type")
    .populate("invitedBy", "name email")
    .populate("adminId", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: invites.length,
    data: invites,
  });
});

// @desc    Cancel invitation
// @route   DELETE /api/v1/admin/invite/:inviteId
// @access  Super Admin only
const cancelInvite = catchAsyncError(async (req, res, next) => {
  const { inviteId } = req.params;

  if (!req.user.isSuperAdmin) {
    return next(new ErrorHandler("Access denied. Super admin only.", 403));
  }

  const invite = await AdminInvite.findById(inviteId);
  if (!invite) {
    return next(new ErrorHandler("Invitation not found", 404));
  }

  if (invite.isUsed) {
    return next(new ErrorHandler("Cannot cancel a used invitation", 400));
  }

  await AdminInvite.findByIdAndDelete(inviteId);

  res.status(200).json({
    success: true,
    message: "Invitation cancelled successfully",
  });
});

module.exports = {
  sendAdminInvite,
  getInviteDetails,
  completeAdminSignup,
  getAllInvites,
  cancelInvite,
};
