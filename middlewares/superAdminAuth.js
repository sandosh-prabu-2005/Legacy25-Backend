const catchAsyncError = require("./catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

// Middleware to check if user is super admin
const superAdminAuth = catchAsyncError(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorHandler("Authentication required", 401));
  }

  if (!req.user.isSuperAdmin) {
    return next(
      new ErrorHandler("Access denied: Super admin privileges required", 403)
    );
  }

  next();
});

module.exports = superAdminAuth;
