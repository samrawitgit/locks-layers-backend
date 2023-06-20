const express = require("express");

const sqlDb = require("./utils/database").sqlDb;
const mongoConnect = require("./utils/database").mongoConnect;

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const salonRoutes = require("./routes/salon");

const app = express();

app.use(bodyParser.json()); // application/json

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // list of domains allowed, '*' allows everything, it's a wildcard
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // allows to set headers
  next();
});

app.use("/admin", adminRoutes);
// app.use("/auth", authRoutes);

// Route to handle improper paths (catch all route)
app.use((req, res, next) => {
  res.status(404).send("<h1>Page not found</h1<");
});

// app.use((error, req, res, next) => {
//   console.log(error);
//   const status = error.statusCode || 500;
//   const message = error.message;
//   const data = error.data;
//   res.status(status).json({ message: message, data: data });
// });

// sqlDb.execute('SELECT day_of_week FROM days_of_week WHERE day_of_week > 4')
// 	.then(result => {
// 		const days = result[0].map((item, id) => { console.log(item, id); return item.day_of_week })
// 		console.log(result[0], days)
// 	})
// 	.catch(err => console.log(err));

mongoConnect(() => {
  app.listen(5900);
});

// app.listen(5900); // in production no need to pass a port
