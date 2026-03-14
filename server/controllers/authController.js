const {
  signup,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
  verifyOtp,
} = require("../services/authService");

/**
 * SIGNUP CONTROLLER
 */
const signupController = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        error: "Missing required fields (name, email, password, confirmPassword)" 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Call signup service
    const result = await signup(name, email, password);

    if (!result.success) {
      return res.status(400).json({ 
        error: result.error || "Signup failed",
        errors: result.errors 
      });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

/**
 * LOGIN CONTROLLER
 */
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Call login service
    const result = await login(email, password);

    if (!result.success) {
      return res.status(401).json({ error: result.error || "Login failed" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

/**
 * LOGOUT CONTROLLER
 */
const logoutController = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ error: "No token provided" });
    }

    // Call logout service
    const result = await logout(token);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * REQUEST PASSWORD RESET CONTROLLER
 */
const requestPasswordResetController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Call request password reset service
    const result = await requestPasswordReset(email);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Request password reset error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * RESET PASSWORD CONTROLLER
 */
const resetPasswordController = async (req, res) => {
  try {
    const { otp, newPassword, confirmPassword } = req.body;

    // Validate inputs
    if (!otp) {
      return res.status(400).json({ error: "OTP is required" });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: "Password fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Call reset password service
    const result = await resetPassword(otp, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * VERIFY OTP CONTROLLER
 */
const verifyOtpController = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: "OTP is required" });
    }

    const result = await verifyOtp(otp);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET CURRENT USER CONTROLLER
 */
const getCurrentUserController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  signupController,
  loginController,
  logoutController,
  requestPasswordResetController,
  resetPasswordController,
  verifyOtpController,
  getCurrentUserController,
};
