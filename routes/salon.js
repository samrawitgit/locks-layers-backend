const express = require("express");
const router = express.Router();

const locationController = require("../controllers/location");

router.get("/locations", locationController.getLocationsData);

module.exports = router;
