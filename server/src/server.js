require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

/**
 * 🔥 HANDLE UNCAUGHT EXCEPTIONS (Sync Errors)
 * Example: undefined variable, coding mistake
 */
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

/**
 * 🔥 CONNECT DATABASE FIRST
 * If DB fails → do not start server
 */
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ Database connected successfully");

    const server = app.listen(PORT, () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
      );
    });

    /**
     * 🔥 HANDLE UNHANDLED PROMISE REJECTIONS
     * Example: Failed API call, DB rejection
     */
    process.on("unhandledRejection", (err) => {
      console.error("💥 UNHANDLED REJECTION! Shutting down...");
      console.error(err.name, err.message);

      server.close(() => {
        process.exit(1);
      });
    });

    /**
     * 🔥 GRACEFUL SHUTDOWN (Render Safe)
     */
    process.on("SIGTERM", () => {
      console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
      server.close(() => {
        console.log("💥 Process terminated!");
      });
    });

  } catch (error) {
    console.error("❌ Failed to connect to Database");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();