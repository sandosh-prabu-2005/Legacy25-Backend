const express = require("express");
const { 
    registerSoloEvent,
    registerGroupEvent
} = require("../controllers/registrationController");
const { isAuthenticatedUser } = require("../middlewares/authenticate");
const router = express.Router();

// Registration routes
router.route("/solo").post(isAuthenticatedUser, registerSoloEvent);
router.route("/group").post(isAuthenticatedUser, registerGroupEvent);

module.exports = router;
