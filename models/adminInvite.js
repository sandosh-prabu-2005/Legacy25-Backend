const mongoose = require("mongoose");
const crypto = require("crypto");

const AdminInviteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Events",
    required: true,
  },
  clubName: {
    type: String,
    required: true,
  },
  inviteToken: {
    type: String,
    required: true,
    unique: true,
  },
  inviteTokenExpire: {
    type: Date,
    required: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedAt: {
    type: Date,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate invite token
AdminInviteSchema.methods.generateInviteToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.inviteToken = crypto.createHash("sha256").update(token).digest("hex");
  this.inviteTokenExpire = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  return token;
};

// Check if invite is valid
AdminInviteSchema.methods.isValidInvite = function () {
  return !this.isUsed && this.inviteTokenExpire > Date.now();
};

// Indexes (inviteToken index is automatically created by unique: true)
AdminInviteSchema.index({ email: 1 });
AdminInviteSchema.index({ inviteTokenExpire: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("AdminInvite", AdminInviteSchema);
