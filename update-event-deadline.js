const mongoose = require('mongoose');
const Event = require('./models/events');

async function updateDeadline(eventName, newDeadline) {
  await mongoose.connect('mongodb://localhost:27017/legacy25');
  const event = await Event.findOne({ name: eventName });
  if (!event) {
    console.log('Event not found');
    process.exit(1);
  }
  event.applicationDeadline = new Date(newDeadline);
  await event.save();
  console.log(`Updated deadline for '${event.name}' to ${event.applicationDeadline}`);
  mongoose.disconnect();
}

// Example usage: update deadline for "Group Dance" to Sept 30, 2025
updateDeadline('Group Dance', '2025-09-30T23:59:00');
