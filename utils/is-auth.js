const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeaders = req.get("Authorization");
  if (!authHeaders) {
    // const error = new Error("Not authenticated!");
    // error.statusCode = 401;
    // throw error;
    res.status(401).json({ message: "Not authenticated" });
  }
  // console.log({ authHeaders });
  const token = authHeaders.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_KEY);
  } catch (err) {
    // err.statusCode = 500;
    // throw err;
    console.log({ err });
    res.status(500).json({ message: "Unable to verify user." });
  }
  // console.log({ decodedToken /* uI: decodedToken.userId */ });
  if (!decodedToken) {
    // const error = new Error("Not authenticated!");
    // error.statusCode = 401;
    // throw error;
    res.status(401).json({ message: "Not authenticated" });
  }
  // req.userId = decodedToken.userId;
  next();
};
