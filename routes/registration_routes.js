const express = require("express");
const { 
    registerSoloEvent,
    registerGroupEvent,
    registerEventWithParticipants,
    getCollegeRegistrations
} = require("../controllers/registrationController");
const { isAuthenticatedUser } = require("../middlewares/authenticate");
const router = express.Router();

// Registration routes
router.route("/solo").post(isAuthenticatedUser, registerSoloEvent);
router.route("/group").post(isAuthenticatedUser, registerGroupEvent);
router.route("/direct").post(isAuthenticatedUser, registerEventWithParticipants);
router.route("/college").get(isAuthenticatedUser, getCollegeRegistrations);

module.exports = router;
