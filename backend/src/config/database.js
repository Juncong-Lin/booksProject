const mongoose = require("mongoose");

let isMongoDBConnected = false;

const connectDB = async () => {
  try {
    // Set up connection options
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", process.env.MONGODB_URI ? "Set" : "Not set");

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    isMongoDBConnected = true;

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
      isMongoDBConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
      isMongoDBConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconnected");
      isMongoDBConnected = true;
    });

    return conn;
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    console.log("🔄 Server will continue with mock storage for development...");

    isMongoDBConnected = false;
    return null;
  }
};

const isConnected = () => isMongoDBConnected;

module.exports = { connectDB, isConnected };
