const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

// MySQL

const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.SQL_HOST || "localhost",
  user: process.env.SQL_USER || "root",
  port: "3306",
  database: process.env.SQL_NAME,
  password: process.env.SQL_PASSWORD, // choose whatever
});

// to handle async tasks use promise chains instead of nested callbacks
exports.sqlDb = pool.promise();

// MongoDb

const MongoDbUrl =
  // "mongodb+srv://samrawit:coiG9ZHpcSjS2jw9@locks-layers-mobile.lhmpmr9.mongodb.net/salon";
  `mongodb+srv://${process.env.MDB_USER}:${process.env.MDB_PASSWORD}@${process.env.MDB_NAME}.lhmpmr9.mongodb.net/salon?retryWrites=true&w=majority`;

let _db;

const initDb = (callback) => {
  if (_db) {
    console.log("Db already initialized");
    return callback(null, _db);
  }
  MongoClient.connect(MongoDbUrl)
    .then((client) => {
      _db = client;
      console.log("client connected");
      callback(null, _db);
    })
    .catch((err) => {
      callback(err);
    });
};

const getDb = () => {
  if (!_db) {
    throw Error("Database not initialzed");
  }
  return _db;
};

exports.initDb = initDb; // crates first connection
exports.getDb = getDb; // allows access to db without reconencting each time
