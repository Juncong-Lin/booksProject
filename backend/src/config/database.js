const mongoose = require("mongoose");

let isMongoDBConnected = false;

const connectDB = async () => {
  try {
    // Set up connection options optimized for Atlas
    const options = {
      serverSelectionTimeoutMS: 30000, // Increase timeout for Atlas
      socketTimeoutMS: 75000, // Increase socket timeout
      connectTimeoutMS: 30000, // Increase connection timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain minimum of 1 socket connection
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      waitQueueTimeoutMS: 10000, // Wait timeout for connection pool
      heartbeatFrequencyMS: 10000, // Heartbeat frequency
      retryWrites: true, // Retry writes on network errors
    };

    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", process.env.MONGODB_URI ? "Set" : "Not set");

    // Add more detailed URI logging for debugging (without password)
    if (process.env.MONGODB_URI) {
      const uriParts = process.env.MONGODB_URI.split("@");
      if (uriParts.length > 1) {
        console.log("MongoDB Host:", uriParts[1].split("/")[0]);
      }
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState}`);
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
    console.error("Error details:", {
      name: error.name,
      code: error.code,
      codeName: error.codeName,
    });
    console.log("🔄 Server will continue with mock storage for development...");

    isMongoDBConnected = false;
    return null;
  }
};

const isConnected = () => isMongoDBConnected;

module.exports = { connectDB, isConnected };
