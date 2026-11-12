const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

const partnerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  partnerId: { type: String, unique: true, sparse: true },
  username: { type: String },
  password: { type: String, required: true },
  userType: { type: String },
  OTP: { type: String },
  OTPCreatedTime: { type: Date },
  OTPAttempts: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  OTPverified: { type: Boolean, default: false },
  resetOtpVerified: { type: Boolean, default: false },
  status: { type: Boolean, default: false },

  firstName: { type: String },
  lastName: { type: String },
  businessName: { type: String },
  logo: { type: String },
  street: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  country: { type: String },
  description: { type: String },
  website: { type: String },
  phone: { type: String },
  phoneNumber: { type: String },

  // [ERROR] OLD generic field: type
  // type: { type: String },

  // [OK] Partner Category & Type
  partnerType: {
    type: String,
    default: "Distributor"
  },

  // [OK] Internal Partner management fields
  creationSource: {
    type: String,
    enum: ["self_registered", "admin_created"],
    default: "self_registered"
  },

  mustChangePassword: {
    type: Boolean,
    default: false
  },

  createdBy: {
    type: String,
    default: "self_registered"
  },

  accountStatus: {
    type: String,
    enum: ["active", "inactive", "pending"],
    default: "pending"
  },

  yourPosition: { type: String }
}, {
  timestamps: true
});

// Normalize email and hash password before save
partnerSchema.pre("save", async function (next) {
  if (this.email) {
    this.email = this.email.trim().toLowerCase();
  }
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Safe OTP expiry check (fixes "OTP expired" issue)
partnerSchema.methods.isOTPExpired = function () {
  if (!this.OTPCreatedTime) return true;

  const created = new Date(this.OTPCreatedTime).getTime();
  const now = Date.now();

  const diffMinutes = (now - created) / (1000 * 60); // convert to minutes

  return diffMinutes > 10; // OTP valid for 10 minutes matching email text
};

// Password match
partnerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('naavi_partners', partnerSchema);
