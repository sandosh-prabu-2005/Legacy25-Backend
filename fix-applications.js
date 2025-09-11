const mongoose = require('mongoose');
const Event = require('./models/events');

async function fixApplications() {
  await mongoose.connect('mongodb://localhost:27017/legacy25');
  const events = await Event.find({});
  const { Types } = mongoose;
  for (const event of events) {
    let changed = false;
    if (Array.isArray(event.applications)) {
      // Remove invalid applications and fix isWinner
      const validApplications = event.applications.filter(app => {
        // _id must be a valid ObjectId string or ObjectId
        let validId = false;
        if (app._id) {
          if (typeof app._id === 'object' && Types.ObjectId.isValid(app._id)) {
            validId = true;
          } else if (typeof app._id === 'string' && Types.ObjectId.isValid(app._id)) {
            app._id = new Types.ObjectId(app._id);
            validId = true;
          }
        }
        if (!validId) {
          changed = true;
          return false; // remove this application
        }
        // isWinner must be boolean
        if (typeof app.isWinner !== 'boolean') {
          app.isWinner = false;
          changed = true;
        }
        return true;
      });
      if (event.applications.length !== validApplications.length) {
        changed = true;
      }
      event.applications = validApplications;
      if (changed) {
        await event.save();
        console.log(`Fixed applications for '${event.name}'`);
      }
    }
  }
  mongoose.disconnect();
}

fixApplications();
