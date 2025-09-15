const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

// Import routes
const authRoutes = require("./src/routes/auth");
const userRoutes = require("./src/routes/users");
const bookRoutes = require("./src/routes/books");
const cartRoutes = require("./src/routes/cart");
const orderRoutes = require("./src/routes/orders");

// Import middleware
const { errorHandler } = require("./src/middleware/errorHandler");
// Use Atlas-optimized database configuration
const { connectDB } = require("./src/config/database-atlas");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Validate JWT environment variables
const validateJWTConfig = () => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  const jwtExpire = process.env.JWT_EXPIRE;
  const jwtRefreshExpire = process.env.JWT_REFRESH_EXPIRE;

  if (!jwtSecret || jwtSecret.length < 32) {
    console.warn("⚠️  JWT_SECRET is not set or too short. Using default.");
  }

  if (!jwtRefreshSecret || jwtRefreshSecret.length < 32) {
    console.warn(
      "⚠️  JWT_REFRESH_SECRET is not set or too short. Using default."
    );
  }

  // Validate JWT_EXPIRE format - improved validation
  if (jwtExpire && !/^(\d+[smhd]|\d+)$/.test(String(jwtExpire))) {
    console.warn(
      `⚠️  Invalid JWT_EXPIRE format: "${jwtExpire}". Should be like "15m", "1h", "7d", or number of seconds. Using default "15m".`
    );
  }

  // Validate JWT_REFRESH_EXPIRE format - improved validation
  if (jwtRefreshExpire && !/^(\d+[smhd]|\d+)$/.test(String(jwtRefreshExpire))) {
    console.warn(
      `⚠️  Invalid JWT_REFRESH_EXPIRE format: "${jwtRefreshExpire}". Should be like "15m", "1h", "7d", or number of seconds. Using default "7d".`
    );
  }

  console.log(
    `✅ JWT Config - Expire: ${jwtExpire || "15m"}, Refresh Expire: ${jwtRefreshExpire || "7d"}`
  );
};

validateJWTConfig();

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  process.env.FRONTEND_URL || "http://localhost:8080",
  "http://localhost:5500", // For VS Code Live Server
  "http://127.0.0.1:5500",
  // Production domains
  "https://juncongmall.com",
  "https://www.juncongmall.com",
  // Add your actual production domain here
  process.env.PRODUCTION_FRONTEND_URL,
];

// Filter out undefined values
const validOrigins = allowedOrigins.filter(
  (origin) => origin && origin !== undefined
);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (
        validOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Serve API tester (for development)
app.get("/test", (req, res) => {
  res.sendFile(__dirname + "/api-tester.html");
});

// Serve frontend files (for development)
app.use(express.static(path.join(__dirname, "..")));

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/books", bookRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);

// Handle 404 errors
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  mongoose.connection
    .close()
    .then(() => {
      console.log("MongoDB connection closed");
      process.exit(0);
    })
    .catch((err) => {
      console.log("Error closing MongoDB connection:", err.message);
      process.exit(1);
    });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  mongoose.connection
    .close()
    .then(() => {
      console.log("MongoDB connection closed");
      process.exit(0);
    })
    .catch((err) => {
      console.log("Error closing MongoDB connection:", err.message);
      process.exit(1);
    });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
🚀 Server running in ${process.env.NODE_ENV || "development"} mode
📍 Port: ${PORT}
🌍 Host: 0.0.0.0 (Railway compatible)
🔗 Health check: http://localhost:${PORT}/health
📊 API Base URL: http://localhost:${PORT}/api/v1
  `);
});

module.exports = app;
