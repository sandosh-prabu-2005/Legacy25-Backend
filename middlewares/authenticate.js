const UserModel = require("../models/users");
const ErrorHandler = require("../utils/errorHandler");

const catchAsyncError = require("./catchAsyncError");
const jwt = require("jsonwebtoken");

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
  let token = req.cookies.token;

  // If no token in cookies, check Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  if (!token) {
    return next(
      new ErrorHandler("Please login to participate in any events", 401)
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Make sure we have the user ID from the token
    if (!decoded.id) {
      return next(new ErrorHandler("Invalid token format", 401));
    }

    req.user = await UserModel.findById(decoded.id);
    if (!req.user) {
      return next(new ErrorHandler("User not found", 404));
    }

    if (req.user.isVerified === false) {
      return next(new ErrorHandler("Please verify your email", 401));
    }

    next();
  } catch (error) {
    // Handle JWT verification error
    return next(new ErrorHandler("Invalid token", 401));
  }
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(`Role ${req.user.role} is not allowed`, 403)
      );
    }
    next();
  };
};
