const express = require("express");
const router = express.Router();

const isAuth = require("../utils/is-auth");

const locationController = require("../controllers/location");
const staffController = require("../controllers/staff");
const bookingsController = require("../controllers/bookings");

/* STAFF */
router.get(
  "/staff/:locationId",
  staffController.getStaff
  // (req, res, next) => {
  // 	console.log('clicked')
  // 	res.status(200).json({ staffList: ['Laura', 'Giorgio', 'Sara', 'Valerio', 'Paul'] })
  // }
);

router.get("/staff-count/:locationId", staffController.getCurrentStaffCount);

/* LOCATIONS */
router.get("/locations", isAuth, locationController.getLocationsData);

router.get("/locations/:locationId", locationController.getLocation);

router.get(
  "/business_hours/:locationId",
  locationController.getBusinessHoursByLoc
);

router.post("/close-location", isAuth, locationController.closeLocation);

router.post("/time-off", isAuth, staffController.addTimeOff);
router.get("/services", isAuth, bookingsController.getAllServices);

// router.post('add-product', ...) // admin/add-product => POST

module.exports = router;
