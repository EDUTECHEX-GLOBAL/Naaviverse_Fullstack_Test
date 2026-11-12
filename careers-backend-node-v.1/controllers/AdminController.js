const bcrypt = require("bcrypt");
const Admin = require("../models/AdminModel");
const AdminUser = require("../Admin/models/AdminUserModel");
const { generateOTP, sendNotificationMail } = require("../middlewares/verifySignUp");
const { getOtpEmailContent } = require("../utils/otpEmailTemplate");

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    let admin = await Admin.findOne({ email: emailRegex });
    let isPasswordValid = false;

    if (admin) {
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } else {
      const adminUser = await AdminUser.findOne({ email: emailRegex });
      if (adminUser) {
        isPasswordValid = await adminUser.comparePassword(password);
      }
    }

    if (isPasswordValid) {
      res.status(200).json({ message: "Login successful" }); // Proceed with your session or token logic
    } else {
      res.status(400).json({ message: "Invalid email or password." });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    let admin = await Admin.findOne({ email: emailRegex });
    let isAdminUser = false;

    if (!admin) {
      admin = await AdminUser.findOne({ email: emailRegex });
      if (admin) isAdminUser = true;
    }

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "No admin account found with this email address. Please enter a registered email."
      });
    }

    const OTP = generateOTP();
    admin.OTP = OTP;
    admin.OTPCreatedTime = new Date();
    admin.resetOtpVerified = false;
    await admin.save();

    try {
      const { subject, html } = getOtpEmailContent({
        type: "user_forgot",
        otpCode: OTP,
        recipientName: "Super Admin",
        expiresIn: "10 minutes",
      });
      sendNotificationMail(cleanEmail, subject, html)
        .catch((mailErr) => console.error("Admin OTP mail error:", mailErr));
    } catch (mailErr) {
      console.error("Error generating admin OTP email:", mailErr);
    }

    return res.status(200).json({
      success: true,
      message: "Reset code sent successfully to your email."
    });
  } catch (error) {
    console.error("Error in admin forgotPassword:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, code, and new password are required." });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    let admin = await Admin.findOne({ email: emailRegex });
    let isAdminUser = false;

    if (!admin) {
      admin = await AdminUser.findOne({ email: emailRegex });
      if (admin) isAdminUser = true;
    }

    if (!admin) {
      return res.status(404).json({ success: false, message: "No admin account found with this email address." });
    }

    const cleanCode = (code || "").toString().trim();
    const isCodeMatch = admin.OTP && String(admin.OTP).trim() === cleanCode;

    if (!isCodeMatch && !admin.resetOtpVerified) {
      return res.status(400).json({ success: false, message: "Invalid OTP code. Please enter the correct code." });
    }

    const otpTime = admin.OTPCreatedTime ? new Date(admin.OTPCreatedTime).getTime() : null;
    if (otpTime && Date.now() - otpTime > 10 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "Reset code expired. Please request a new code." });
    }

    if (isAdminUser) {
      admin.password = newPassword; // Auto-hashed by AdminUser pre-save hook
    } else {
      admin.password = await bcrypt.hash(newPassword, 10);
    }

    admin.OTP = null;
    admin.OTPCreatedTime = null;
    admin.resetOtpVerified = false;
    await admin.save();

    return res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("Error in admin updatePassword:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

module.exports = { login, forgotPassword, updatePassword };
