const jwt = require("jsonwebtoken");
const User = require("../modules/auth/auth.model"); // adjust path if needed

const authMiddleware = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      const error = new Error("JWT secret not configured");
      error.statusCode = 500;
      throw error;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error("Authorization token missing");
      error.statusCode = 401;
      throw error;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      const error = new Error("Token not provided");
      error.statusCode = 401;
      throw error;
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        const error = new Error("Token expired. Please login again.");
        error.statusCode = 401;
        throw error;
      }

      const error = new Error("Invalid token. Please login again.");
      error.statusCode = 401;
      throw error;
    }

    // 🔥 Check if user still exists
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      const error = new Error("User no longer exists");
      error.statusCode = 401;
      throw error;
    }

    req.user = user;

    next();
  } catch (error) {
    next(error); // 🔥 send to global error middleware
  }
};

module.exports = authMiddleware;