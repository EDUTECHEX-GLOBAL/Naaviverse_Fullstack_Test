// =========================================
//  [EMAIL] BREVO (SENDINBLUE) EMAIL CONTROLLER
// =========================================

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const User = require("../models/UsersModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const axios = require("axios");
const nodemailer = require("nodemailer");
const { getOtpEmailContent } = require("../utils/otpEmailTemplate");


// =========================================
// BREVO CONFIG
// =========================================

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_USER = process.env.BREVO_USER || "b31b04001@smtp-brevo.com";

if (!BREVO_API_KEY) {
  console.error("[WARN]️ BREVO_API_KEY missing in environment variables (.env)");
}

if (!process.env.EMAIL_SERVICE_USER) {
  console.error("[WARN]️ EMAIL_SERVICE_USER missing in environment variables (.env)");
}

console.log(
  "[EMAIL] Brevo Email Config:",
  process.env.BREVO_API_KEY ? "Key Loaded [OK]" : "Key Missing [ERROR]",
  `| Login: ${BREVO_USER}`
);


// =========================================
// OTP GENERATOR
// =========================================
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("Generated OTP:", otp);
  return otp;
};

// =========================================
// SEND MAIL (MULTIPLE SERVICE SUPPORT)
// =========================================

const getTransporters = () => {
  const transporters = [];

  // Option 1: Brevo (Sendinblue) API Key via SMTP
  if (process.env.BREVO_API_KEY) {
    transporters.push({
      name: "Brevo SMTP",
      transporter: nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: {
          user: BREVO_USER,
          pass: process.env.BREVO_API_KEY,
        },
      }),
    });
  }

  // Option 2: SendGrid API Key via SMTP
  if (process.env.SENDGRID_API_KEY) {
    transporters.push({
      name: "SendGrid SMTP",
      transporter: nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false,
        auth: {
          user: "apikey",
          pass: process.env.SENDGRID_API_KEY,
        },
      }),
    });
  }

  // Option 3: Standard SMTP / Gmail (fallback)
  if (process.env.EMAIL_SERVICE_USER && process.env.EMAIL_SERVICE_PASS) {
    transporters.push({
      name: "Gmail / Custom SMTP",
      transporter: nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_SERVICE_USER,
          pass: process.env.EMAIL_SERVICE_PASS,
        },
      }),
    });
  }

  return transporters;
};

const sendNotificationMail = async (email, subject, message, attachments = []) => {
  const transporters = getTransporters();

  if (transporters.length === 0) {
    console.error("[ERROR] No email service configuration found in .env (need BREVO_API_KEY, SENDGRID_API_KEY, or EMAIL_SERVICE_USER/PASS)");
    return false;
  }

  const defaultAttachments = attachments ? [...attachments] : [];
  if (message && message.includes("cid:naavi_logo") && !defaultAttachments.some(a => a.cid === "naavi_logo")) {
    const primaryLogo = path.join(__dirname, "../utils/skillnaav_logo.png");
    const fallbackLogo = path.join(__dirname, "../utils/naavi_final_logo2.png");
    const logoPath = fs.existsSync(primaryLogo) ? primaryLogo : fallbackLogo;
    if (fs.existsSync(logoPath)) {
      defaultAttachments.push({
        filename: "naavi_logo.png",
        path: logoPath,
        cid: "naavi_logo",
      });
    }
  }

  const fromUser = process.env.EMAIL_SERVICE_USER || "naaviplatform@gmail.com";
  const mailOptions = {
    from: `"Naavi Platform" <${fromUser}>`,
    to: email,
    subject: subject || "Notification",
    html: message.startsWith("<") ? message : `<p>${message}</p>`,
    attachments: defaultAttachments,
  };

  // Try each transporter in order until one succeeds
  for (const { name, transporter } of transporters) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[OK] Email sent via ${name} to ${email}: ${info.messageId}`);
      return true;
    } catch (error) {
      console.warn(`[WARN]️ ${name} failed: ${error.message} — trying next...`);
    }
  }

  console.error("[ERROR] All email services failed. Could not deliver email to:", email);
  return false;
};


// =========================================
// SIGNUP FUNCTION
// =========================================
const saltRounds = 10;

const signUp = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // =========================
    // Validate fields
    // =========================
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

   
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered",
      });
    }

    // =========================
    // Create user
    // =========================
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const OTP = generateOTP();

    const temporalUser = new User({
      username,
      email,
      password: hashedPassword,
      OTP,
      OTPCreatedTime: new Date(),
      OTPverified: false,
      status: false,
    });

    await temporalUser.save();

    // =========================
    // Send OTP Email
    // =========================
    const { subject: otpSubject, html: otpHtml } = getOtpEmailContent({
      type: "user_signup",
      otpCode: OTP,
      recipientName: username,
      expiresIn: "5 minutes",
    });

    const mailSent = await sendNotificationMail(email, otpSubject, otpHtml);

    if (!mailSent) {
      return res.status(500).json({
        success: false,
        message: "Email sending failed. Please try again.",
      });
    }

    // =========================
    // Generate JWT
    // =========================
    const token = jwt.sign(
      { id: temporalUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully. OTP sent.",
      token,
      user: {
        id: temporalUser._id,
        username: temporalUser.username,
        email: temporalUser.email,
      },
    });

  } catch (error) {
    console.error("[ERROR] SignUp Error:", error);

    return res.status(500).json({
      success: false,
      message: "Signup failed",
    });
  }
};


// =========================================
// VERIFY OTP
// =========================================
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const userFound = await User.findOne({ email });

    if (!userFound) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (otp !== userFound.OTP) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const otpAge = Date.now() - new Date(userFound.OTPCreatedTime).getTime();

    if (otpAge > 5 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    userFound.OTPverified = true;
    userFound.status = true;

    await userFound.save();

    return res.status(200).json({
      success: true,
      message: "OTP Verified successfully",
    });

  } catch (err) {
    console.error("[ERROR] Verify OTP Error:", err);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
};

// =========================================
// PENDING REGISTRATIONS (IN-MEMORY STATE)
// Never store unverified accounts in MongoDB!
// =========================================
const pendingRegistrations = new Map();

const setPendingRegistration = (email, data) => {
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();
  pendingRegistrations.set(cleanEmail, {
    ...data,
    email: cleanEmail,
    createdAt: Date.now(),
    attempts: 0,
  });
};

const getPendingRegistration = (email) => {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const item = pendingRegistrations.get(cleanEmail);
  if (!item) return null;

  // 10-minute expiry
  if (Date.now() - item.createdAt > 10 * 60 * 1000) {
    pendingRegistrations.delete(cleanEmail);
    return null;
  }
  return item;
};

const deletePendingRegistration = (email) => {
  if (!email) return;
  pendingRegistrations.delete(email.trim().toLowerCase());
};

// =========================================
module.exports = {
  signUp,
  verifyOTP,
  generateOTP,
  sendNotificationMail,
  setPendingRegistration,
  getPendingRegistration,
  deletePendingRegistration,
};
