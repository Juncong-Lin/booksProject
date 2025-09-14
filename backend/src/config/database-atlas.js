const mongoose = require("mongoose");

let isMongoDBConnected = false;

const connectDB = async () => {
  try {
    // Set up connection options optimized for Atlas with network issues
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 75000, // 75 seconds
      connectTimeoutMS: 30000, // 30 seconds
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      waitQueueTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
    };

    console.log("Attempting to connect to MongoDB...");
    console.log("MongoDB URI:", process.env.MONGODB_URI ? "Set" : "Not set");

    // Parse and log connection details (without password)
    if (process.env.MONGODB_URI) {
      try {
        const uriParts = process.env.MONGODB_URI.split("@");
        if (uriParts.length > 1) {
          const hostPart = uriParts[1].split("/")[0];
          console.log("MongoDB Host(s):", hostPart);

          // Check if using SRV format
          if (process.env.MONGODB_URI.includes("mongodb+srv://")) {
            console.log("⚠️  Using SRV format - may have DNS issues");
            console.log(
              "💡 Consider using standard connection format if connection fails"
            );
          } else {
            console.log("✅ Using standard connection format");
          }
        }
      } catch (parseError) {
        console.log("Could not parse URI for logging");
      }
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState}`);
    console.log(
      `🌐 Connection Type: ${conn.connection.name === "test" ? "In-Memory" : "Atlas"}`
    );
    isMongoDBConnected = true;

    // Handle connection events with better logging
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
      if (err.message.includes("ETIMEOUT")) {
        console.log(
          "💡 Network timeout - check DNS, firewall, and IP whitelist"
        );
      }
      if (err.message.includes("queryTxt")) {
        console.log(
          "💡 DNS TXT query failed - try standard connection format instead of SRV"
        );
      }
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

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🔄 Gracefully shutting down...");
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log("📦 MongoDB connection closed");
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

    // Provide specific troubleshooting advice
    if (error.message.includes("ETIMEOUT")) {
      console.log("\n🔧 Troubleshooting ETIMEOUT error:");
      console.log("1. Check your internet connection");
      console.log(
        "2. Verify IP address is whitelisted in Atlas (0.0.0.0/0 for development)"
      );
      console.log(
        "3. Check if firewall is blocking MongoDB ports (27017-27019)"
      );
      console.log("4. Try using standard connection format instead of SRV");
    }

    if (error.message.includes("queryTxt")) {
      console.log("\n🔧 Troubleshooting DNS TXT error:");
      console.log("1. Your DNS provider may be blocking TXT queries");
      console.log(
        "2. Try using standard connection format instead of mongodb+srv://"
      );
      console.log(
        "3. Consider using VPN or different DNS server (8.8.8.8, 1.1.1.1)"
      );
    }

    console.log("🔄 Server will continue with mock storage for development...");

    isMongoDBConnected = false;
    return null;
  }
};

const isConnected = () => isMongoDBConnected;

module.exports = { connectDB, isConnected };
