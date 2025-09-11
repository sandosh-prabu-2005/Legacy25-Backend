const { isAuthenticatedUser } = require("./authenticate");

// Create alias for consistency
const isAuthenticated = isAuthenticatedUser;

module.exports = {
  isAuthenticated,
  isAuthenticatedUser,
};
