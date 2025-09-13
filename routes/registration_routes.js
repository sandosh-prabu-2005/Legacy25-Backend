const express = require("express");
const {
  registerSoloEvent,
  registerGroupEvent,
  registerEventWithParticipants,
  getCollegeRegistrations,
  updateSoloRegistration,
  updateTeamRegistrationMember,
  checkEventAvailability,
  removeTeamMember,
} = require("../controllers/registrationController");
const { isAuthenticatedUser } = require("../middlewares/authenticate");
const router = express.Router();

// Registration routes
router.route("/solo").post(isAuthenticatedUser, registerSoloEvent);
router.route("/group").post(isAuthenticatedUser, registerGroupEvent);
router
  .route("/direct")
  .post(isAuthenticatedUser, registerEventWithParticipants);
router.route("/college").get(isAuthenticatedUser, getCollegeRegistrations);

// Event availability check
router
  .route("/check/:eventId")
  .get(isAuthenticatedUser, checkEventAvailability);

// Update routes
router
  .route("/solo/:registrationId")
  .put(isAuthenticatedUser, updateSoloRegistration);
router
  .route("/team/:teamId/member/:memberId")
  .put(isAuthenticatedUser, updateTeamRegistrationMember)
  .delete(isAuthenticatedUser, removeTeamMember);

module.exports = router;
