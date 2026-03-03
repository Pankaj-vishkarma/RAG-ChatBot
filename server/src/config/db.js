const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is not defined in .env");
      process.exit(1);
    }

    // Prevent strictQuery warning
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10s timeout
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // 🔥 Listen for runtime errors
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB runtime error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB Disconnected");
    });

  } catch (error) {
    console.error("❌ DB Connection Failed:", error.message);
    process.exit(1); // Stop server if DB fails
  }
};

module.exports = connectDB;