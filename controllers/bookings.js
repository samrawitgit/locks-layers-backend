const dayjs = require("dayjs");
const { ObjectId } = require("mongodb");

const sqlDb = require("../utils/database").sqlDb;
const getDb = require("../utils/database").getDb;
const { getLocationIdByCity } = require("./location");
const { getRandomStaffMember } = require("./staff");

exports.getBookingsByLoc = (req, res, next) => {
  const locationId = req.params.locationId;
  let bookingDataByLoc;
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
      bookingDataByLoc = result[0];
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
            bookingDataByLoc
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
          res.status(200).json({ data: { bookingDataByLoc } });
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
      res.status(200).json({ error: false, bookings: result[0] });
    })
    .catch((err) => {
      console.log(err);
      res
        .status(500)
        .json({ error: true, message: "Failed to fetch user bookings." });
    });
};

exports.getBookingsGroupedByMonth = async (req, res, next) => {
  const locationId = req.query.locationId;
  let bookingData;

  const bookingsRes = await sqlDb.execute(
    `SELECT DATE_FORMAT(booking_date, '%m-%Y') AS month_group, 
        b.id_user AS user, b.booking_date, s.service_type, s.duration, st.name AS staff_name, st.surname AS staff_surname, l.city FROM bookings AS b
        INNER JOIN services AS s ON b.id_service = s.id
        INNER JOIN staff AS st ON st.id = b.id_staff
        INNER JOIN locations AS l ON l.id = b.id_location
        WHERE b.id_location = ?
        GROUP BY MONTH(booking_date), YEAR(booking_date), b.id`,
    [locationId]
  );
  if (bookingsRes[0].length > 0) {
    const userIds = bookingsRes[0].map((res) => new ObjectId(res.user));
    const users = await getDb()
      .db()
      .collection("users")
      .find({ _id: { $in: userIds } })
      .toArray();

    if (users.length > 0) {
      users.forEach((user) => {
        bookingData = bookingsRes[0].reduce((acc, curr, i) => {
          const { month_group, ...data } = curr;
          acc[month_group] = acc[month_group] || [];
          const userData = {
            id: user._id,
            userName: user.userName,
            name: user.name,
            surname: user.surname,
          };
          acc[month_group].push({ ...data, user: userData });
          return acc;
        }, {});
        return user;
      });
      res.status(200).json({ error: false, data: { bookingData } });
    } else {
      res
        .status(500)
        .json({ error: true, message: "Failed to fetch users data." });
    }
  } else {
    res.status(500).json({
      error: true,
      message: "No bookings available for this location.",
    });
  }
};

exports.getBookingsGroupedByMonth_ = (req, res, next) => {
  const locationId = req.query.locationId;
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
          console.log({ res: result[0] });
          bookingData = result[0].reduce((acc, curr, i) => {
            const { month_group, ...data } = curr;
            console.log({ acc, curr, user });
            acc[month_group] = acc[month_group] || [];
            console.log({ gr: acc[month_group] });
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
          res.status(200).json({ error: false, data: { bookingData } });
        });
    })
    .catch((err) => {
      console.log(err);
      res
        .status(500)
        .json({ error: true, message: "Failed to fetch bookings." });
    });
};

exports.getAllServices = async (req, res, next) => {
  const serviceRes = await sqlDb.execute("SELECT * FROM services;");
  if (serviceRes) {
    console.log({ serviceRes });
    res.status(200).json({ error: false, services: serviceRes[0] });
  } else {
    res
      .status(500)
      .json({ error: true, message: "Failed to retrieve services data" });
  }
};

exports.getServiceById = (id) =>
  sqlDb.execute(`SELECT * FROM services WHERE id=?`, [id]);

exports.getServiceByType = (type) =>
  sqlDb.execute(`SELECT * FROM services WHERE service_type=?`, [type]);

exports.addBooking = async (req, res, next) => {
  const userId = req.body.userId;
  const serviceId = req.body.serviceId;
  const locationId = req.body.locationId;
  const startBooking = dayjs(req.body.date);

  const serviceRes = await this.getServiceById(serviceId);
  console.log({ serviceRes, serv: serviceRes[0] });
  if (serviceRes) {
    const duration = serviceRes[0][0].duration;

    const chosen = await getRandomStaffMember(
      startBooking,
      duration,
      locationId
    );
    if (!chosen.error) {
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
        res
          .status(201)
          .json({ error: false, message: "Booking was successful" });
      }
    } else {
      res.status(500).json({ error: true, message: chosen.message });
    }
  } else {
    res.status(500).json({ error: true, message: "Failed to add booking." });
  }
};
