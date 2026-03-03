const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

/**
 * 🔐 Trust Proxy (Render / Netlify Safe)
 */
app.set("trust proxy", 1);

/**
 * 🔐 Security Headers
 */
app.use(helmet());

/**
 * 🌍 CORS Configuration (Dev + Production Safe)
 */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/**
 * 📦 Body Parser (Prevent Memory Crash)
 */
app.use(
  express.json({
    limit: process.env.MAX_JSON_SIZE || "10kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.MAX_JSON_SIZE || "10kb",
  })
);

/**
 * 🚦 Rate Limiters (Professional Setup)
 */

// General API limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 5000,
  message: "Too many requests. Please try again later.",
});

// Auth limiter (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts. Try again later.",
});

// AI streaming limiter
const ragLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 30 : 1000,
  message: "Too many AI requests. Slow down.",
});

/**
 * 🚀 Apply Route-Based Limiters
 */
app.use("/api/auth", authLimiter);
app.use("/api/rag", ragLimiter);
app.use("/api", generalLimiter);

/**
 * 🚀 API Routes
 */
app.use("/api", routes);

/**
 * 🏠 Root Route
 */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to RAG Chatbot API 🚀",
    environment: process.env.NODE_ENV || "development",
  });
});

/**
 * ❌ 404 Handler
 */
app.use((req, res, next) => {
  const error = new Error(`Can't find ${req.originalUrl} on this server`);
  error.statusCode = 404;
  next(error);
});

/**
 * 🛑 Global Error Middleware
 */
app.use(errorMiddleware);

module.exports = app;