const mongoose = require("mongoose");

const InviteSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Events",
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teams",
      required: true,
    },
    inviterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    inviteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    message: {
      type: String,
      default: "wants to invite you to join their team",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    respondedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
InviteSchema.index({ inviteeId: 1, status: 1 });
InviteSchema.index({ teamId: 1, status: 1 });
InviteSchema.index({ inviterId: 1 });

module.exports = mongoose.model("Invites", InviteSchema);
