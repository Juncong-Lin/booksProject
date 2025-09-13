const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database (excluding password)
      const user = await User.findById(decoded.id).select(
        "-password -refreshTokens"
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Access denied. User not found.",
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (tokenError) {
      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access token expired.",
          code: "TOKEN_EXPIRED",
        });
      } else if (tokenError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid access token.",
        });
      } else {
        throw tokenError;
      }
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
};

// Middleware to check if user has specific role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please authenticate first.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

// Middleware to verify refresh token
const verifyRefreshToken = async (req, res, next) => {
  try {
    let refreshToken;

    // Check for refresh token in cookies
    if (req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    }
    // Check for refresh token in body
    else if (req.body && req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
    }

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not provided.",
      });
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Find user with this refresh token
      const user = await User.findByRefreshToken(refreshToken);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token.",
        });
      }

      // Add user and refresh token to request object
      req.user = user;
      req.refreshToken = refreshToken;
      next();
    } catch (tokenError) {
      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Refresh token expired.",
          code: "REFRESH_TOKEN_EXPIRED",
        });
      } else if (tokenError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid refresh token.",
        });
      } else {
        throw tokenError;
      }
    }
  } catch (error) {
    console.error("Refresh token verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during token verification.",
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database (excluding password)
        const user = await User.findById(decoded.id).select(
          "-password -refreshTokens"
        );

        if (user) {
          req.user = user;
        }
      } catch (tokenError) {
        // Ignore token errors in optional auth
        console.log("Optional auth token error:", tokenError.message);
      }
    }

    next();
  } catch (error) {
    console.error("Optional authentication error:", error);
    next(); // Continue even if there's an error
  }
};

module.exports = {
  authenticate,
  authorize,
  verifyRefreshToken,
  optionalAuth,
};
