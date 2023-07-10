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
