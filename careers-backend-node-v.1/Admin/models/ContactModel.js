const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  message:   { type: String, required: true },
  repliedBy: { type: String, default: 'Admin' },
  repliedAt: { type: Date, default: Date.now },
}, { _id: true });

const contactSchema = new mongoose.Schema({
  fullName:    { type: String, required: true, trim: true },
  email:       { type: String, required: true, trim: true, lowercase: true },
  product:     { type: String, default: 'OTHER', trim: true },
  inquiryType: { type: String, default: '', trim: true },
  question:    { type: String, default: '', trim: true },
  mobile:      { type: String, default: '', trim: true },
  message:     { type: String, default: '', trim: true },
  source:      { type: String, default: 'Landing Page', trim: true },
  status: {
    type: String,
    enum: ['Pending', 'Replied', 'Resolved'],
    default: 'Pending',
  },
  replies:   [replySchema],
  reply:     { type: String, default: '' },
  repliedAt: { type: Date },
  repliedBy: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);
