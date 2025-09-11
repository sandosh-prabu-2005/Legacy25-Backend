const UserModel = require("../models/users");
const ErrorHandler = require("../utils/errorHandler");

const catchAsyncError = require("./catchAsyncError");
const jwt = require('jsonwebtoken');

exports.isAuthenticatedAdmin = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler('Please login to participate in any events', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await UserModel.findOne({ user_id: decoded.user_id });
    if (!req.user) {
      return next(new ErrorHandler('User not found', 404));
    }
    if(req.user.role !== "admin") {return next(new ErrorHandler('Please verify your email', 401))}

    next();
  } catch (error) {
    // Handle JWT verification error
    return next(new ErrorHandler('Invalid token', 401));
  }
});
