const mongoose = require("mongoose");
const User = require("../models/UsersModel");
const Partner = require("../models/PartnerModel");
const Approval = require("../models/ApprovalModel");
require("dotenv").config({ path: ".env" });
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const UserPath = require("../models/UserPathsModel"); // <- ADD THIS
const BASE_URL = process.env.REACT_APP_API_BASE_URL;
const {
  generateOTP,
  sendOTP,
  sendNotificationMail,
  setPendingRegistration,
  getPendingRegistration,
  deletePendingRegistration,
} = require("../middlewares/verifySignUp");
const { getOtpEmailContent } = require("../utils/otpEmailTemplate");
const { validateEmail } = require("../utils/emailValidator");

// ── Activity logger (non-blocking — never breaks login if it fails) ───────────
const { logActivityInternal } = require("./ActivityController");

const signUp = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailVal = validateEmail(cleanEmail);
    if (!emailVal.isValid) {
      return res.status(400).json({ success: false, message: emailVal.message });
    }
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i');

    // Check if verified user exists
    const existingUser = await User.findOne({ email: emailRegex, OTPverified: true });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: "ALREADY_REGISTERED",
        registeredRole: "User",
        message: "This email is already registered as a User account."
      });
    }

    const existingPartner = await Partner.findOne({ email: emailRegex, OTPverified: true });
    if (existingPartner) {
      return res.status(400).json({
        success: false,
        code: "REGISTERED_AS_PARTNER",
        registeredRole: "Partner",
        message: "This email is already registered as a Partner account."
      });
    }

    // Clean up any old unverified user record with this email in MongoDB if one existed from before
    await User.deleteMany({ email: emailRegex, OTPverified: { $ne: true } });

    const OTP = generateOTP();

    // Store in-memory pending registration ONLY — DO NOT persist to MongoDB until OTP is verified!
    setPendingRegistration(cleanEmail, {
      username: username.trim(),
      email: cleanEmail,
      password,
      role: "user",
      otp: OTP,
    });

    const { subject: otpSubject, html: otpHtml } = getOtpEmailContent({
      type: "user_signup",
      otpCode: OTP,
      recipientName: username,
      expiresIn: "10 minutes",
    });

    sendNotificationMail(cleanEmail, otpSubject, otpHtml)
      .catch((err) => console.error("Mail failed:", err));

    return res.status(200).json({
      success: true,
      otpSent: true,
      message: "OTP sent successfully",
      otp: OTP,
    });
  } catch (err) {
    console.error("SignUp error:", err);
    return res.status(500).json({ success: false, message: "Signup failed" });
  }
};

const checkEmailDuplicate = async (req, res) => {
  try {
    const email = req.body?.email || req.query?.email;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const user = await User.findOne({ email: emailRegex, OTPverified: true });
    const partner = await Partner.findOne({ email: emailRegex, OTPverified: true });

    if (user && partner) {
      return res.status(200).json({
        exists: true,
        count: 2,
        registeredRole: "Both",
        message: "This email is registered as both a User and a Partner account."
      });
    }

    if (user) {
      return res.status(200).json({
        exists: true,
        count: 1,
        registeredRole: "User",
        message: "This email is already registered as a User account."
      });
    }

    if (partner) {
      return res.status(200).json({
        exists: true,
        count: 1,
        registeredRole: "Partner",
        message: "This email is already registered as a Partner account."
      });
    }

    return res.status(200).json({
      exists: false,
      count: 0,
      registeredRole: null,
      message: "Email is available"
    });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ success: false, message: "Something went wrong, email check failed" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i');
    const userFound = await User.findOne({ email: emailRegex });
    if (!userFound) {
      return res.status(404).json({ success: false, message: "No user account found with this email address" });
    }

    const OTP = generateOTP();
    userFound.OTP = OTP;
    userFound.OTPCreatedTime = new Date();
    await userFound.save();

    const { subject: otpSubject, html: otpHtml } = getOtpEmailContent({
      type: "user_forgot",
      otpCode: OTP,
      recipientName: userFound.username,
      expiresIn: "10 minutes",
    });

    await sendNotificationMail(cleanEmail, otpSubject, otpHtml);

    const token = jwt.sign({ id: userFound._id }, process.env.JWT_SECRET_KEY, { expiresIn: 86400 });
    return res.status(200).json({ success: true, token, message: "OTP sent successfully to your email address" });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ success: false, message: "Something went wrong while sending the OTP" });
  }
};

const sendConfirmationEmail = async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.body.email });
    if (!userFound) return res.status(404).json({ message: "User not found" });

    const url = `${BASE_URL}/api/auth/verification/${userFound._id}`;

    await sendNotificationMail(
      userFound.email,
      "Naavi Account Confirmation",
      `Dear ${userFound.username || "User"},<br>Please confirm your account:<br><a href="${url}">${url}</a>`
    );

    return res.status(200).json({ success: true, message: "Account confirmation email has been sent successfully" });
  } catch (error) {
    console.error("sendConfirmationEmail error:", error);
    return res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

const submitForgotPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i');
    const user = await User.findOne({ email: emailRegex });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const otpTime = user.OTPCreatedTime ? new Date(user.OTPCreatedTime).getTime() : null;
    if (otpTime && Date.now() - otpTime > 10 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new verification code." });
    }

    const cleanCode = (code || "").toString().trim();
    const isCodeMatch = user.OTP && String(user.OTP).trim() === cleanCode;

    if (!isCodeMatch && !user.resetOtpVerified) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please enter the correct OTP." });
    }

    user.password = newPassword;
    user.OTP = null;
    user.OTPCreatedTime = null;
    user.resetOtpVerified = false;
    user.OTPverified = true;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("submitForgotPassword error:", err);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ── LOGIN — activity logging integrated ───────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Both email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i');
    const user = await User.findOne({ email: emailRegex });

    if (!user) {
      // Check if this email is registered as a Partner
      const partner = await Partner.findOne({ email: emailRegex });
      if (partner) {
        return res.status(400).json({
          success: false,
          code: "REGISTERED_AS_PARTNER",
          registeredRole: "Partner",
          message: "This email is registered as a Partner account. Please switch to Partner login.",
        });
      }

      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "No user account found with this email. Please check your email or create a new account.",
      });
    }

    if (!user.OTPverified) {
      return res.status(401).json({
        success: false,
        code: "OTP_NOT_VERIFIED",
        message: "Please verify your email via OTP before logging in"
      });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: "INVALID_PASSWORD",
        message: "The password you entered is incorrect. Please try again or reset your password."
      });
    }

    // ── Auto-heal user status consistency if out of sync ─────────────
    if (user.status !== "active" || user.isBlocked) {
      user.status = "active";
      user.isBlocked = false;
      user.OTPverified = true;
      await user.save();
    }

    // ── Ensure Approval record is synced to approved ─────────────────
    await Approval.findOneAndUpdate(
      { email: emailRegex, role: "User" },
      {
        $set: {
          status: "approved",
          role: "User",
          email: user.email,
          firstName: user.name || user.username || cleanEmail.split("@")[0],
          businessName: user.username || cleanEmail.split("@")[0],
          type: user.userType || "student",
          country: user.country || "India",
        }
      },
      { upsert: true, new: true }
    ).catch(() => {});

    // ── Auto-restore selectedPath if missing ──────────────────────────
    if (!user.selectedPath) {
      const latestUserPath = await UserPath.findOne(
        { email: emailRegex, status: "active" },
        { pathId: 1 },
        { sort: { updatedAt: -1, createdAt: -1 } }
      ).lean();

      if (latestUserPath) {
        user.selectedPath = latestUserPath.pathId;
        await user.save();
      }
    }
    // ──────────────────────────────────────────────────────────────────

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

    // [OK] Log login activity — non-blocking, never breaks login
    logActivityInternal({
      userId: user._id.toString(),
      email:  user.email,
      type:   "login",
      title:  "Logged in",
      desc:   `Session started · ${user.city || "Unknown location"}`,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id:             user._id,
        _id:            user._id,
        username:       user.username,
        email:          user.email,
        name:           user.name || user.username,
        profilePicture: user.profilePicture || "",
        userType:       user.userType || "student",
        status:         user.status || "active",
        approvalStatus: "approved",
        selectedPath:   user.selectedPath || null,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("delivery-app-session-token");
    return res.status(200).json({ success: true, message: "User has logout successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error });
  }
};

const sendResetPasswordEmail = async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.body.email });
    if (!userFound) return res.status(422).json({ success: false, message: "Doesn't exits account link with that email" });

    const token = jwt.sign(
      { id: userFound._id, expiration: Date.now() + 10 * 60 * 1000 },
      process.env.JWT_SECRET_KEY
    );

    const url = `${process.env.HOST || "localhost:3000"}/#/authentication/resetPassword/${token}`;
    await sendResetPasswordEmailFunction(url, req.body.email);

    return res.status(200).json({ success: true, message: "Reset password email has been send successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: "Something went wrong, fail to to send reset password email" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = decodeURIComponent(req.params.token.trim());
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) return res.status(400).json({ message: "Password fields are required" });
    if (newPassword !== confirmPassword)  return res.status(400).json({ message: "Passwords don't match" });

    const decoded  = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userFound = await User.findById(decoded.id);
    if (!userFound) return res.status(404).json({ message: "User not found" });

    userFound.password = newPassword;
    await userFound.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i');

    const isForgotFlow = req.body.purpose === "forgot_password" || req.body.type === "forgot_password" || req.body.forReset === true;

    // 1. Check pending registration (new user registration flow)
    const pending = getPendingRegistration(cleanEmail);
    if (pending && !isForgotFlow) {
      if (pending.otp.toString().trim() !== cleanOtp) {
        pending.attempts = (pending.attempts || 0) + 1;
        if (pending.attempts >= 5) {
          deletePendingRegistration(cleanEmail);
        }
        return res.status(400).json({ success: false, message: "Invalid OTP. Please enter the correct OTP." });
      }

      // Valid OTP! Create permanent user in MongoDB now
      const passwordToUse = pending.password || req.body.password;
      const usernameToUse = pending.username || req.body.username || cleanEmail.split("@")[0];

      // Remove any leftover unverified records
      await User.deleteMany({ email: emailRegex, OTPverified: { $ne: true } });

      const newUser = new User({
        username: usernameToUse,
        email: cleanEmail,
        password: passwordToUse,
        OTPverified: true,
        status: "active",
      });

      await newUser.save();
      deletePendingRegistration(cleanEmail);

      const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

      return res.status(200).json({
        success: true,
        message: "OTP Verified successfully",
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      });
    }

    // 2. Existing user check (for password reset / confirmation / legacy flow)
    const userFound = await User.findOne({ email: emailRegex });
    if (!userFound) return res.status(404).json({ success: false, message: "No pending registration found or user not found" });

    if (userFound.OTPCreatedTime && new Date() - userFound.OTPCreatedTime > 10 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new verification code." });
    }

    if (!userFound.OTP || cleanOtp !== userFound.OTP.toString().trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please enter the correct OTP." });
    }

    userFound.OTPverified = true;
    userFound.status = "active";

    if (isForgotFlow) {
      userFound.resetOtpVerified = true;
      await userFound.save();
      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
      });
    }

    userFound.OTP = null;
    userFound.OTPCreatedTime = null;
    await userFound.save();

    const token = jwt.sign({ id: userFound._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

    return res.status(200).json({
      success: true,
      message: "OTP Verified successfully",
      token,
      user: {
        id: userFound._id,
        username: userFound.username,
        email: userFound.email,
      },
    });
  } catch (err) {
    console.error("verifyOTP error:", err);
    return res.status(500).json({ success: false, message: "Something went wrong during OTP verification" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP code, and new password are required" });
    }

    if (newPassword.length < 10) {
      return res.status(400).json({ success: false, message: "Password must be at least 10 characters long" });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i');
    const user = await User.findOne({ email: emailRegex });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const cleanCode = (code || "").toString().trim();
    const isCodeMatch = user.OTP && String(user.OTP).trim() === cleanCode;

    if (!isCodeMatch && !user.resetOtpVerified) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please enter the correct OTP." });
    }

    const otpTime = user.OTPCreatedTime ? new Date(user.OTPCreatedTime).getTime() : null;
    if (otpTime && Date.now() - otpTime > 10 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new verification code." });
    }

    user.password = newPassword;
    user.OTP = null;
    user.OTPCreatedTime = null;
    user.resetOtpVerified = false;
    user.OTPverified = true;
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAllUsers = async (req, res) => {
  console.log("GET /users hit");
  try {
    const users = await User.find();
    return res.status(200).json({ success: true, data: users, message: "Users fetched successfully" });
  } catch (error) {
    console.error("Error fetching all users:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

const getUserProfilePic = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ status: false, message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user || !user.profilePicture) {
      return res.status(404).json({ status: false, message: "User profile picture not found" });
    }
    res.json({ status: true, profilePic: user.profilePicture });
  } catch (error) {
    console.error("Error fetching user profile picture:", error);
    res.status(500).json({ status: false, message: "Server Error" });
  }
};

const checkUsername = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ available: false, message: "No username provided" });
    const user = await User.findOne({ username });
    return res.json({ available: !user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { email, name, picture, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required from Google account" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const requestedRole = (role === "Accountants" || role === "partner") ? "partner" : "user";

    // Check existing records
    const existingUser = await User.findOne({ email: emailRegex });
    const existingPartner = await Partner.findOne({ email: emailRegex });

    // Handle cross-role warning if account already registered on the opposite role
    let activeRole = requestedRole;
    if (requestedRole === "user" && !existingUser && existingPartner) {
      return res.status(400).json({
        success: false,
        code: "REGISTERED_AS_PARTNER",
        registeredRole: "Partner",
        message: "This email is registered as a Partner account. Please switch to Partner login."
      });
    }

    if (requestedRole === "partner" && !existingPartner && existingUser) {
      return res.status(400).json({
        success: false,
        code: "REGISTERED_AS_USER",
        registeredRole: "User",
        message: "This email is registered as a User account. Please switch to User login."
      });
    }

    // Process as USER
    if (activeRole === "user") {
      let user = existingUser;

      if (!user) {
        const randomPassword = crypto.randomBytes(16).toString("hex");
        const baseUsername = (name || cleanEmail.split("@")[0] || "user").replace(/[^a-zA-Z0-9_]/g, "");
        const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
        const username = `${baseUsername || "user"}_${uniqueSuffix}`;

        user = new User({
          email: cleanEmail,
          name: name || baseUsername,
          username,
          usernameLower: username.toLowerCase(),
          password: randomPassword,
          profilePicture: picture || "",
          userType: "user",
          OTPverified: true,
          status: "active",
        });

        await user.save();
        console.log("[OK] Created new Google User:", cleanEmail);
      } else {
        let changed = false;
        if (!user.OTPverified) {
          user.OTPverified = true;
          changed = true;
        }
        if (!user.profilePicture && picture) {
          user.profilePicture = picture;
          changed = true;
        }
        if (!user.name && name) {
          user.name = name;
          changed = true;
        }
        if (changed) {
          await user.save();
        }
      }

      // Restore selectedPath if missing
      if (!user.selectedPath) {
        const latestUserPath = await UserPath.findOne(
          { email: cleanEmail, status: "active" },
          { pathId: 1 },
          { sort: { createdAt: -1 } }
        ).lean();

        if (latestUserPath) {
          user.selectedPath = latestUserPath.pathId;
          await user.save();
        }
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

      logActivityInternal({
        userId: user._id.toString(),
        email: user.email,
        type: "login",
        title: "Logged in via Google",
        desc: `Google Sign-in · ${user.city || "Unknown location"}`,
      }).catch(() => {});

      return res.status(200).json({
        success: true,
        message: "Google login successful",
        token,
        userType: "user",
        user: {
          id: user._id,
          _id: user._id,
          username: user.username,
          name: user.name || user.username,
          email: user.email,
          profilePicture: user.profilePicture,
        },
      });
    }

    // Process as PARTNER
    let partner = existingPartner;

    if (!partner) {
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const baseUsername = (name || cleanEmail.split("@")[0] || "partner").replace(/[^a-zA-Z0-9_]/g, "");
      const nameParts = (name || "").trim().split(/\s+/);
      const googleFirstName = nameParts[0] || "";
      const googleLastName = nameParts.slice(1).join(" ") || "";

      partner = new Partner({
        email: cleanEmail,
        username: baseUsername,
        firstName: googleFirstName,
        lastName: googleLastName,
        businessName: "",
        password: randomPassword,
        logo: picture || "",
        partnerType: "Distributor",
        userType: "partner",
        OTPverified: true,
        status: true,
        accountStatus: "pending",
        creationSource: "self_registered",
        createdBy: "self_registered",
      });

      await partner.save();

      const prefix = "NVP";
      const cleanUser = cleanEmail.replace(/[^a-zA-Z0-9]/g, "");
      const code = cleanUser.slice(0, 3).toUpperCase();
      const year = new Date().getFullYear();
      const shortId = partner._id.toString().slice(-6).toUpperCase();
      partner.partnerId = `${prefix}-${code}-${year}-${shortId}`;
      await partner.save();

      console.log("[OK] Created new Google Partner:", cleanEmail);
    } else {
      let changed = false;
      if (!partner.OTPverified) {
        partner.OTPverified = true;
        changed = true;
      }
      if (!partner.logo && picture) {
        partner.logo = picture;
        changed = true;
      }
      // If previous bug auto-filled businessName to username and profile is still incomplete, reset it
      if (partner.businessName === partner.username && (!partner.website || !partner.city)) {
        partner.businessName = "";
        changed = true;
      }
      if (changed) {
        await partner.save();
      }
    }

    if (!partner.partnerId) {
      const pType = (partner.partnerType || "GEN").slice(0, 4).toUpperCase();
      const shortId = String(partner._id).slice(-4).toUpperCase();
      partner.partnerId = `NVP-${pType}-${new Date().getFullYear()}-${shortId}`;
      await partner.save();
    }

    const token = jwt.sign({ id: partner._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

    const isInternal = partner.creationSource === "admin_created";
    const approval = await Approval.findOne({ email: partner.email.toLowerCase().trim() });
    const profileCreated = Boolean(partner.businessName && partner.website && (partner.street || partner.city || partner.firstName));

    let approvalStatus = "not_submitted";
    if (isInternal) {
      approvalStatus = "approved";
    } else if (approval) {
      approvalStatus = approval.status || "pending";
    }

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      userType: "partner",
      mustChangePassword: false,
      partner: {
        id: partner._id,
        _id: partner._id,
        partnerId: partner.partnerId,
        username: partner.username,
        businessName: partner.businessName || "",
        firstName: partner.firstName || "",
        lastName: partner.lastName || "",
        logo: partner.logo || picture || "",
        email: partner.email,
        partnerType: partner.partnerType || "Distributor",
        creationSource: partner.creationSource || "self_registered",
        mustChangePassword: false,
        accountStatus: partner.isBlocked ? "inactive" : (partner.accountStatus || "pending"),
        profileCreated,
        approvalStatus,
        status: approvalStatus,
      },
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({ success: false, message: "Google authentication failed" });
  }
};

module.exports = {
  signUp, forgotPassword, login,
  checkEmailDuplicate, sendConfirmationEmail,
  sendResetPasswordEmail, resetPassword,
  logout, verifyOTP, updatePassword,
  getAllUsers, getUserProfilePic,
  submitForgotPassword, checkUsername,
  googleLogin,
};
