const express = require("express");
const {
  signup,
  signin,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword,
  verifyToken,
} = require("../controllers/authController");

const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
} = require("../middleware/validation");

const { authenticate, verifyRefreshToken } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/signup", validateRegistration, signup);
router.post("/signin", validateLogin, signin);
router.post("/refresh", verifyRefreshToken, refreshToken);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get("/me", getMe);
router.get("/verify", verifyToken);
router.post("/logout", logout);
router.post("/logout-all", logoutAll);
router.put("/profile", validateProfileUpdate, updateProfile);
router.put("/change-password", validatePasswordChange, changePassword);

module.exports = router;
