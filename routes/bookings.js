const express = require("express");
const { check, body } = require("express-validator");

const bookingsController = require("../controllers/bookings");

const router = express.Router();

router.get("/bookings/:locationId", bookingsController.getAllBookingsByLoc);

module.exports = router;
