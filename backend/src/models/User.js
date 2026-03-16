const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  pin: { type: String, required: true }, // Quick POS login 4-digit PIN
  role: { 
    type: String, 
    enum: ['Admin', 'Manager', 'Cashier', 'Waitstaff', 'Kitchen'], 
    default: 'Waitstaff' 
  },
  phone: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for login performance
userSchema.index({ email: 1 });
userSchema.index({ pin: 1, isActive: 1 });

module.exports = mongoose.model('User', userSchema);
