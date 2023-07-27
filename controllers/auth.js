const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const getDb = require("../utils/database").getDb;

const User = require("../models/user").User;
const AdminUser = require("../models/user").AdminUser;

// exports.signup = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     const error = new Error("Validation failed.");
//     error.statusCode = 422;
//     error.data = errors.array();
//     throw error;
//   }
//   const email = req.body.email;
//   const name = req.body.name;
//   const password = req.body.password;
//   bcrypt
//     .hash(password, 12)
//     .then((hashedPw) => {
//       const user = new User({
//         email: email,
//         password: hashedPw,
//         name: name,
//       });
//       return user.save();
//     })
//     .then((result) => {
//       res.status(201).json({ message: "User created!", userId: result._id });
//     })
//     .catch((err) => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     });
// };

const createToken = (extraData = {}) => {
  return jwt.sign(extraData, "secret", { expiresIn: "1h" });
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

  getDb()
    .db()
    .collection("users")
    .findOne({ userName: email }) // TODO: change to email
    .then((user) => {
      if (user) {
        return res.status(409).json({
          message: "Email exists",
        });
      } else {
        bcrypt
          .hash(password, 12)
          .then((hashedPW) => {
            // Store hashedPW in database
            getDb()
              .db()
              .collection("users")
              .insertOne({
                userName: email,
                password: hashedPW,
                name: name,
              })
              .then((result) => {
                console.log(result);
                res.status(201).json({ user: { email: email, name: name } }); // TODO: change to email
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
      }
    });
};

exports.userLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  console.log({ email, password });
  getDb()
    .db()
    .collection("users")
    .findOne({ userName: email }) // TODO: change to email
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
    res.status(200).json({ error: false, userData: userData });
  } else {
    res.status(500).json({ error: true, message: "User does not exist" });
  }
};

// exports.login = (req, res, next) => {
//   const email = req.body.email;
//   const password = req.body.password;
//   let loadedUser;
//   User.findOne({ email: email })
//     .then((user) => {
//       if (!user) {
//         const error = new Error("A user with this email could not be found.");
//         error.statusCode = 401;
//         throw error;
//       }
//       loadedUser = user;
//       return bcrypt.compare(password, user.password);
//     })
//     .then((isEqual) => {
//       if (!isEqual) {
//         const error = new Error("Wrong password!");
//         error.statusCode = 401;
//         throw error;
//       }
//       const token = jwt.sign(
//         {
//           email: loadedUser.email,
//           userId: loadedUser._id.toString(),
//         },
//         "somesupersecretsecret",
//         { expiresIn: "1h" }
//       );
//       res.status(200).json({ token: token, userId: loadedUser._id.toString() });
//     })
//     .catch((err) => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     });
// };

// exports.getUserStatus = (req, res, next) => {
//   User.findById(req.userId)
//     .then((user) => {
//       if (!user) {
//         const error = new Error("User not found.");
//         error.statusCode = 404;
//         throw error;
//       }
//       res.status(200).json({ status: user.status });
//     })
//     .catch((err) => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     });
// };

// exports.updateUserStatus = (req, res, next) => {
//   const newStatus = req.body.status;
//   User.findById(req.userId)
//     .then((user) => {
//       if (!user) {
//         const error = new Error("User not found.");
//         error.statusCode = 404;
//         throw error;
//       }
//       user.status = newStatus;
//       return user.save();
//     })
//     .then((result) => {
//       res.status(200).json({ message: "User updated." });
//     })
//     .catch((err) => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     });
// };
