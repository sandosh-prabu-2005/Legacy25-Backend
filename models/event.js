const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  eventName: { type: String, required: true },
  eventType: String,
  clubInCharge: String,
  coordinatorName: String,
  coordinatorDept: String,
});

module.exports = mongoose.model("Event", eventSchema);
