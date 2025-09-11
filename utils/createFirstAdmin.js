const UserModel = require("../models/users");

const createFirstAdmin = async () => {
  try {
    // Check if any admin exists
    const adminCount = await UserModel.countDocuments({ role: "admin" });
    
    if (adminCount === 0) {
      console.log("No admin found. Please create an admin account through the registration endpoint.");
    } else {
      console.log(`${adminCount} admin(s) found in the database.`);
    }
  } catch (error) {
    console.error("Error checking admin count:", error.message);
  }
};

module.exports = { createFirstAdmin };
