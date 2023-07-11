const sqlDb = require("../utils/database").sqlDb;
const getDb = require("../utils/database").getDb;
const { ObjectId } = require("mongodb");

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

// exports.getServiceById = (req, res, next) => {
//   const type = req.params.type;
//   sqlDb
//     .execute(`SELECT * FROM services WHERE service_type=?`, [type])
//     .then((data) => {
//       console.log({ "service type": data });
//       return res.status(200).json({ type: data });
//     });
// };

// exports.addBooking = (req, res, next) => {
//   const userId = req.body.userId;
//   const service = req.body.service;
//   const location = req.body.location;
//   let serviceId;
//   let locationId;
//   sqlDb
//     .execute(`SELECT * FROM services WHERE service_type=?`, [service])
//     .then((data) => {
//       console.log({ "service type": data });
//       // return res.status(200).json({ type: data });
//       serviceId = data.id;
//     });
//   console.log({ serviceId });
//   // const staff = req.body.staff; TODO: assign randomly
//   const date = new Date();
// };
