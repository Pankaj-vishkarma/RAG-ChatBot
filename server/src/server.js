if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

/**
 * 🔥 HANDLE UNCAUGHT EXCEPTIONS
 */
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION!");
  console.error(err.name, err.message);
  console.error(err.stack);
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

    // Prevent hanging requests
    server.setTimeout(60000);

    /**
     * 🔥 HANDLE UNHANDLED PROMISE REJECTIONS
     */
    process.on("unhandledRejection", (err) => {
      console.error("💥 UNHANDLED REJECTION!");
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

    /**
     * 🔥 CTRL+C Shutdown (Local Dev Safe)
     */
    process.on("SIGINT", () => {
      console.log("👋 SIGINT RECEIVED. Shutting down gracefully");

      server.close(() => {
        console.log("💥 Server closed.");
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("❌ Failed to connect to Database");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();