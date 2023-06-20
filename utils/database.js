const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

const mysql = require('mysql2');

const pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	database: 'locks-layers',
	password: 'gioia33' // choose whatever
})

// to handle async tasks use promise chains instead of nested callbacks
exports.sqlDb = pool.promise();

let _db;

const mongoConnect = (callback) => {
	MongoClient.connect('mongodb+srv://samrawit:coiG9ZHpcSjS2jw9@locks-layers-mobile.lhmpmr9.mongodb.net/?retryWrites=true&w=majority') //check username & password are correct
		.then(client => {
			_db = client.db(); //can pass string of DB you want to connect to [overwrites SRV]
			callback()
		})
		.catch(err => {
			console.log(err)
			throw err
		});
}

const getDb = () => {
	if (_db) {
		return _db;
	}
	throw 'No database found!';
}

exports.mongoConnect = mongoConnect; // crates first connection
exports.getDb = getDb; // allows access to db without reconencting each time

// in models/modelName,js
// const getDb = require('../utils/database').getDb

// in model's class
// save() {
// 	const db = getDb();
// 	return db.collection('items').insertOne(this)
// 		.then()
// 		.catch();
// }