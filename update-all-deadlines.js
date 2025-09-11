const mongoose = require('mongoose');
const Event = require('./models/events');

async function updateAllDeadlines(newDeadline) {
  await mongoose.connect('mongodb://localhost:27017/legacy25');
  const events = await Event.find({});
  for (const event of events) {
    event.applicationDeadline = new Date(newDeadline);
    await event.save();
    console.log(`Updated deadline for '${event.name}' to ${event.applicationDeadline}`);
  }
  mongoose.disconnect();
}

// Set all event deadlines to 30-09-2025 23:59
updateAllDeadlines('2025-09-30T23:59:00');
