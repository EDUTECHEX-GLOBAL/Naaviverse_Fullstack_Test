const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  city: { type: String, default: 'Unknown' },
  region: { type: String, default: 'Unknown' },
  postalCode: { type: String, default: 'Unknown' },
  country: { type: String, default: 'Unknown' },
  countryCode: { type: String, default: '' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  timezone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
