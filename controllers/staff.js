const sqlDb = require("../utils/database").sqlDb;

// sqlDb.execute('SELECT member FROM days_of_week WHERE day_of_week > 4')
// 	.then(result => {
// 		const days = result[0].map((item, id) => { console.log(item, id); return item.day_of_week })
// 		console.log(result[0], days)
// 	})
// 	.catch(err => console.log(err));

exports.getStaff = (req, res, next) => {
  const locationId = req.params.locationId;
  sqlDb
    .execute("SELECT name, surname FROM staff WHERE id_location = ?;", [
      locationId,
    ])
    .then((result) => {
      console.log({ res: result });
      const days = result[0].map((item, id) => {
        // console.log(item, id);
        return item.day_of_week;
      });
      // console.log(result[0], days);
      res
        .status(200)
        .json({ data: { staff: result[0], count: result[0].length } });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Failed to fetch staff data." });
    });
};

exports.getCurrentStaffCount = (req, res, next) => {
  const locationId = req.params.locationId;
  sqlDb
    .execute(
      "SELECT COUNT(*) FROM (SELECT name, surname FROM staff WHERE id_location = ?) AS staff_data;",
      [locationId]
    )
    .then((result) => {
      res.status(200).json({ data: { count: Object.values(result[0][0])[0] } });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Failed to fetch staff count." });
    });
};

exports.getRandomStaffMember = (start, duration, locationId) => {
  const durationObj = {
    h: duration.slice(0, 2),
    m: duration.slice(3, 5),
    s: duration.slice(6, 8),
  };
  const end = start
    .add(durationObj.h, "hour")
    .add(durationObj.m, "minute")
    .format("YYYY-MM-DD HH:mm:ss");

  return sqlDb.execute(
    `
    SELECT s.*,  l.city, l.tot_work_stations FROM staff AS s
      LEFT JOIN (SELECT * FROM alt_staff_hours AS alt
            WHERE alt.start_date BETWEEN ? AND ?) AS alt ON s.id = alt.id_staff
      LEFT JOIN (SELECT * FROM bookings AS b 
        WHERE b.booking_date BETWEEN ? AND ?) AS b ON s.id = b.id_staff
      INNER JOIN locations AS l ON l.id = s.id_location
        WHERE alt.id_staff IS NULL 
        && b.id_staff IS NULL
            && s.id_location = ?;`,
    [
      start.format("YYYY-MM-DD HH:mm:ss"),
      end,
      start.format("YYYY-MM-DD HH:mm:ss"),
      end,
      locationId,
    ]
  );
};

exports.isStaffOff = (date, staffId) => {
  return sqlDb.execute(
    `SELECT alt.id, alt.start_date, alt.end_date
    FROM alt_staff_hours AS alt
    WHERE (? BETWEEN start_date AND end_date)
      && alt.id_staff = ?`,
    [date, staffId]
  );
};

exports.addTimeOff = async (req, res, next) => {
  const staffId = req.body.staff_id;
  const startDate = req.body.start_date; // YYYY-MM-DD
  const endDate = req.body.end_date; // YYYY-MM-DD

  const startDateCheck = await this.isStaffOff(startDate, staffId);
  const endDateCheck = await this.isStaffOff(endDate, staffId);

  console.log({ start: startDateCheck[0], endDateCheck: endDateCheck[0] });

  if (startDateCheck[0].length || endDateCheck[0].length) {
    res
      .status(403)
      .json({ message: "Staff is already off in the selected date & time" });
  } else {
    const insertRes = await sqlDb.execute(
      `
      INSERT INTO alt_staff_hours (alt_staff_hours.id_staff, alt_staff_hours.start_date, alt_staff_hours.end_date)
        VALUES (?, ?, ?);   
    `,
      [staffId, startDate, endDate]
    );
    if (insertRes) {
      console.log({ insertRes, res: insertRes[0] });
      res
        .status(201)
        .json({ message: "Staff timetable was successfully updated" });
    } else {
      res.status(500).json({ message: "Staff timetable could not be updated" });
    }
  }

  // INSERT INTO alt_staff_hours (alt_staff_hours.id_staff, alt_staff_hours.start_date, alt_staff_hours.end_date)
  // VALUES ('4', '2023-07-19 12:30:00', '2023-07-19 16:00:00');
};
