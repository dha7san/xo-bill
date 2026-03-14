const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true }, // securely hashed
  pin: { type: String, required: true }, // 4-digit PIN for quick POS login
  role: { 
    type: String, 
    enum: ['Admin', 'Cashier', 'Waitstaff', 'Kitchen'], 
    default: 'Waitstaff' 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
