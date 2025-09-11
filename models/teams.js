const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Events",
      required: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isRegistered: {
      type: Boolean,
      default: false,
    },
    registeredAt: {
      type: Date,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    maxMembers: {
      type: Number,
      default: 6, // Can be adjusted per event
    },
    teamGender: {
      type: String,
      enum: ["Male", "Female", "Mixed"],
      default: null,
    },
    isInvalidated: {
      type: Boolean,
      default: false,
    },
    invalidatedAt: {
      type: Date,
    },
    invalidatedReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
TeamSchema.index({ eventId: 1, leader: 1 });
TeamSchema.index({ "members.userId": 1 });

module.exports = mongoose.model("Teams", TeamSchema);
