const express = require("express");
const app = express();
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
dotenv.config({ path: path.join(__dirname, "config/config.env") });
const errorMiddleware = require("./middlewares/error");

const user = require("./routes/users_routes");
const events = require("./routes/events_routes");
const registration = require("./routes/registration_routes");
const team = require("./routes/team_routes");
const cookieParser = require("cookie-parser");
const admin = require("./routes/admin_routes");
const adminInvite = require("./routes/adminInvite_routes");
const payment = require("./routes/payment_routes");

const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Health check route for Railway
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Legacy 2025 Backend API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use("/api/v1", user);
app.use("/api/v1", events);
app.use("/api/v1", admin);
app.use("/api/v1/admin", adminInvite);
// Registration routes mounted at both /api/v1 and /api/v1/registration for compatibility
app.use("/api/v1", registration);
app.use("/api/v1/registration", registration);
app.use("/api/v1/teams", team);
app.use("/api/v1", payment);

app.use(errorMiddleware);
module.exports = app;
