const express = require("express");
const bodyParser = require("body-parser");
const sqlDb = require("./utils/database").sqlDb;
// const mongoConnect = require("./utils/database").mongoConnect;
const initDb = require("./utils/database").initDb;

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const bookingsRoutes = require("./routes/bookings");
const salonRoutes = require("./routes/salon");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // application/json

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // list of domains allowed, '*' allows everything, it's a wildcard
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Accept, Authorization, Content-Type, X-Requested-With, Range"
  ); // allows to set headers
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/", bookingsRoutes);

// Route to handle improper paths (catch all route)
// app.use((req, res, next) => {
//   res.status(404).send("<h1>Page not found</h1<");
// });

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

// sqlDb.execute('SELECT day_of_week FROM days_of_week WHERE day_of_week > 4')
// 	.then(result => {
// 		const days = result[0].map((item, id) => { console.log(item, id); return item.day_of_week })
// 		console.log(result[0], days)
// 	})
// 	.catch(err => console.log(err));

// app.listen(8080); //, "192.168.1.121"

initDb((err, db) => {
  if (err) {
    console.log(err);
  } else {
    console.log("connected");
    app.listen(8080); //, "192.168.1.121"
  }
});

// app.listen(8080); // in production no need to pass a port
