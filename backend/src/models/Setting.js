const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  // Singleton pattern, usually only one document exists.
  restaurantName: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  logoUrl: { type: String },
  
  // Tax & Currency configs
  currencySymbol: { type: String, default: '$' },
  currencyCode: { type: String, default: 'USD' },
  defaultTaxRatePercent: { type: Number, default: 0 },
  taxName: { type: String, default: 'Tax' }, // e.g., VAT, GST, Sales Tax
  includeTaxInMenuPrice: { type: Boolean, default: false },

  // Receipt details
  receiptHeader: { type: String },
  receiptFooter: { type: String },
  
  // Operational Details
  operatingHours: { type: mongoose.Schema.Types.Mixed }, // flexible JSON object for schedules
  isCurrentlyOpen: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
