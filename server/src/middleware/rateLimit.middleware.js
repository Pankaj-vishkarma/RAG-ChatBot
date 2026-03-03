const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // minutes → ms
  max: process.env.RATE_LIMIT_MAX || 50, // default 50 requests
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
  },

  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = limiter;