const dayjs = require("dayjs");
const { ObjectId } = require("mongodb");

const sqlDb = require("../utils/database").sqlDb;
const getDb = require("../utils/database").getDb;

exports.getBookingsByLoc = (req, res, next) => {
  const locationId = req.params.locationId;
  let bookingData;
  sqlDb
    .execute(
      `SELECT b.id_user AS user, b.booking_date, s.service_type, s.duration, st.name AS staff_name, st.surname AS staff_surname, l.city, l.tot_work_stations FROM bookings AS b
        INNER JOIN services AS s ON b.id_service = s.id
        INNER JOIN staff AS st ON st.id = b.id_staff
        INNER JOIN locations AS l ON l.id = b.id_location
        WHERE b.id_location = ?;`,
      [locationId]
    )
    .then((result) => {
      bookingData = result[0];
      const userIds = result[0].map((res) => new ObjectId(res.user));
      getDb()
        .db()
        .collection("users")
        .find({ _id: { $in: userIds } })
        .toArray()
        .then((data) => {
          console.log({ data });
          // console.log({
          //   usersData,
          //   bookingData,
          //   userData: bookingData[0].user,
          // });
          data.forEach((userData) => {
            bookingData
              .filter((b) => b.user === userData._id.toString())
              .forEach((currB) => {
                if (currB.user === userData._id.toString()) {
                  currB.user = {
                    id: currB.user,
                    userName: userData.userName,
                    name: userData.name,
                    surname: userData.surname,
                  };
                }
                return currB;
              });
          });
          res.status(200).json({ data: { bookingData } });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Failed to fetch bookings." });
    });
};

exports.getBookingsByUser = (req, res, next) => {
  const userId = req.params.userId;
  sqlDb
    .execute(
      `SELECT b.id_user, b.booking_date, s.service_type, s.duration, st.name AS staff_name, st.surname AS staff_surname, l.city FROM bookings AS b
      INNER JOIN services AS s ON b.id_service = s.id
      INNER JOIN staff AS st ON st.id = b.id_staff
      INNER JOIN locations AS l ON l.id = b.id_location
      WHERE b.id_user = ?;`,
      [userId]
    )
    .then((result) => {
      console.log({ result });
      res.status(200).json({ data: result[0] });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Failed to fetch user bookings." });
    });
};

exports.getBookingsGroupedByMonth = (req, res, next) => {
  const locationId = req.params.locationId;
  let bookingData;
  sqlDb
    .execute(
      `SELECT DATE_FORMAT(booking_date, '%m-%Y') AS month_group, 
        b.id_user AS user, b.booking_date, s.service_type, s.duration, st.name AS staff_name, st.surname AS staff_surname, l.city FROM bookings AS b
        INNER JOIN services AS s ON b.id_service = s.id
        INNER JOIN staff AS st ON st.id = b.id_staff
        INNER JOIN locations AS l ON l.id = b.id_location
        WHERE b.id_location = ?
        GROUP BY MONTH(booking_date), YEAR(booking_date), b.id`,
      [locationId]
    )
    .then((result) => {
      const userIds = result[0].map((res) => new ObjectId(res.user));
      getDb()
        .db()
        .collection("users")
        .find({ _id: { $in: userIds } })
        .forEach((user) => {
          bookingData = result[0].reduce((acc, curr, i) => {
            const { month_group, ...data } = curr;
            console.log({ acc, curr, user });
            acc[month_group] = acc[month_group] || [];
            curr.user = {
              id: user._id,
              userName: user.userName,
              name: user.name,
              surname: user.surname,
            };
            acc[month_group].push(data);
            return acc;
          }, {});
        })
        .then((data) => {
          res.status(200).json({ data: { bookingData } });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Failed to fetch bookings." });
    });
};

exports.getServiceByType = (type) =>
  sqlDb.execute(`SELECT * FROM services WHERE service_type=?`, [type]);

exports.getlocationIdByCity = (city) =>
  sqlDb.execute(`SELECT * FROM locations WHERE city=?`, [city]);

const getRandomStaffMember = (start, duration, locationId) => {
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

exports.addBooking = async (req, res, next) => {
  const userId = req.body.userId;
  const service = req.body.service;
  const location = req.body.location;
  const startBooking = dayjs(req.body.date);

  const serviceRes = await this.getServiceByType(service);
  const locationRes = await this.getlocationIdByCity(location);

  if (serviceRes && locationRes) {
    const serviceId = serviceRes[0][0].id;
    const duration = serviceRes[0][0].duration;
    const locationId = locationRes[0][0].id;

    const allStaff = await getRandomStaffMember(
      startBooking,
      duration,
      locationId
    );
    if (allStaff) {
      const availableStaff = allStaff[0];
      if (availableStaff.length) {
        const chosen =
          availableStaff[Math.floor(Math.random() * availableStaff.length)];
        const newBooking = await sqlDb.execute(
          `INSERT INTO bookings (bookings.id_user, bookings.id_service, bookings.id_location, bookings.id_staff, bookings.booking_date) 
            VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            serviceId,
            locationId,
            chosen.id,
            startBooking.format("YYYY-MM-DD HH:mm:ss"),
          ]
        );
        if (newBooking) {
          console.log({ newBooking });
          res.status(201).json({ message: "Booking was successful" });
        }
      } else {
        res.status(500).json({
          message: "All staff members are booked for the selected time",
        });
      }
    }
  } else {
    res.status(500).json({ message: "Failed to add booking." });
  }
};
