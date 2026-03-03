if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

/**
 * 🔥 HANDLE UNCAUGHT EXCEPTIONS (Sync Errors)
 */
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

/**
 * 🔥 CONNECT DATABASE FIRST
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