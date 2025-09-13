const mongoose = require("mongoose");

const connectDatabase = () => {
  const options = {
    serverSelectionTimeoutMS: 10000, // Increase timeout to 10 seconds
    socketTimeoutMS: 45000,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 5, // Maintain a minimum of 5 socket connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  };

  console.log("🔄 Attempting to connect to MongoDB Atlas...");
  console.log(
    "📍 Connection URI:",
    process.env.DB_LOCAL_URI.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")
  ); // Hide credentials

  return mongoose
    .connect(process.env.DB_LOCAL_URI, options)
    .then((con) => {
      console.log(`✅ Mongo DB is connected successfully!`);
      console.log(`🌐 Host: ${con.connection.host}`);
      console.log(`📊 Database: ${con.connection.name}`);
      console.log(`🔗 Ready state: ${con.connection.readyState}`);
      return con;
    })
    .catch((err) => {
      console.error("❌ Database connection failed:");
      console.error("Error message:", err.message);
      console.error("Error code:", err.code);

      // Log additional debugging info
      if (err.reason) {
        console.error("Reason:", err.reason);
      }

      console.log("\n🔧 Troubleshooting tips:");
      console.log("1. Check if your IP is whitelisted in MongoDB Atlas");
      console.log("2. Verify your connection string and credentials");
      console.log("3. Check if your cluster is running (not paused)");
      console.log("4. Try connecting from MongoDB Compass with the same URI\n");

      throw err;
    });
};

module.exports = connectDatabase;
