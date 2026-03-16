const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  menuItemId: Number,
  name:       String,
  qty:        Number,
  price:      Number,
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderNumber:   { type: String, required: true, unique: true },
  storeId:       { type: String, default: 'default' },
  terminalId:    { type: String, default: 'terminal-1' },
  tableNumber:   { type: Number, required: true },
  items:         [OrderItemSchema],
  subTotal:      Number,
  gst:           Number,
  totalAmount:   { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card'], default: 'Cash' },
  orderType:     { type: String, default: 'Dine-In' },
  status:        { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
  syncedFrom:    String,          // 'online' | 'offline-sync'
}, { timestamps: true });

// Index for fast daily report queries
OrderSchema.index({ storeId: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', OrderSchema);
