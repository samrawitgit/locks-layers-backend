const sqlDb = require("../utils/database").sqlDb;
const getDb = require("../utils/database").getDb;

exports.getAllBookingsByLoc = (req, res, next) => {
  const locationId = req.params.locationId;
  let bookingData;
  let usersData = {};
  sqlDb
    .execute(
      `SELECT b.id_user, b.booking_date, s.service_type, s.duration, st.name AS staff_name, st.surname AS staff_surname, l.city, l.tot_work_stations FROM bookings AS b
        INNER JOIN services AS s ON b.id_service = s.id
        INNER JOIN staff AS st ON st.id = b.id_staff
        INNER JOIN locations AS l ON l.id = b.id_location
        WHERE b.id_location = ?;`,
      [locationId]
    )
    .then((result) => {
      bookingData = result[0];
      const userIds = result[0].map((res) => res.id_user);
      getDb()
        .db()
        .collection("users")
        .find({})
        .forEach((userData) => {
          if (userIds.includes(userData._id.toString())) {
            usersData[userData._id.toString()] = {
              userName: userData.userName,
              name: userData.name,
              surname: userData.surname,
            };
            bookingData
              .filter((b) => b.id_user === userData._id.toString())
              .forEach((currB) => {
                if (currB.id_user === userData._id.toString()) {
                  currB.user = {
                    userName: userData.userName,
                    name: userData.name,
                    surname: userData.surname,
                  };
                }
                return currB;
              });
          }
        })
        .then((data) => {
          // console.log({
          //   usersData,
          //   bookingData,
          //   userData: bookingData[0].user,
          // });
          res.status(200).json({ data: { bookingData } });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Failed to fetch bookings." });
    });
};
