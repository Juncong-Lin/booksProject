const User = require("../models/UserAdapter");
const { asyncHandler } = require("../middleware/errorHandler");
const jwt = require("jsonwebtoken");

// Helper function to set authentication cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Helper function to clear authentication cookies
const clearAuthCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};

// @desc    Register new user
// @route   POST /api/v1/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists with this email address",
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  // Generate tokens
  const accessToken = user.getSignedJwtToken();
  const refreshToken = user.getSignedRefreshToken();

  // Save refresh token to user
  await user.addRefreshToken(refreshToken);

  // Set cookies
  setAuthCookies(res, accessToken, refreshToken);

  // Update last login
  await user.updateLastLogin();

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    },
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/signin
// @access  Public
const signin = asyncHandler(async (req, res) => {
  const { email, password, rememberMe = false } = req.body;

  // Find user and include password for comparison
  const user = await User.findByEmailWithPassword(email);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // Check password
  const isPasswordMatch = await user.matchPassword(password);
  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // Generate tokens
  const accessToken = user.getSignedJwtToken();
  const refreshToken = user.getSignedRefreshToken();

  // Save refresh token to user
  await user.addRefreshToken(refreshToken);

  // Set cookies with appropriate expiration
  if (rememberMe) {
    setAuthCookies(res, accessToken, refreshToken);
  } else {
    // Session cookies (expire when browser closes)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, cookieOptions);
  }

  // Update last login
  await user.updateLastLogin();

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    },
  });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.refreshToken;
  const user = req.user;

  // Generate new tokens
  const newAccessToken = user.getSignedJwtToken();
  const newRefreshToken = user.getSignedRefreshToken();

  // Remove old refresh token and add new one
  await user.removeRefreshToken(oldRefreshToken);
  await user.addRefreshToken(newRefreshToken);

  // Set new cookies
  setAuthCookies(res, newAccessToken, newRefreshToken);

  res.status(200).json({
    success: true,
    message: "Tokens refreshed successfully",
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const user = req.user;
  let refreshToken = null;

  // Get refresh token from cookies or body
  if (req.cookies && req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  } else if (req.body && req.body.refreshToken) {
    refreshToken = req.body.refreshToken;
  }

  // Remove refresh token from user if provided
  if (refreshToken) {
    await user.removeRefreshToken(refreshToken);
  }

  // Clear cookies
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
});

// @desc    Logout from all devices
// @route   POST /api/v1/auth/logout-all
// @access  Private
const logoutAll = asyncHandler(async (req, res) => {
  const user = req.user;

  // Remove all refresh tokens
  await user.removeAllRefreshTokens();

  // Clear cookies
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "User logged out from all devices successfully",
  });
});

// @desc    Get current user info
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      user: user.toSafeObject(),
    },
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = ["name", "email", "phone", "address", "preferences"];
  const updates = {};

  // Filter allowed updates
  Object.keys(req.body).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Check if email is being changed and if it's already in use
  if (updates.email && updates.email !== req.user.email) {
    const existingUser = await User.findByEmail(updates.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email address is already in use",
      });
    }
  }

  // Update user
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: user.toSafeObject(),
    },
  });
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select("+password");

  // Check current password
  const isCurrentPasswordMatch = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordMatch) {
    return res.status(400).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Remove all refresh tokens (force re-login on all devices)
  await user.removeAllRefreshTokens();

  // Clear cookies
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Password changed successfully. Please log in again.",
  });
});

// @desc    Verify token (for client-side authentication checks)
// @route   GET /api/v1/auth/verify
// @access  Private
const verifyToken = asyncHandler(async (req, res) => {
  // If middleware passed, token is valid
  res.status(200).json({
    success: true,
    message: "Token is valid",
    data: {
      user: req.user.toSafeObject(),
    },
  });
});

module.exports = {
  signup,
  signin,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword,
  verifyToken,
};
