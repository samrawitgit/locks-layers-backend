const express = require("express");
const router = express.Router();

const locationController = require("../controllers/location");
const staffController = require("../controllers/staff");

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
router.get("/locations", locationController.getLocations);

router.get("/locations/:locationId", locationController.getLocation);

router.get("/business_hours/:locationId", locationController.getBusinessHours);

router.post("/close-location", locationController.closeLocation);

router.post("/time-off", staffController.addTimeOff);

// router.post('add-product', ...) // admin/add-product => POST

module.exports = router;
