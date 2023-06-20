const express = require('express');

const router = express.Router();

router.get('/staff', (req, res, next) => {
	console.log('clicked')
	res.status(200).json({ staffList: ['Laura', 'Giorgio', 'Sara', 'Valerio', 'Paul'] })
})
// router.post('add-product', ...) // admin/add-product => POST

module.exports = router;
