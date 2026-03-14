const express = require("express");
const {
  signupController,
  loginController,
  logoutController,
  requestPasswordResetController,
  resetPasswordController,
  verifyOtpController,
  getCurrentUserController,
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PUBLIC ROUTES
 */

// POST /api/auth/signup - Register new user
router.post("/signup", signupController);

// POST /api/auth/login - Login user
router.post("/login", loginController);

// POST /api/auth/forgot-password - Request password reset (OTP sent to email)
router.post("/forgot-password", requestPasswordResetController);

// POST /api/auth/verify-otp - Verify OTP from email
router.post("/verify-otp", verifyOtpController);

// POST /api/auth/reset-password - Reset password with OTP
router.post("/reset-password", resetPasswordController);

/**
 * PROTECTED ROUTES
 */

// GET /api/auth/me - Get current user (requires auth)
router.get("/me", authMiddleware, getCurrentUserController);

// POST /api/auth/logout - Logout user (requires auth)
router.post("/logout", authMiddleware, logoutController);

module.exports = router;
