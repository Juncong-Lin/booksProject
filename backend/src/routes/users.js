const express = require("express");
const { authenticate, optionalAuth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/v1/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user.toSafeObject(),
    },
  });
});

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  // This will be implemented when we add the profile management
  res.status(200).json({
    success: true,
    message: "Profile update endpoint - to be implemented",
  });
});

// @desc    Delete user account
// @route   DELETE /api/v1/users/account
// @access  Private
const deleteUserAccount = asyncHandler(async (req, res) => {
  // This will be implemented when we add the profile management
  res.status(200).json({
    success: true,
    message: "Account deletion endpoint - to be implemented",
  });
});

// Routes
router.get("/profile", authenticate, getUserProfile);
router.put("/profile", authenticate, updateUserProfile);
router.delete("/account", authenticate, deleteUserAccount);

module.exports = router;
