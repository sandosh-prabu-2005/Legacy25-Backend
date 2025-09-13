const UserModel = require("../models/users");

const createFirstAdmin = async () => {
  try {
    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Database operation timed out")), 5000);
    });

    // Check if any admin exists with timeout
    const adminCountPromise = UserModel.countDocuments({ role: "admin" });
    const adminCount = await Promise.race([adminCountPromise, timeoutPromise]);

    if (adminCount === 0) {
      console.log(
        "No admin found. Please create an admin account through the registration endpoint."
      );
    } else {
      console.log(`${adminCount} admin(s) found in the database.`);
    }
  } catch (error) {
    console.error("Error checking admin count:", error.message);
    // Don't throw the error to prevent server startup issues
  }
};

module.exports = { createFirstAdmin };
