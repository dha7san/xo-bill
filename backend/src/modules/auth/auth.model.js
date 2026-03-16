const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },                  // bcrypt hash
  role:     { type: String, enum: ['cashier', 'manager', 'admin'], default: 'cashier' },
  storeId:  { type: String, default: 'default' },
  active:   { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
