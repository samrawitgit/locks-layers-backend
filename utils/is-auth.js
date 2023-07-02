const jwt = require("jsonwebtoken");

module.export = (req, res, next) => {
  const authHeaders = req.get("Authorization");
  if (!authHeaders) {
    const error = new Error("Not authenticated!");
    error.statusCode = 401;
    throw error;
  }
  const token = authHeader.slpit(" ")[1];
  let decodedToken;
  try {
    decodedTocken = jwt.verify(token, "secret");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error("Not authenticated!");
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};
