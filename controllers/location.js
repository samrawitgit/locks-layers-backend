const dayjs = require("dayjs");

const sqlDb = require("../utils/database").sqlDb;

const DAY_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

exports.getBusinessHoursByLoc = (req, res, next) => {
  const locationId = req.params.locationId;
  sqlDb
    .execute(
      "SELECT id_day_of_week, opening_time, closing_time, closed FROM business_hours WHERE id_location = ?;",
      [locationId]
    )
    .then((result) => {
      const result_ = result[0].map((day) => {
        const week_day_label = DAY_OF_WEEK[day.id_day_of_week];
        return {
          week_day_label,
          week_day_id: day.id_day_of_week,
          opening_time: day.opening_time,
          closing_time: day.closing_time,
          closed: !!day.closed,
        };
      });
      res.status(200).json({ error: false, business_hours: result_ });
    })
    .catch((err) => {
      // console.log(err);
      res
        .status(500)
        .json({ error: true, message: "Failed to fetch location." });
    });
};

exports.getBusinessHours = () => {
  return sqlDb
    .execute(
      "SELECT id_day_of_week, opening_time, closing_time, closed, id_location FROM business_hours;"
    )
    .then((result) => {
      const result__ = result[0].reduce((acc, curr) => {
        const { id_location, id_day_of_week, ...data } = curr;
        const week_day_label = DAY_OF_WEEK[id_day_of_week];
        acc[id_location - 1] = acc[id_location - 1] || [];
        acc[id_location - 1].push({
          ...data,
          week_day_label,
          week_day_id: id_day_of_week,
          closed: !!data.closed,
        });
        return acc;
      }, []);
      return result__;
    })
    .catch((err) => {
      // console.log(err);
      return { error: true, message: "Could not get business hours" };
    });
};

exports.getLocationsData = (req, res, next) => {
  sqlDb
    .execute(
      `SELECT l.*, s.id AS id_staff , s.name, s.surname
      FROM locations AS l
      LEFT JOIN staff AS s ON l.id = s.id_location ORDER BY s.id`
    )
    .then(async (result) => {
      const bh = await this.getBusinessHours();
      if (bh.error) {
        res.status(500).json({ message: "Failed to fetch locations." });
      }

      const locations = result[0].reduce((acc, curr) => {
        const { id, id_staff, name, surname, ...data } = curr;
        acc[id - 1] = acc[id - 1] || {};

        const staff = acc[id - 1].staff || [];

        const currStaff = { id_staff, name, surname };
        staff.push(currStaff);

        curr = {
          ...data,
          id_location: id,
          business_hours: bh[id - 1],
          staff: staff,
        };

        acc[id - 1] = curr;
        return acc;
      }, []);

      res.status(200).json({ error: false, locations });
    })
    .catch((err) => {
      // console.log(err);
      res
        .status(500)
        .json({ error: true, message: "Failed to fetch locations." });
    });
};

exports.getLocation = (req, res, next) => {
  const locationId = req.params.locationId;
  sqlDb
    .execute("SELECT * FROM locations WHERE id = ?;", [locationId])
    .then((result) => {
      // console.log({ res: result[0][0] });
      res.status(200).json({ error: false, location: result[0][0] });
    })
    .catch((err) => {
      // console.log(err);
      res
        .status(500)
        .json({ error: true, message: "Failed to fetch location." });
    });
};

exports.getLocationIdByCity = (city) =>
  sqlDb.execute(`SELECT * FROM locations WHERE city=?`, [city]);

exports.isLocationClosed = async (start, end, locationId) => {
  const isClosed = await sqlDb.execute(
    `
    WITH RECURSIVE nrows(date, weekday) AS (
      SELECT MAKEDATE(EXTRACT(YEAR FROM CURRENT_DATE), DAYOFYEAR(CURRENT_DATE)), WEEKDAY(CURRENT_DATE)
      UNION ALL
        SELECT DATE_FORMAT(DATE_ADD(date, INTERVAL 1 day), "%Y-%m-%d"), WEEKDAY(DATE_ADD(date, INTERVAL 1 day))
          FROM nrows
          WHERE date < (DATE_ADD(CURRENT_DATE,INTERVAL 30 day))    
      )
      SELECT nrows.*, bh.id_location, bh.closed, c.id, c.start_date, c.end_date
      FROM nrows
       LEFT JOIN business_hours AS bh ON bh.id_day_of_week = weekday
       LEFT JOIN closing_dates AS c ON c.id_location = bh.id_location AND (
        (c.start_date BETWEEN ? AND date && c.end_date BETWEEN date AND ?)
        || isNull(c.id))
      WHERE 
        date BETWEEN ? AND ?
        && bh.id_location = ?
      ORDER BY date;
  `,
    [start, end, start, end, locationId]
  );
  // console.log({ isCl_: isClosed[0] });
  if (isClosed[0].length > 0) {
    const salonClosed = isClosed[0].filter((day) => day.closed);
    if (salonClosed.length > 0) {
      return {
        error: true,
        message: `The selecte date includes ${
          DAY_OF_WEEK[salonClosed[0].weekday]
        }, during which the salon is always closed. Please select a valid date.`,
      };
    } else if (isClosed[0].some((day) => day.id)) {
      return {
        error: true,
        message: "Salon already closed for selected date range",
      };
    }
    return { error: false };
  }
};

exports.closeLocation = async (req, res, next) => {
  const locationId = req.body.locationId;
  const startDate = dayjs(req.body.start_date).format("YYYY-MM-DD"); // YYYY-MM-DD
  const endDate = dayjs(req.body.end_date).format("YYYY-MM-DD"); // YYYY-MM-DD
  const reason = req.body.reason || "";

  // console.log({ locationId, startDate, endDate, reason });

  const datesCheck = await this.isLocationClosed(
    startDate,
    endDate,
    locationId
  );

  if (!datesCheck.error) {
    const insertRes = await sqlDb.execute(
      `
      INSERT INTO closing_dates (closing_dates.id_location, closing_dates.start_date, closing_dates.end_date, closing_dates.details)
        VALUES (?, ?, ?, ?);
    `,
      [locationId, startDate, endDate, reason]
    );
    if (insertRes) {
      res.status(201).json({
        error: false,
        message: "Salon timetable was successfully updated",
      });
    } else {
      res
        .status(500)
        .json({ error: true, message: "Timetable could not be updated" });
    }
  } else {
    res.status(403).json({
      error: true,
      message: datesCheck.message,
    });
  }
};
