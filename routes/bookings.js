const express = require("express");
const { body } = require("express-validator");

const isAuth = require("../utils/is-auth");

const bookingsController = require("../controllers/bookings");

const router = express.Router();

router.get(
  "/bookings/calendar",
  isAuth,
  bookingsController.getBookingsGroupedByMonth
);
router.get("/bookings/:locationId", bookingsController.getBookingsByLoc);
router.get("/user-bookings/:userId", bookingsController.getBookingsByUser);

router.post(
  "/new-booking",
  [
    body("userId").escape(),
    body("serviceId").escape(),
    body("locationId").escape(),
    body("date").escape(),
  ],
  bookingsController.addBooking
);

module.exports = router;
