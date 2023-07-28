const express = require("express");
const { body } = require("express-validator");

// const User = require("../models/user").User;
const authController = require("../controllers/auth");
const { getDb } = require("../utils/database");
// const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.post(
  "/admin-login",
  [body("userName").escape(), body("password").escape()],
  authController.adminLogin
);
// router.post("/admin-signup", authController.adminRegistration); // ONLY used in development

router.post(
  "/login",
  [body("email").escape(), body("password").escape()],
  authController.userLogin
);
router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return getDb()
          .db()
          .collection("users")
          .findOne({ email: value })
          .then((user) => {
            if (user) {
              return Promise.reject("Email already exists");
            }
          });
      })
      .normalizeEmail()
      .escape(),
    body("password", "Please enter a password of at least 5 characters.")
      .isLength({ min: 5 })
      .trim()
      .escape(),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Passwords have to match!");
        }
        return true;
      })
      .escape(),
    body("tel").isMobilePhone().escape(),
    body("location").escape(),
  ],
  authController.userRegistration
);

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

module.exports = router;
