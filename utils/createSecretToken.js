require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.createSecretToken = (id) => {
  console.log("🔐 TOKEN_KEY used for signing:", process.env.TOKEN_KEY);
  return jwt.sign({ id }, process.env.TOKEN_KEY, {
    expiresIn: 3 * 24 * 60 * 60, // 3 days
  });
};
