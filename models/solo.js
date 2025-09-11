const mongoose = require('mongoose');

const soloSchema = new mongoose.Schema({
  eventId: String,
  name: String,
  year: String,
  branch: String,
  section: String,
  email: String,
  rollNumber: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('Solo', soloSchema);
