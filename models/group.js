const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: String,
  year: String,
  branch: String,
  section: String,
  email: String
}, { _id: false });

const groupSchema = new mongoose.Schema({
  eventId: String,
  teamLeadName: String,
  members: [memberSchema]
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
