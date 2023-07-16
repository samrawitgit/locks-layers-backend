const express = require("express");
const router = express.Router();

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
router.get("/locations", locationController.getLocationsData);

router.get("/locations/:locationId", locationController.getLocation);

router.get(
  "/business_hours/:locationId",
  locationController.getBusinessHoursByLoc
);

router.post("/close-location", locationController.closeLocation);

router.post("/time-off", staffController.addTimeOff);
router.get("/services", bookingsController.getAllServices);

// router.post('add-product', ...) // admin/add-product => POST

module.exports = router;
