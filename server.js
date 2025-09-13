const app = require("./app");
const connectDatabase = require("./config/database");
const { createFirstAdmin } = require("./utils/createFirstAdmin");

// Connect to database with retry mechanism
const startServer = async () => {
  let retries = 3;
  let server;

  while (retries > 0) {
    try {
      console.log(`🚀 Starting server (attempt ${4 - retries}/3)...`);

      // Wait for database connection
      await connectDatabase();
      console.log("✅ Database connected successfully");

      // Start the server
      server = app.listen(process.env.PORT, () => {
        console.log(
          `🌟 Server listening on port ${process.env.PORT} in ${process.env.NODE_ENV} mode`
        );
        console.log(`🔗 Server URL: http://localhost:${process.env.PORT}`);
      });

      // Initialize first admin after database is connected
      try {
        await createFirstAdmin();
      } catch (error) {
        console.log(
          "⚠️ First admin check completed with issues:",
          error.message
        );
      }

      // Success - break out of retry loop
      break;
    } catch (error) {
      retries--;
      console.error(`❌ Server start attempt failed:`, error.message);

      if (retries > 0) {
        console.log(`⏳ Retrying in 5 seconds... (${retries} attempts left)`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        console.error("💥 All retry attempts failed. Server could not start.");
        process.exit(1);
      }
    }
  }

  // Error handling (only set up if server started successfully)
  if (server) {
    process.on("unhandledRejection", (err) => {
      console.log(`Error: ${err.message}`);
      console.log(`Shutting down server due to unhandled rejection`);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on("uncaughtException", (err) => {
      console.log(`Error: ${err.message}`);
      console.log(`Shutting down server due to uncaught Exception`);
      server.close(() => {
        process.exit(1);
      });
    });
  }
};

// Start the server
startServer();
