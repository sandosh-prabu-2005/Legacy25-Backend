const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Counter = require("./counter");
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  year: {
    type: String,
    required: true,
    default: function () {
      return this.role === "admin" ? "0" : undefined;
    },
  },
  dept: { type: String, required: true },
  ugpg: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: [true, "Email-ID already exists"],
    validate: [validator.isEmail, "Please enter a valid Email ID"],
  },
  password: {
    type: String,
    required: true,
    maxlength: [30, "Password cannot exceed 30 characters"],
    select: false,
  },
  dept: { type: String, required: true },
  ugpg: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        // Accept only known UG/PG types (add more as needed)
        const allowed = [
          "BE", "BTech", "BA", "BSc", "BCom", "BBA_BMS", "BCA", "Other_Undergraduate", "Postgraduate_Common",
          "MA", "MSc", "MCom", "MBA", "MCA", "MSW", "PhD", "M.E.", "UG", "PG"
        ];
        return allowed.includes(v);
      },
      message: "UG/PG type is invalid."
    }
  },
  college: { type: String, required: true },
  city: { type: String, required: true },
  club: {
    type: String,
    required: function () {
      return this.role === "admin";
    },
    enum: [
      "FINE ARTS",
      "LITERARY",
      "PHOTOGRAPHY",
      "BLUESKY",
      "INNOVATIVE",
      "NATURE",
      "HEALTH",
      "SUSTAINABLE",
      "RIFLE",
      "CONSUMER",
      "NCC",
      "READERS",
      "NSS",
      "HERITAGE",
    ],
  },
  role: { type: String, default: "user", enum: ["user", "admin"] },
  isSuperAdmin: { type: Boolean, default: false },
  assignedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Events",
    required: function () {
      return this.role === "admin" && !this.isSuperAdmin;
    },
  },
  resetPasswordToken: { type: String },
  resetPasswordTokenExpire: { type: Date },
  verificationToken: { type: String },
  verificationTokenExpire: { type: Date },
  adminInviteToken: { type: String },
  adminInviteTokenExpire: { type: Date },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  UserId: { type: String, unique: true },
  isPresent: { type: Boolean },
  isWinner: { type: Boolean },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

UserSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id, email: this.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  });
};

UserSchema.methods.isValidPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getResetToken = function () {
  const token = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.resetPasswordTokenExpire = Date.now() + 30 * 60 * 1000;
  return token;
};

UserSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(20).toString("hex");
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

UserSchema.methods.generateAdminInviteToken = function () {
  const token = crypto.randomBytes(20).toString("hex");
  this.adminInviteToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.adminInviteTokenExpire = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  return token;
};

UserSchema.pre("save", async function (next) {
  if (this.isNew && !this.UserId) {
    try {
      const counterDoc = await Counter.findOneAndUpdate(
        { name: "userId" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.UserId = `FUID${String(counterDoc.seq).padStart(4, 0)}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Virtual field to add isAdmin based on role
UserSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

// Ensure virtual fields are included in JSON
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

const UserModel = mongoose.model("Users", UserSchema);

module.exports = UserModel;
