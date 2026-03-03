const errorMiddleware = (err, req, res, next) => {
  console.error("💥 ERROR:", err);

  // Default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // 🔥 MongoDB Cast Error (Invalid ObjectId)
  if (err.name === "CastError") {
    err.statusCode = 400;
    err.message = `Invalid ${err.path}: ${err.value}`;
  }

  // 🔥 MongoDB Duplicate Key Error
  if (err.code === 11000) {
    err.statusCode = 400;
    err.message = `Duplicate field value entered`;
  }

  // 🔥 MongoDB Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(val => val.message);
    err.statusCode = 400;
    err.message = messages.join(", ");
  }

  // 🔥 JWT Invalid Token
  if (err.name === "JsonWebTokenError") {
    err.statusCode = 401;
    err.message = "Invalid token. Please login again.";
  }

  // 🔥 JWT Expired Token
  if (err.name === "TokenExpiredError") {
    err.statusCode = 401;
    err.message = "Your token has expired. Please login again.";
  }

  // 🔥 Gemini API / External API Error
  if (err.message && err.message.includes("quota")) {
    err.statusCode = 429;
    err.message = "AI quota exceeded. Please try again later.";
  }

  if (err.message && err.message.includes("API key")) {
    err.statusCode = 401;
    err.message = "Invalid AI API key configuration.";
  }

  // 🔥 Development Mode (Full Error)
  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  // 🔥 Production Mode (Clean Error)
  res.status(err.statusCode).json({
    success: false,
    message: err.message || "Something went wrong!",
  });
};

module.exports = errorMiddleware;