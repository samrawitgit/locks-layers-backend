const express = require("express");
const { check, body } = require("express-validator");

const User = require("../models/user").User;
const authController = require("../controllers/auth");
// const isAuth = require("../middleware/is-auth");

const router = express.Router();

// router.put(
//   '/signup',
//   [
//     body('email')
//       .isEmail()
//       .withMessage('Please enter a valid email.')
//       .custom((value, { req }) => {
//         return User.findOne({ email: value }).then(userDoc => {
//           if (userDoc) {
//             return Promise.reject('E-Mail address already exists!');
//           }
//         });
//       })
//       .normalizeEmail(),
//     body('password')
//       .trim()
//       .isLength({ min: 5 }),
//     body('name')
//       .trim()
//       .not()
//       .isEmpty()
//   ],
//   authController.signup
// );

router.post("/admin-login", authController.adminLogin);
router.post("/admin-signup", authController.adminRegistration);
router.post("/login", authController.userLogin);
router.post("/signup", authController.userRegistration);

router.get("/user/:userId", authController.getUserData);

// router.post('/login', authController.login);

// router.get('/status', isAuth, authController.getUserStatus);

// router.patch(
//   '/status',
//   isAuth,
//   [
//     body('status')
//       .trim()
//       .not()
//       .isEmpty()
//   ],
//   authController.updateUserStatus
// );

module.exports = router;
