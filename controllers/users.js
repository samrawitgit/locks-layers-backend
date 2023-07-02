const getDb = require('../utils/database').getDb;

exports.getUser = (req, res, next) => {
	mongoConnect.execute('SELECT day_of_week FROM days_of_week WHERE day_of_week > 4')
		.then(result => {
			const days = result[0].map((item, id) => { console.log(item, id); return item.day_of_week })
			console.log(result[0], days)
		})
		.catch(err => console.log(err));
}