const { validationResult } = require("express-validator"); // TODO: add validation
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { getLocationCityById } = require("./location");
const getDb = require("../utils/database").getDb;

// const User = require("../models/user").User;
// const AdminUser = require("../models/user").AdminUser;

const createToken = (extraData = {}) => {
  return jwt.sign(extraData, process.env.JWT_KEY, { expiresIn: "1h" });
};

exports.adminRegistration = (req, res, next) => {
  const userName = req.body.userName;
  const password = req.body.password;

  bcrypt
    .hash(password, 12)
    .then((hashedPW) => {
      // Store hashedPW in database
      getDb()
        .db()
        .collection("admins") // TODO: change to admin users
        .insertOne({
          userName: userName,
          password: hashedPW,
        })
        .then((result) => {
          console.log(result);
          const token = createToken();
          res.status(201).json({ token: token, user: { userName: userName } });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ message: "Creating the user failed." });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Creating the user failed." });
    });
};

exports.adminLogin = (req, res, next) => {
  const userName = req.body.userName;
  const password = req.body.password;
  // console.log({ req });
  let loadedUser;
  getDb()
    .db()
    .collection("admins")
    .findOne({ userName: userName })
    .then((userDoc) => {
      console.log({ userDoc });
      if (!userDoc) {
        const error = new Error("Wrong username");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = userDoc;
      return bcrypt.compare(password, userDoc.password);
    })
    .then((isEqual) => {
      console.log({ isEqual });
      if (!isEqual) {
        throw Error();
      }
      const token = createToken({ userId: loadedUser._id.toString() });
      // console.log({ [`${userName}`]: loadedUser._id.toString(), token });
      res.status(200).json({
        message: "Authentication succeeded.",
        token: token,
        userId: loadedUser._id.toString(),
      });
    })
    .catch((err) => {
      console.log({ err });
      // if (!err.statusCode) {
      //   err.statusCode = 500;
      // }
      // next(err);
      res.status(401).json({
        message: "Authentication failed, invalid username or password.",
      });
    });
};

exports.userRegistration = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  const tel = req.body.tel;
  const location = req.body.location;

  const errors = validationResult(req);
  console.log({ errs: errors.array() });
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "The data you entered is not valid",
      errorList: errors.array(),
    });
  }

  // getDb()
  //   .db()
  //   .collection("users")
  //   .findOne({ email: email })
  //   .then((user) => {
  //     if (user) {
  //       return res.status(409).json({
  //         message: "Email already exists",
  //       });
  //     } else {
  bcrypt
    .hash(password, 12)
    .then((hashedPW) => {
      // Store hashedPW in database
      getDb()
        .db()
        .collection("users")
        .insertOne({
          email: email,
          password: hashedPW,
          name: name,
          tel: tel,
          favLocation: location,
        })
        .then((result) => {
          console.log(result);
          res.status(201).json({ user: { email: email, name: name } });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ message: "Creating the user failed." });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Creating the user failed." });
    });
  // }
  // });
};

// exports.loadUserData = (req, res, next) => {
//   getDb()
//     .db()
//     .collection("users")
//     .findOne({ userName: email }) // TODO: change to email
//     .then((userDoc) => {
//       console.log({ userDoc });
//       if (!userDoc) {
//         const error = new Error("Wrong email");
//         error.statusCode = 401;
//         throw error;
//       }
//       loadedUser = userDoc;
//       res.status(200).json({
//         message: "User found.",
//         user: {
//           id: loadedUser._id.toString(),
//           email: loadedUser.email,
//           name: loadedUser.name,
//         },
//       });
//     })
//     .catch((err) => {
//       res.status(401).json({
//         message: "Loaded not found.",
//       });
//     });
// };

exports.userLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  console.log({ email, password });
  getDb()
    .db()
    .collection("users")
    .findOne({ email: email })
    .then((userDoc) => {
      console.log({ userDoc });
      if (!userDoc) {
        const error = new Error("Wrong email");
        error.statusCode = 401;
        throw error;
      }
      console.log({ userDoc });
      loadedUser = userDoc;
      return bcrypt.compare(password, userDoc.password);
    })
    .then((isEqual) => {
      console.log({ isEqual });
      if (!isEqual) {
        throw Error();
      }
      const token = createToken({
        email: email,
        userId: loadedUser._id.toString(),
      });
      res.status(200).json({
        message: "Authentication succeeded.",
        token: token,
        user: {
          id: loadedUser._id.toString(),
          email: loadedUser.email,
          name: loadedUser.name,
        },
      });
    })
    .catch((err) => {
      console.log({ err });
      // if (!err.statusCode) {
      //   err.statusCode = 500;
      // }
      // next(err);
      res.status(401).json({
        message: "Authentication failed, invalid username or password.",
      });
    });
};

exports.getUserData = async (req, res, next) => {
  const userId = req.params.userId;
  console.log({ userId });
  const userRes = await getDb()
    .db()
    .collection("users")
    .findOne({ _id: new ObjectId(userId) });
  if (userRes) {
    const { password, ...userData } = userRes;
    console.log({ userData });
    const favLocation = await getLocationCityById(userData.favLocation);
    if (favLocation) {
      console.log({ favLocation });
      res.status(200).json({
        error: false,
        userData: { ...userData, favLocation: favLocation[0][0].city },
      });
    }
  } else {
    res.status(500).json({ error: true, message: "User does not exist" });
  }
};
