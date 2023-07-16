const express = require("express");
const { check, body } = require("express-validator");

const bookingsController = require("../controllers/bookings");

const router = express.Router();

router.get("/bookings/calendar", bookingsController.getBookingsGroupedByMonth);
router.get("/bookings/:locationId", bookingsController.getBookingsByLoc);
router.get("/user-bookings/:userId", bookingsController.getBookingsByUser);

router.post("/new-booking", bookingsController.addBooking);

module.exports = router;
