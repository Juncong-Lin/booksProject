const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let isMongoDBConnected = false;
let mongoServer = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    // If no MongoDB URI or localhost URI (which likely won't work), use in-memory database
    if (!mongoUri || mongoUri.includes("localhost:27017")) {
      console.log("🚀 Starting in-memory MongoDB for development...");
      mongoServer = await MongoMemoryServer.create({
        binary: {
          version: "6.0.0", // Use a stable version
        },
        instance: {
          dbName: "bookstore",
        },
      });
      mongoUri = mongoServer.getUri();
      console.log("📦 In-memory MongoDB URI:", mongoUri);
    }

    // Set up connection options
    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 75000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
    };

    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", mongoUri ? "Set" : "Not set");

    // Add more detailed URI logging for debugging (without password)
    if (mongoUri) {
      const uriParts = mongoUri.split("@");
      if (uriParts.length > 1) {
        console.log("MongoDB Host:", uriParts[1].split("/")[0]);
      } else {
        console.log("MongoDB Host: localhost (in-memory)");
      }
    }

    const conn = await mongoose.connect(mongoUri, options);

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

    // Handle process termination
    process.on("SIGINT", async () => {
      console.log("\n🔄 Gracefully shutting down...");
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log("📦 MongoDB connection closed");
      }
      if (mongoServer) {
        await mongoServer.stop();
        console.log("🛑 In-memory MongoDB stopped");
      }
      process.exit(0);
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
