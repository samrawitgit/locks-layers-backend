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

exports.getLocationIdByCity = (city) =>
  sqlDb.execute(`SELECT * FROM locations WHERE city=?`, [city]);

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

exports.isLocationClosed = (date) => {
  return sqlDb.execute(
    `SELECT c.id, c.id_location, c.start_date, c.end_date,
      WEEKDAY(start_date) AS startWeekDay, WEEKDAY(end_date) AS endWeekDay,
      bh.id_day_of_week, bh.opening_time, bh.closing_time, bh.closed
    FROM closing_dates AS c
    INNER JOIN business_hours AS bh ON 
      (WEEKDAY(start_date) = bh.id_day_of_week
        || WEEKDAY(end_date) = bh.id_day_of_week)
        && c.id_location = bh.id_location
    WHERE (? BETWEEN start_date AND end_date) && bh.closed != 1;`,
    [date]
  );
};

exports.closeLocation = async (req, res, next) => {
  const location = req.body.location;
  const startDate = req.body.start_date; // YYYY-MM-DD
  const endDate = req.body.end_date; // YYYY-MM-DD

  const startDateCheck = await this.isLocationClosed(startDate);
  const endDateCheck = await this.isLocationClosed(endDate);

  // console.log({ start: startDateCheck[0], end: endDateCheck[0] });

  if (startDateCheck[0].length || endDateCheck[0].length) {
    res
      .status(403)
      .json({ message: "Salon already closed for selected date range" });
  } else {
    const locationRes = await this.getLocationIdByCity(location);
    console.log({ loc: locationRes[0] });
    const locationId = locationRes[0][0].id;
    const insertRes = await sqlDb.execute(
      `
      INSERT INTO closing_dates (closing_dates.id_location, closing_dates.start_date, closing_dates.end_date)
        VALUES (?, ?, ?);   
    `,
      [locationId, startDate, endDate]
    );
    if (insertRes) {
      console.log({ insertRes, res: insertRes[0] });
      res
        .status(201)
        .json({ message: "Salon timetable was successfully updated" });
    } else {
      res.status(500).json({ message: "Timetable could not be updated" });
    }
  }
};
