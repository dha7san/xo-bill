const mongoose = require('mongoose');

const printerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['USB', 'LAN'], 
    required: true 
  },
  
  // For LAN
  host: { type: String }, 
  port: { type: Number, default: 9100 },
  
  // For USB (if handled by a local proxy, otherwise browser handles it)
  vendorId: { type: String },
  productId: { type: String },

  // Role
  role: {
    type: String,
    enum: ['Receipt', 'Kitchen', 'Bar', 'Label'],
    default: 'Receipt'
  },
  
  isActive: { type: Boolean, default: true },
  status:   { type: String, enum: ['online', 'offline', 'error'], default: 'online' },
  lastUsed: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Printer', printerSchema);
