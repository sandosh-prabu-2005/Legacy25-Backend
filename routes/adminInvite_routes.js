const express = require("express");
const {
  sendAdminInvite,
  getInviteDetails,
  completeAdminSignup,
  getAllInvites,
  cancelInvite,
} = require("../controllers/adminInviteController");
const { isAuthenticatedUser } = require("../middlewares/authenticate");

const router = express.Router();

// Super admin routes (protected)
router.post("/invite", isAuthenticatedUser, sendAdminInvite);
router.get("/invites", isAuthenticatedUser, getAllInvites);
router.delete("/invite/:inviteId", isAuthenticatedUser, cancelInvite);

// Public routes for invitation completion
router.get("/invite/:token", getInviteDetails);
router.post("/signup/:token", completeAdminSignup);

module.exports = router;
