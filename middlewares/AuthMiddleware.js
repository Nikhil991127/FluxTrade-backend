const UsersModel = require("../models/UsersModel");
require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.userVerification = async (req, res) => {
  try {
    // ✅ Accept token from either cookie OR Authorization header
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.json({ success: false, message: "No token provided" });
    }

    // ✅ Verify token
    console.log("🧾 TOKEN_KEY used for verifying:", process.env.TOKEN_KEY);

    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    const user = await UsersModel.findById(decoded.id).select("fullName email");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // ✅ Return user info properly
    return res.json({
      success: true,
      user: {
        username: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Verification error:", error.message);
    return res.json({ success: false, message: "Invalid or expired token" });
  }
};