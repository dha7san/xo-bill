const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  restaurantName: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  gstin: { type: String }, // Tax Registration Number
  taxConfiguration: [{
    taxName: { type: String }, // e.g., 'SGST', 'CGST'
    percentage: { type: Number },
    isActive: { type: Boolean, default: true }
  }],
  currencySymbol: { type: String, default: '₹' },
  receiptFooterText: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingsSchema);
