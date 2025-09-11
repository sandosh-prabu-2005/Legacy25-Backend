const app = require("./app");
const connectDatabase = require("./config/database");
const { createFirstAdmin } = require("./utils/createFirstAdmin");

connectDatabase();

const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server listening to the port ${process.env.PORT} in ${process.env.NODE_ENV}`
  );
});

// Initialize first admin after server starts
setTimeout(() => {
  createFirstAdmin();
}, 2000);

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
