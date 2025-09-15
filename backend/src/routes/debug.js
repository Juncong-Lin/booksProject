const express = require("express");
const jwt = require("jsonwebtoken");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

// Debug endpoint to check JWT configuration
// @route   GET /api/v1/debug/jwt
router.get(
  "/jwt",
  asyncHandler(async (req, res) => {
    const jwtExpire = process.env.JWT_EXPIRE;
    const jwtRefreshExpire = process.env.JWT_REFRESH_EXPIRE;
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    // Test our validation logic
    let accessExpiresIn = 900; // Default fallback
    let refreshExpiresIn = 604800; // Default fallback

    if (jwtExpire) {
      const strValue = String(jwtExpire).trim();
      if (/^\d+$/.test(strValue)) {
        const numValue = parseInt(strValue, 10);
        if (numValue > 0 && numValue < 31536000) {
          accessExpiresIn = numValue;
        }
      } else if (/^\d+[smhd]$/.test(strValue)) {
        accessExpiresIn = strValue;
      }
    }

    if (jwtRefreshExpire) {
      const strValue = String(jwtRefreshExpire).trim();
      if (/^\d+$/.test(strValue)) {
        const numValue = parseInt(strValue, 10);
        if (numValue > 0 && numValue < 31536000) {
          refreshExpiresIn = numValue;
        }
      } else if (/^\d+[smhd]$/.test(strValue)) {
        refreshExpiresIn = strValue;
      }
    }

    // Test JWT generation
    let accessTokenTest = "FAILED";
    let refreshTokenTest = "FAILED";

    try {
      jwt.sign({ test: true }, jwtSecret || "fallback-secret", {
        expiresIn: accessExpiresIn,
      });
      accessTokenTest = "SUCCESS";
    } catch (error) {
      accessTokenTest = `FAILED: ${error.message}`;
    }

    try {
      jwt.sign({ test: true }, jwtRefreshSecret || "fallback-secret", {
        expiresIn: refreshExpiresIn,
      });
      refreshTokenTest = "SUCCESS";
    } catch (error) {
      refreshTokenTest = `FAILED: ${error.message}`;
    }

    res.json({
      success: true,
      environment: process.env.NODE_ENV,
      jwt_config: {
        JWT_EXPIRE: {
          raw: jwtExpire,
          type: typeof jwtExpire,
          processed: accessExpiresIn,
          test: accessTokenTest,
        },
        JWT_REFRESH_EXPIRE: {
          raw: jwtRefreshExpire,
          type: typeof jwtRefreshExpire,
          processed: refreshExpiresIn,
          test: refreshTokenTest,
        },
        JWT_SECRET: jwtSecret ? "SET" : "NOT SET",
        JWT_REFRESH_SECRET: jwtRefreshSecret ? "SET" : "NOT SET",
      },
      timestamp: new Date().toISOString(),
    });
  })
);

module.exports = router;
