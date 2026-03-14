const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { validatePassword } = require("../utils/passwordValidator");
const { sendPasswordResetEmail, sendWelcomeEmail } = require("./emailService");
const crypto = require("crypto");
require("dotenv").config();

/**
 * SIGNUP SERVICE
 */
const signup = async (name, email, password) => {
  try {
    // Validate required fields
    if (!name || !email || !password) {
      return { success: false, error: "Name, email, and password are required" };
    }

    // Validate password strength
    const { isValid, errors } = validatePassword(password);
    if (!isValid) {
      return { success: false, errors };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // Send welcome email (non-blocking - don't fail signup if email fails)
    sendWelcomeEmail(email, name).catch((err) => {
      console.warn("Welcome email failed (non-blocking):", err.message);
    });

    return {
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * LOGIN SERVICE
 */
const login = async (email, password) => {
  try {
    // Validate inputs
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    // Check JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      return { success: false, error: "Server configuration error: JWT_SECRET not set" };
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    // Check if account is active
    if (!user.isActive) {
      return { success: false, error: "Account is disabled" };
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password" };
    }

    // Generate JWT
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || "7d",
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * LOGOUT SERVICE
 * With JWT, logout is handled client-side by removing the token
 * This endpoint is optional and can just return success
 */
const logout = async (token) => {
  try {
    // With JWT and no sessions, logout is client-side
    // Token simply becomes invalid when it expires
    return { success: true, message: "Logout successful. Token is now invalid." };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * REQUEST PASSWORD RESET
 */
const requestPasswordReset = async (email) => {
  try {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return {
        success: true,
        message: "If email exists, password reset link will be sent",
      };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        otpExpiry: otpExpiry,
      },
    });

    // Send email with OTP
    await sendPasswordResetEmail(email, otp, user.name);

    return {
      success: true,
      message: "OTP sent to your email",
    };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * RESET PASSWORD SERVICE
 */
const resetPassword = async (otp, newPassword) => {
  try {
    // Validate password strength
    const { isValid, errors } = validatePassword(newPassword);
    if (!isValid) {
      return { success: false, errors };
    }

    // Find user with valid OTP
    const user = await prisma.user.findFirst({
      where: { resetOtp: otp },
    });

    if (!user) {
      return { success: false, error: "Invalid OTP" };
    }

    // Check if OTP is expired
    if (new Date() > user.otpExpiry) {
      return { success: false, error: "OTP has expired" };
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(newPassword, salt);

    // Update password and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetOtp: null,
        otpExpiry: null,
      },
    });

    // Note: All existing JWT tokens will remain valid until their expiration
    // because we're not using sessions. You may want to set a new JWT expiry requirement
    // on the frontend (e.g., force re-login after password change)

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * VERIFY OTP SERVICE
 */
const verifyOtp = async (otp) => {
  try {
    const user = await prisma.user.findFirst({
      where: { resetOtp: otp },
    });

    if (!user) {
      return { success: false, error: "Invalid OTP" };
    }

    // Check if OTP is expired
    if (new Date() > user.otpExpiry) {
      return { success: false, error: "OTP has expired" };
    }

    return { success: true, email: user.email };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  signup,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
  verifyOtp,
};
