// controllers/partners.controller.js
// ─────────────────────────────────────────────────────────────────────────────
// All partner auth + profile logic.
// Activity logging now uses the UNIFIED logEvent from Activity.controller.js
// — no more dependency on partneractivity.controller.js (that file is deleted)
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require("mongoose");
const Partner  = require("../models/PartnerModel");
const User     = require("../models/UsersModel");
const Approval = require("../models/ApprovalModel");
require("dotenv").config({ path: ".env" });
const jwt    = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const {
  generateOTP,
  sendNotificationMail,
  setPendingRegistration,
  getPendingRegistration,
  deletePendingRegistration,
} = require("../middlewares/verifySignUp");
const { getOtpEmailContent } = require("../utils/otpEmailTemplate");

// [OK] Unified activity — replaces the old partneractivity.controller import
const { logEvent } = require("./ActivityController");
const { validateEmail, validatePersonName, validateBusinessName, validatePostalCode } = require("../utils/emailValidator");


// ─────────────────────────────────────────────────────────────────────────────
// SIGN UP
// ─────────────────────────────────────────────────────────────────────────────
const signUp = async (req, res) => {
  try {
    const { email, username, password, partnerType } = req.body;

    if (!email || !username || !password || !partnerType) {
      return res.status(400).json({
        success: false,
        message: "Email, username, password and partnerType are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailVal = validateEmail(cleanEmail);
    if (!emailVal.isValid) {
      return res.status(400).json({ success: false, message: emailVal.message });
    }
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i');

    // Check if verified partner exists
    const existingPartner = await Partner.findOne({ email: emailRegex, OTPverified: true });
    if (existingPartner) {
      return res.status(400).json({
        success: false,
        code: "ALREADY_REGISTERED",
        registeredRole: "Partner",
        message: "This email is already registered as a Partner account."
      });
    }

    const existingUser = await User.findOne({ email: emailRegex, OTPverified: true });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: "REGISTERED_AS_USER",
        registeredRole: "User",
        message: "This email is already registered as a User account."
      });
    }

    // Clean up any old unverified partner record with this email in MongoDB if one existed from before
    await Partner.deleteMany({ email: emailRegex, OTPverified: { $ne: true } });

    const OTP = generateOTP();

    // Store in-memory pending registration ONLY — DO NOT persist to MongoDB until OTP is verified!
    setPendingRegistration(cleanEmail, {
      username: username.trim(),
      email: cleanEmail,
      password,
      partnerType,
      role: "partner",
      otp: OTP,
    });

    const { subject: otpSubject, html: otpHtml } = getOtpEmailContent({
      type: "partner_signup",
      otpCode: OTP,
      recipientName: username,
      expiresIn: "10 minutes",
    });

    sendNotificationMail(cleanEmail, otpSubject, otpHtml)
      .catch((err) => console.error("Mail failed:", err));

    return res.status(200).json({
      success: true,
      otpSent: true,
      message: "OTP sent to your email",
      otp: OTP,
    });
  } catch (error) {
    console.error("SignUp Error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// LOGIN — logs "login" event to unified activity collection
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Both email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i');
    const partner = await Partner.findOne({ email: emailRegex });
    if (!partner) {
      // Check if this email is registered as a standard User
      const user = await User.findOne({ email: emailRegex });
      if (user) {
        return res.status(400).json({
          success: false,
          code: "REGISTERED_AS_USER",
          registeredRole: "User",
          message: "This email is registered as a User account. Please switch to User login.",
        });
      }

      return res.status(404).json({
        success: false,
        code: "PARTNER_NOT_FOUND",
        message: "No partner account found with this email. Please check your email or register as a partner.",
      });
    }

    if (!partner.OTPverified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email via OTP before logging in",
      });
    }

    const isMatch = await partner.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: "INVALID_PASSWORD",
        message: "The password you entered is incorrect. Please try again or reset your password.",
      });
    }

    // Auto-heal status consistency if out of sync
    const isPartnerActive =
      partner.accountStatus === "active" ||
      (!partner.isBlocked && partner.status === true);

    if (isPartnerActive) {
      partner.accountStatus = "active";
      partner.isBlocked = false;
      partner.status = true;
      partner.OTPverified = true;
      await partner.save();

      // Ensure Approval record is synced to approved as well
      await Approval.findOneAndUpdate(
        { email: { $regex: new RegExp("^" + cleanEmail + "$", "i") } },
        {
          $set: {
            status: "approved",
            role: "Partner",
            email: partner.email,
            businessName: partner.businessName || partner.username,
            type: partner.partnerType || "Education & Learning",
            firstName: partner.firstName || partner.username,
          }
        },
        { upsert: true, new: true }
      ).catch(() => {});
    } else if (partner.accountStatus === "inactive" || partner.isBlocked) {
      partner.accountStatus = "inactive";
      partner.isBlocked = true;
      partner.status = false;
      await partner.save();

      return res.status(403).json({
        success: false,
        message: "Your account is currently inactive. Please contact administrator.",
      });
    }

    const isInternal = partner.creationSource === "admin_created";
    const approval       = await Approval.findOne({ email: cleanEmail });
    const profileCreated = Boolean(partner.businessName && partner.website);
    
    let approvalStatus = "not_submitted";
    if (isInternal) {
      approvalStatus = "approved";
    } else if (approval) {
      approvalStatus = approval.status || "pending";
    }

    const token = jwt.sign({ id: partner._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

    // [OK] Fire-and-forget activity log — never blocks the login response
    await logEvent({
      role:        "partner",
      email:       partner.email,
      displayName: partner.businessName || partner.username || email,
      partnerType: partner.partnerType  || "",
      eventType:   "login",
      title:       "Partner Logged In",
      desc:        `${partner.businessName || partner.username || email} signed in to the portal`,
    }).catch(err => console.error("Partner login activity log error:", err));

    // Ensure partnerId exists on the partner document
    if (!partner.partnerId) {
      const pType = (partner.partnerType || "GEN").slice(0, 4).toUpperCase();
      const shortId = String(partner._id).slice(-4).toUpperCase();
      partner.partnerId = `NVP-${pType}-${new Date().getFullYear()}-${shortId}`;
      await partner.save();
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      mustChangePassword: partner.mustChangePassword === true || partner.mustChangePassword === "true",
      partner: {
        id:                 partner._id,
        partnerId:          partner.partnerId,
        username:           partner.username,
        businessName:       partner.businessName || partner.username,
        email:              partner.email,
        partnerType:        partner.partnerType,
        creationSource:     partner.creationSource || (isInternal ? "admin_created" : "self_registered"),
        mustChangePassword: partner.mustChangePassword === true || partner.mustChangePassword === "true",
        accountStatus:      partner.isBlocked ? "inactive" : (partner.accountStatus || "active"),
        profileCreated,
        approvalStatus,
        status:             approvalStatus,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i');
    const partnerFound = await Partner.findOne({ email: emailRegex });

    if (!partnerFound) {
      return res.status(404).json({ success: false, message: "No partner account found with this email address" });
    }

    const OTP         = generateOTP();
    const currentTime = new Date();
    partnerFound.OTP            = OTP;
    partnerFound.OTPCreatedTime = currentTime;
    await partnerFound.save();

    const { subject: otpSubject, html: otpHtml } = getOtpEmailContent({
      type: "partner_forgot",
      otpCode: OTP,
      recipientName: partnerFound.username || partnerFound.businessName,
      expiresIn: "10 minutes",
    });

    sendNotificationMail(cleanEmail, otpSubject, otpHtml)
      .catch((err) => console.error("Mail failed:", err));

    const token = jwt.sign({ id: partnerFound._id }, process.env.JWT_SECRET_KEY, { expiresIn: 86400 });
    return res.status(200).json({ success: true, token, message: "OTP sent to your emailId" });
  } catch (error) {
    console.error("Partner forgotPassword Error:", error);
    return res.status(500).json({ success: false, message: "Failed to send reset code. Please try again." });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// SEND CONFIRMATION EMAIL
// ─────────────────────────────────────────────────────────────────────────────
const sendConfirmationEmail = async (req, res) => {
  try {
    const partnerFound = await Partner.findOne({ email: req.body.email });
    const token        = partnerFound.emailToken;
    const url          = `${process.env.HOST || "localhost:7000"}/api/auth/verification/${token}`;
    await sendConfirmationEmailFunction(url, partnerFound.email);
    return res.status(200).json({ success: true, message: "Confirmation email sent" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    res.clearCookie("delivery-app-session-token");
    return res.status(200).json({ successful: true, message: "Partner logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// SEND RESET PASSWORD EMAIL
// ─────────────────────────────────────────────────────────────────────────────
const sendResetPasswordEmail = async (req, res) => {
  try {
    const partnerFound = await Partner.findOne({ email: req.body.email });
    if (!partnerFound)
      return res.status(422).json({ success: false, message: "No account linked to that email" });

    const token = jwt.sign(
      { id: partnerFound._id, expiration: Date.now() + 10 * 60 * 1000 },
      process.env.JWT_SECRET_KEY
    );
    const url = `${process.env.HOST || "localhost:3000"}/#/authentication/resetPassword/${token}`;
    await sendResetPasswordEmailFunction(url, req.body.email);
    return res.status(200).json({ success: true, message: "Reset password email sent" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords don't match" });
    if (newPassword.length < 5)
      return res.status(400).json({ success: false, message: "Password minimum length is 5" });

    const token = req.params.token;
    if (!token) return res.status(403).json({ success: false, message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_RESET_FORGOTTEN_PASSWORD_KEY);
    if (!decoded) return res.status(401).json({ message: "Invalid token" });
    if (Date.now() > decoded.expiration)
      return res.status(422).json({ success: false, message: "Time to reset password exceeded" });

    const partnerFound = await Partner.findById(decoded.id);
    if (!partnerFound) return res.status(404).json({ message: "User not found" });

    partnerFound.password = newPassword;
    await partnerFound.save();
    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i');

    // 1. Check pending registration first (registration flow)
    const pending = getPendingRegistration(cleanEmail);
    if (pending) {
      if (pending.otp.toString().trim() !== cleanOtp) {
        pending.attempts = (pending.attempts || 0) + 1;
        if (pending.attempts >= 5) {
          deletePendingRegistration(cleanEmail);
        }
        return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
      }

      // Valid OTP! Create permanent partner in MongoDB now
      const passwordToUse = pending.password || req.body.password;
      const usernameToUse = pending.username || req.body.username || cleanEmail.split("@")[0];
      const partnerTypeToUse = pending.partnerType || req.body.partnerType || "Distributor";

      // Remove any leftover unverified records
      await Partner.deleteMany({ email: emailRegex, OTPverified: { $ne: true } });

      const newPartner = new Partner({
        username: usernameToUse,
        email: cleanEmail,
        password: passwordToUse,
        partnerType: partnerTypeToUse,
        OTPverified: true,
        status: true,
        accountStatus: "pending",
        creationSource: "self_registered",
        createdBy: "self_registered",
      });

      await newPartner.save();

      // Auto-generate unique partnerId
      const prefix = "NVP";
      const cleanUser = (usernameToUse || cleanEmail).replace(/[^a-zA-Z0-9]/g, "");
      const code = cleanUser.slice(0, 3).toUpperCase() || "GEN";
      const year = new Date().getFullYear();
      const shortId = newPartner._id.toString().slice(-6).toUpperCase();
      const partnerId = `${prefix}-${code}-${year}-${shortId}`;

      newPartner.partnerId = partnerId;
      await newPartner.save();

      deletePendingRegistration(cleanEmail);

      const token = jwt.sign({ id: newPartner._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        token,
        partner: {
          id: newPartner._id,
          partnerId: newPartner.partnerId,
          username: newPartner.username,
          email: newPartner.email,
          partnerType: newPartner.partnerType,
        },
      });
    }

    // 2. Fallback: check existing partner in DB (e.g. forgot password or legacy)
    const partner = await Partner.findOne({ email: emailRegex });
    if (!partner) {
      return res.status(400).json({ success: false, message: "Partner not found or OTP expired" });
    }

    if (partner.isOTPExpired()) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
    }

    if (!partner.OTP || partner.OTP.toString().trim() !== cleanOtp) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
    }

    partner.status = true;
    partner.OTPverified = true;
    partner.OTP = null;
    await partner.save();

    const token = jwt.sign({ id: partner._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      partner: {
        id: partner._id,
        partnerId: partner.partnerId,
        username: partner.username,
        email: partner.email,
        partnerType: partner.partnerType,
      },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const updatePassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword)
      return res.status(400).json({ success: false, message: "Email, OTP code, and new password are required" });

    if (newPassword.length < 10) {
      return res.status(400).json({ success: false, message: "Password must be at least 10 characters long" });
    }

    const cleanEmail = (email || "").trim();
    const emailRegex = new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i');
    const partner = await Partner.findOne({ email: emailRegex });
    if (!partner) return res.status(404).json({ success: false, message: "Partner not found" });
    if (String(partner.OTP) !== String(code))
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    partner.password = newPassword;
    partner.OTP      = null;
    await partner.save();
    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Error updating password:", err);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// GET ALL PARTNERS
// ─────────────────────────────────────────────────────────────────────────────
const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find({}, { password: 0 });
    return res.status(200).json({ success: true, message: "Partners retrieved successfully", partners });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PARTNER PROFILE — logs "approval" event on first profile submission
// ─────────────────────────────────────────────────────────────────────────────
const updatePartnerProfile = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const partner = await Partner.findOne({ email });
    if (!partner) return res.status(404).json({ success: false, message: "Partner not found" });

    let logoData = req.body.logo;
    // Automatically sanitize oversized raw base64 strings (>200KB) to prevent DB bloat and Compass UI crashes
    if (logoData && typeof logoData === "string" && logoData.length > 200000) {
      console.warn(`[PartnersController] Base64 logo size (${logoData.length} chars) is too large for inline DB storage. Preserving existing logo.`);
      logoData = partner.logo || "";
    }

    let cleanPhone = req.body.phone !== undefined ? req.body.phone : req.body.phoneNumber;
    if (typeof cleanPhone === "string") {
      cleanPhone = cleanPhone.replace(/[^0-9\s\-()+]/g, "").trim();
    }

    if (req.body.firstName !== undefined) {
      const fNameVal = validatePersonName(req.body.firstName, "First name");
      if (!fNameVal.isValid) {
        return res.status(400).json({ success: false, message: fNameVal.message });
      }
      req.body.firstName = fNameVal.cleanName;
    }

    if (req.body.lastName !== undefined && req.body.lastName.trim() !== "") {
      const lNameVal = validatePersonName(req.body.lastName, "Last name");
      if (!lNameVal.isValid) {
        return res.status(400).json({ success: false, message: lNameVal.message });
      }
      req.body.lastName = lNameVal.cleanName;
    }

    if (req.body.businessName !== undefined && req.body.businessName.trim() !== "") {
      const bNameVal = validateBusinessName(req.body.businessName);
      if (!bNameVal.isValid) {
        return res.status(400).json({ success: false, message: bNameVal.message });
      }
      req.body.businessName = bNameVal.cleanName;
    }

    if (req.body.pincode !== undefined && req.body.pincode.trim() !== "") {
      const pinVal = validatePostalCode(req.body.pincode, req.body.country);
      if (!pinVal.isValid) {
        return res.status(400).json({ success: false, message: pinVal.message });
      }
      req.body.pincode = pinVal.cleanPostalCode;
    }

    const updatedFields = {
      firstName:    req.body.firstName,
      lastName:     req.body.lastName,
      businessName: req.body.businessName,
      phone:        cleanPhone,
      phoneNumber:  cleanPhone,
      logo:         logoData,
      street:       req.body.street,
      city:         req.body.city,
      state:        req.body.state,
      pincode:      req.body.pincode,
      country:      req.body.country,
      description:  req.body.description,
      website:      req.body.website,
      type:         req.body.type,
      yourPosition: req.body.yourPosition,
    };

    Object.keys(updatedFields).forEach(
      (key) => updatedFields[key] === undefined && delete updatedFields[key]
    );

    await Partner.updateOne({ email }, { $set: updatedFields });

    const isInternal = partner.creationSource === "admin_created";
    const targetStatus = isInternal ? "approved" : "pending";

    const existingApproval = await Approval.findOne({ email });
    if (!existingApproval) {
      await Approval.create({
        role:         "Partner",
        businessName: updatedFields.businessName || partner.businessName,
        type:         updatedFields.type         || partner.partnerType || partner.type,
        email:        partner.email,
        website:      updatedFields.website      || partner.website,
        firstName:    updatedFields.firstName    || partner.firstName,
        lastName:     updatedFields.lastName     || partner.lastName,
        position:     updatedFields.yourPosition || partner.yourPosition,
        country:      updatedFields.country      || partner.country,
        date:         new Date().toDateString(),
        status:       targetStatus,
      });

      // [OK] Log approval-submitted event
      await logEvent({
        role:        "partner",
        email:       partner.email,
        displayName: updatedFields.businessName || partner.businessName || partner.username,
        partnerType: partner.partnerType || "",
        eventType:   "approval",
        title:       "Approval request submitted",
        desc:        `${updatedFields.businessName || partner.businessName} submitted profile for admin review`,
      });
    } else if (!isInternal && existingApproval.status !== "approved") {
      existingApproval.status = "pending";
      existingApproval.businessName = updatedFields.businessName || partner.businessName;
      existingApproval.website = updatedFields.website || partner.website;
      await existingApproval.save();
    }

    res.status(200).json({ success: true, message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Error updating partner profile:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// GET PARTNER BY EMAIL
// ─────────────────────────────────────────────────────────────────────────────
const getPartnerByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const cleanEmail = email.trim();
    const partner = await Partner.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, "i") } });
    if (!partner) return res.status(200).json({ success: false, message: "No profile found", data: null });

    const partnerObj = partner.toObject ? partner.toObject() : { ...partner };
    partnerObj.type = partnerObj.type || partnerObj.partnerType || "";

    const approval = await Approval.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, "i") },
      role: "Partner",
    });

    const approvalStatus = approval ? approval.status : (partner.status ? "approved" : "pending");

    const hasProfile = Boolean(
      (partner.businessName && partner.businessName.trim() !== "") ||
      (partner.firstName && partner.firstName.trim() !== "") ||
      partner.logo
    );

    return res.status(200).json({
      success: true,
      profileIncomplete: !hasProfile,
      approvalStatus,
      data: partnerObj,
    });
  } catch (error) {
    console.error("Error fetching partner:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// GET PARTNER PROFILE PIC
// ─────────────────────────────────────────────────────────────────────────────
const getPartnerProfilePic = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ status: false, message: "Email is required" });

  try {
    const partner = await Partner.findOne({ email });
    if (!partner || !partner.logo)
      return res.status(404).json({ status: false, message: "Partner logo not found" });

    res.json({ status: true, profilePic: partner.logo });
  } catch (error) {
    console.error("Error fetching partner logo:", error);
    res.status(500).json({ status: false, message: "Server Error" });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL PARTNERS MANAGEMENT (SUPER ADMIN CONTROLLED)
// ─────────────────────────────────────────────────────────────────────────────

// CREATE INTERNAL PARTNER
const createInternalPartner = async (req, res) => {
  try {
    const {
      partnerName,
      organizationName,
      contactPerson,
      lastName,
      email,
      phone,
      category,
      website,
      yourPosition,
      street,
      city,
      state,
      pincode,
      country,
      description,
      tempPassword,
      accountStatus,
    } = req.body;

    if (!partnerName || !email || !contactPerson || !tempPassword) {
      return res.status(400).json({
        success: false,
        message: "Partner name, contact person, email, and temporary password are required",
      });
    }

    const contactVal = validatePersonName(contactPerson, "First name");
    if (!contactVal.isValid) {
      return res.status(400).json({ success: false, message: contactVal.message });
    }

    if (lastName && lastName.trim() !== "") {
      const lastVal = validatePersonName(lastName, "Last name");
      if (!lastVal.isValid) {
        return res.status(400).json({ success: false, message: lastVal.message });
      }
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingPartner = await Partner.findOne({ email: cleanEmail });
    if (existingPartner) {
      return res.status(400).json({ success: false, message: "A partner with this email already exists" });
    }

    // Auto-generate partnerId
    const prefix = "NVP";
    const cleanUser = (partnerName || cleanEmail).replace(/[^a-zA-Z0-9]/g, "");
    const code = cleanUser.slice(0, 3).toUpperCase() || "INT";
    const year = new Date().getFullYear();
    const tempObjId = new mongoose.Types.ObjectId();
    const shortId = tempObjId.toString().slice(-6).toUpperCase();
    const partnerId = `${prefix}-${code}-${year}-${shortId}`;

    const newPartner = new Partner({
      _id: tempObjId,
      partnerId,
      username: partnerName,
      businessName: organizationName || partnerName || "Naaviverse Internal",
      firstName: contactPerson,
      lastName: lastName || "",
      email: cleanEmail,
      password: tempPassword, // pre-save hook will hash password!
      phone: phone || "",
      phoneNumber: phone || "",
      type: category || "Education & Learning",
      partnerType: category || "Education & Learning",
      website: website || "",
      yourPosition: yourPosition || "Internal Partner",
      street: street || "",
      city: city || "",
      state: state || "",
      pincode: pincode || "",
      country: country || "India",
      creationSource: "admin_created",
      mustChangePassword: true, // ALWAYS true upon admin creation
      accountStatus: accountStatus || "active",
      isBlocked: accountStatus === "inactive",
      OTPverified: true,
      status: true, // Auto-approved for internal partners!
      createdBy: "Super Admin",
      description: description || "Internal partner account.",
    });

    await newPartner.save();

    // Also auto-create approved record in Approval collection so internal partners bypass approval check
    await Approval.create({
      role: "Partner",
      businessName: newPartner.businessName,
      type: newPartner.partnerType,
      email: cleanEmail,
      firstName: contactPerson,
      date: new Date().toDateString(),
      status: "approved",
    }).catch(err => console.log("Approval record auto-creation notice:", err.message));

    // Log activity
    await logEvent({
      role: "admin",
      email: "admin@naaviverse.com",
      displayName: "Super Admin",
      eventType: "partner_creation",
      title: "Internal Partner Created",
      desc: `Super Admin created internal partner: ${partnerName} (${cleanEmail})`,
    }).catch(() => {});

    // Send Welcome Email with Login Credentials
    const mailBody = `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; color: #1e293b;">
        <h2 style="color: #2563eb; margin-top: 0;">Welcome to Naaviverse Partner Network!</h2>
        <p>Dear <strong>${contactPerson}</strong>,</p>
        <p>An internal partner account has been created for <strong>${partnerName}</strong> (${organizationName || "Naaviverse Internal"}).</p>
        
        <div style="background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #0f172a; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px;">Your Account Credentials:</h4>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Login Email:</strong> ${cleanEmail}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Temporary Password:</strong> <span style="background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; font-weight: bold; color: #d97706;">${tempPassword}</span></p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">(Note: You will be prompted to update this password when you log in.)</p>
        </div>

        <p>Log in using the link below to access your partner dashboard and manage your offerings:</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${process.env.PARTNER_LOGIN_URL || "http://localhost:3000/login?type=partner"}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log In to Partner Portal</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">This is an automated invitation email from Naaviverse Super Admin.</p>
      </div>
    `;

    await sendNotificationMail(
      cleanEmail,
      "Welcome to Naaviverse — Your Partner Account Credentials",
      mailBody
    ).catch((err) => console.error("Internal Partner email delivery error:", err.message));

    return res.status(201).json({
      success: true,
      message: `Internal Partner "${partnerName}" created successfully`,
      data: {
        id: newPartner._id,
        partnerId: newPartner.partnerId,
        partnerName: newPartner.username,
        organizationName: newPartner.businessName,
        contactPerson: newPartner.firstName,
        firstName: newPartner.firstName,
        lastName: newPartner.lastName,
        email: newPartner.email,
        phone: newPartner.phone || newPartner.phoneNumber || "—",
        category: newPartner.partnerType,
        website: newPartner.website,
        yourPosition: newPartner.yourPosition,
        street: newPartner.street,
        city: newPartner.city,
        state: newPartner.state,
        pincode: newPartner.pincode,
        country: newPartner.country,
        description: newPartner.description,
        partnerType: "internal",
        creationSource: newPartner.creationSource,
        accountStatus: newPartner.accountStatus,
        mustChangePassword: newPartner.mustChangePassword,
        createdBy: newPartner.createdBy,
        createdAt: newPartner.createdAt ? new Date(newPartner.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        lastLogin: "Never",
        totalOfferings: 0,
        totalRevenue: "₹0",
      },
    });
  } catch (error) {
    console.error("createInternalPartner Error:", error);
    return res.status(500).json({ success: false, message: "Error creating internal partner", error: error.message });
  }
};

// GET ALL INTERNAL PARTNERS
const getAllInternalPartners = async (req, res) => {
  try {
    const internalPartners = await Partner.find({
      $or: [
        { creationSource: "admin_created" },
        { partnerType: /^internal$/i }
      ]
    }).sort({ createdAt: -1 }).lean();

    const formatted = internalPartners.map(p => ({
      id: p._id,
      partnerId: p.partnerId,
      partnerName: p.username || p.businessName || "Unnamed Partner",
      organizationName: p.businessName || "Naaviverse Internal",
      contactPerson: p.firstName || p.username || "—",
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      email: p.email,
      phone: p.phone || p.phoneNumber || p.contactNumber || p.mobile || "—",
      category: p.partnerType || "Education & Learning",
      website: p.website || "",
      yourPosition: p.yourPosition || "",
      street: p.street || "",
      city: p.city || "",
      state: p.state || "",
      pincode: p.pincode || "",
      country: p.country || "India",
      description: p.description || "",
      partnerType: "internal",
      creationSource: p.creationSource || "admin_created",
      accountStatus: p.isBlocked ? "inactive" : (p.accountStatus || "active"),
      mustChangePassword: !!p.mustChangePassword,
      createdBy: p.createdBy || "Super Admin",
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      lastLogin: p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "Never",
      totalOfferings: 0,
      totalRevenue: "₹0",
    }));

    return res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error("getAllInternalPartners Error:", error);
    return res.status(500).json({ success: false, message: "Error fetching internal partners" });
  }
};

// UPDATE INTERNAL PARTNER
const updateInternalPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      partnerName,
      organizationName,
      contactPerson,
      lastName,
      phone,
      category,
      website,
      yourPosition,
      street,
      city,
      state,
      pincode,
      country,
      description,
      accountStatus,
      mustChangePassword,
    } = req.body;

    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Internal Partner not found" });
    }

    if (partnerName) partner.username = partnerName;
    if (organizationName) partner.businessName = organizationName;
    if (contactPerson) {
      const contactVal = validatePersonName(contactPerson, "First name");
      if (!contactVal.isValid) {
        return res.status(400).json({ success: false, message: contactVal.message });
      }
      partner.firstName = contactVal.cleanName;
    }
    if (lastName !== undefined && lastName.trim() !== "") {
      const lastVal = validatePersonName(lastName, "Last name");
      if (!lastVal.isValid) {
        return res.status(400).json({ success: false, message: lastVal.message });
      }
      partner.lastName = lastVal.cleanName;
    }
    if (phone !== undefined) {
      partner.phone = phone;
      partner.phoneNumber = phone;
    }
    if (category) partner.partnerType = category;
    if (website !== undefined) partner.website = website;
    if (yourPosition !== undefined) partner.yourPosition = yourPosition;
    if (street !== undefined) partner.street = street;
    if (city !== undefined) partner.city = city;
    if (state !== undefined) partner.state = state;
    if (pincode !== undefined) partner.pincode = pincode;
    if (country !== undefined) partner.country = country;
    if (description !== undefined) partner.description = description;
    if (accountStatus) {
      partner.accountStatus = accountStatus;
      partner.isBlocked = (accountStatus === "inactive");
      partner.status = (accountStatus === "active");
      if (accountStatus === "active") {
        partner.OTPverified = true;
      }

      const pEmail = (partner.email || "").trim();
      await Approval.findOneAndUpdate(
        { email: { $regex: new RegExp("^" + pEmail + "$", "i") } },
        {
          $set: {
            status: accountStatus === "active" ? "approved" : "deactivated",
            role: "Partner",
            email: partner.email,
            businessName: partner.businessName || partner.username,
            type: partner.partnerType || "Education & Learning",
            firstName: partner.firstName || partner.username,
          }
        },
        { upsert: true, new: true }
      ).catch(err => console.log("Approval sync notice:", err.message));
    }
    if (mustChangePassword !== undefined) partner.mustChangePassword = mustChangePassword;

    await partner.save();

    return res.status(200).json({
      success: true,
      message: "Internal Partner updated successfully",
      data: {
        id: partner._id,
        partnerId: partner.partnerId,
        partnerName: partner.username,
        organizationName: partner.businessName,
        contactPerson: partner.firstName,
        firstName: partner.firstName,
        lastName: partner.lastName,
        email: partner.email,
        phone: partner.phone || partner.phoneNumber || "—",
        category: partner.partnerType,
        website: partner.website,
        yourPosition: partner.yourPosition,
        street: partner.street,
        city: partner.city,
        state: partner.state,
        pincode: partner.pincode,
        country: partner.country,
        description: partner.description,
        partnerType: "internal",
        creationSource: partner.creationSource || "admin_created",
        accountStatus: partner.isBlocked ? "inactive" : (partner.accountStatus || "active"),
        mustChangePassword: partner.mustChangePassword,
        createdBy: partner.createdBy || "Super Admin",
        createdAt: partner.createdAt ? new Date(partner.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      }
    });
  } catch (error) {
    console.error("updateInternalPartner Error:", error);
    return res.status(500).json({ success: false, message: "Error updating internal partner" });
  }
};

// TOGGLE PARTNER STATUS (active / inactive)
const toggleInternalPartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    const currentStatus = partner.isBlocked ? "inactive" : (partner.accountStatus || "active");
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    partner.accountStatus = newStatus;
    partner.isBlocked = (newStatus === "inactive");
    partner.status = (newStatus === "active");
    if (newStatus === "active") {
      partner.OTPverified = true;
    }

    await partner.save();

    const pEmail = (partner.email || "").trim();
    await Approval.findOneAndUpdate(
      { email: { $regex: new RegExp("^" + pEmail + "$", "i") } },
      {
        $set: {
          status: newStatus === "active" ? "approved" : "deactivated",
          role: "Partner",
          email: partner.email,
          businessName: partner.businessName || partner.username,
          type: partner.partnerType || "Education & Learning",
          firstName: partner.firstName || partner.username,
        }
      },
      { upsert: true, new: true }
    ).catch(err => console.log("Approval sync notice:", err.message));

    return res.status(200).json({
      success: true,
      message: `Partner status changed to ${newStatus}`,
      accountStatus: newStatus,
    });
  } catch (error) {
    console.error("toggleInternalPartnerStatus Error:", error);
    return res.status(500).json({ success: false, message: "Error toggling status" });
  }
};

// RESET PARTNER PASSWORD
const resetInternalPartnerPassword = async (req, res) => {
  try {
    const { partnerId, newTempPassword } = req.body;
    if (!partnerId || !newTempPassword) {
      return res.status(400).json({ success: false, message: "partnerId and newTempPassword are required" });
    }

    const partner = await Partner.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(partnerId) ? partnerId : null },
        { email: typeof partnerId === "string" ? { $regex: new RegExp("^" + partnerId.trim() + "$", "i") } : partnerId }
      ]
    });

    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    partner.password = newTempPassword; // pre-save hook will hash password!
    partner.mustChangePassword = true;
    partner.accountStatus = "active";
    partner.isBlocked = false;
    partner.status = true;
    partner.OTPverified = true;
    await partner.save();

    const pEmail = (partner.email || "").trim();
    await Approval.findOneAndUpdate(
      { email: { $regex: new RegExp("^" + pEmail + "$", "i") } },
      { $set: { status: "approved" } }
    ).catch(err => console.log("Approval sync notice:", err.message));

    // Send Password Reset Email
    const resetMailBody = `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; color: #1e293b;">
        <h2 style="color: #2563eb; margin-top: 0;">Password Reset — Naaviverse Partner Account</h2>
        <p>Dear <strong>${partner.firstName || partner.username || "Partner"}</strong>,</p>
        <p>Your password for internal partner account <strong>${partner.username || partner.businessName}</strong> has been reset by the Super Admin.</p>
        
        <div style="background: #f8fafc; border-left: 4px solid #2563eb; border-radius: 6px; padding: 16px 20px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #0f172a; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px;">New Temporary Credentials:</h4>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Login Email:</strong> ${partner.email}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>New Temporary Password:</strong> <span style="background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; font-weight: bold; color: #d97706;">${newTempPassword}</span></p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">(Note: You will be required to update this temporary password upon login.)</p>
        </div>

        <p style="text-align: center; margin: 24px 0;">
          <a href="${process.env.PARTNER_LOGIN_URL || "http://localhost:3000/login?type=partner"}" style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log In Now</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">This is an automated notification from Naaviverse Super Admin.</p>
      </div>
    `;

    await sendNotificationMail(
      partner.email,
      "Password Reset Notice — Naaviverse Partner Credentials",
      resetMailBody
    ).catch((err) => console.error("Password reset email delivery error:", err.message));

    return res.status(200).json({
      success: true,
      message: `Password reset successfully for ${partner.username || partner.email}`,
    });
  } catch (error) {
    console.error("resetInternalPartnerPassword Error:", error);
    return res.status(500).json({ success: false, message: "Error resetting password" });
  }
};

// CHANGE PARTNER PASSWORD
const changePartnerPassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: "Email and new password are required" });
    }

    const partner = await Partner.findOne({ email: email.toLowerCase() });
    if (!partner) {
      return res.status(404).json({ success: false, message: "Partner not found" });
    }

    if (oldPassword) {
      const isMatch = await partner.matchPassword(oldPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Current password is incorrect" });
      }
    } else if (!partner.mustChangePassword) {
      return res.status(400).json({ success: false, message: "Current password is required" });
    }

    partner.password = newPassword; // pre-save hook will hash it!
    partner.mustChangePassword = false;
    partner.accountStatus = "active";
    partner.isBlocked = false;
    partner.status = true;
    partner.OTPverified = true;
    await partner.save();

    return res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    console.error("changePartnerPassword Error:", error);
    return res.status(500).json({ success: false, message: "Error updating password" });
  }
};


module.exports = {
  signUp,
  forgotPassword,
  login,
  sendConfirmationEmail,
  sendResetPasswordEmail,
  resetPassword,
  logout,
  verifyOtp,
  updatePassword,
  getAllPartners,
  updatePartnerProfile,
  getPartnerByEmail,
  getPartnerProfilePic,
  createInternalPartner,
  getAllInternalPartners,
  updateInternalPartner,
  toggleInternalPartnerStatus,
  resetInternalPartnerPassword,
  changePartnerPassword,
};

