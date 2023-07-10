const sqlDb = require("../utils/database").sqlDb;

exports.getLocations = (req, res, next) => {
  sqlDb
    .execute("SELECT * FROM locations;")
    .then((result) => {
      console.log({ res: result[0] });
      res.status(200).json({ data: { locations: result[0] } });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Failed to fetch locations." });
    });
};

exports.getLocation = (req, res, next) => {
  const locationId = req.params.locationId;
  sqlDb
    .execute("SELECT * FROM locations WHERE id = ?;", [locationId])
    .then((result) => {
      console.log({ res: result[0][0] });
      res.status(200).json({ data: { location: result[0][0] } });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Failed to fetch location." });
    });
};

const DAY_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

exports.getBusinessHours = (req, res, next) => {
  const locationId = req.params.locationId;
  sqlDb
    .execute(
      "SELECT id_day_of_week, opening_time, closing_time, closed FROM business_hours WHERE id_location = ?;",
      [locationId]
    )
    .then((result) => {
      const result_ = result[0].map((day) => {
        const dayWeek = DAY_OF_WEEK[day.id_day_of_week];
        return {
          dayWeek,
          opening_time: day.opening_time,
          closing_time: day.closing_time,
          closed: !!day.closed,
        };
      });
      res.status(200).json({ data: { business_hours: result_ } });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Failed to fetch location." });
    });
};
