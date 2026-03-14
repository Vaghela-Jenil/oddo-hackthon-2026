const nodemailer = require("nodemailer");
require("dotenv").config();

// Configure your email service here
// Example: Gmail, SendGrid, Mailtrap, etc.
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail", // or use SMTP settings
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD,
  },
});

/**
 * Send password reset email with OTP
 */
const sendPasswordResetEmail = async (email, otp, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "🔐 Password Reset OTP - Core Inventory",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password for your Core Inventory account.</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">
            ${otp}
          </div>
        </div>
        <p style="color: #666; text-align: center;">This OTP will expire in 15 minutes.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          If you didn't request this, please ignore this email. Your password will remain unchanged.
        </p>
        <p style="color: #999; font-size: 12px;">
          © Core Inventory System
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return { success: true, message: "OTP sent successfully" };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email after signup
 */
const sendWelcomeEmail = async (email, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome to Core Inventory! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Core Inventory!</h2>
        <p>Hi ${userName},</p>
        <p>Your account has been successfully created. You can now log in to start managing your inventory.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/login" 
             style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Go to Login
          </a>
        </div>
        <p style="color: #666; margin-top: 30px;">
          If you have any questions, feel free to reach out to our support team.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          © Core Inventory System
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent to:", email);
    return { success: true };
  } catch (error) {
    console.error("Welcome email error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
