const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  // [OK] FIXED: role must be INSIDE schema
  role: {
    type: String,
    enum: ["admin", "super-admin"],
    default: "admin"
  },

  OTP: { type: String, default: null },
  OTPCreatedTime: { type: Date, default: null },
  resetOtpVerified: { type: Boolean, default: false }

}, { timestamps: true });


// [HOT] AUTO HASH PASSWORD
adminUserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


// [HOT] compare helper
adminUserSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('AdminUser', adminUserSchema);