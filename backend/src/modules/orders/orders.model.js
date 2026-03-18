const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  menuItemId:   { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null },
  inventoryId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', default: null },
  name:         { type: String, required: true },
  qty:          { type: Number, required: true, min: 1 },
  price:        { type: Number, required: true, min: 0 },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderNumber:   { type: String, required: true, unique: true },
  storeId:       { type: String, default: 'default' },
  terminalId:    { type: String, default: 'terminal-1' },
  tableNumber:   { type: mongoose.Schema.Types.Mixed, default: 1 }, // Accepts string or number
  items:         { type: [OrderItemSchema], required: true },
  subTotal:      { type: Number, default: 0 },
  gst:           { type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },
  discount:      { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Online', 'Other'], default: 'Cash' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'paid' },
  orderType:     { type: String, enum: ['Dine-In', 'Takeaway', 'Delivery'], default: 'Dine-In' },
  status:        { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
  syncedFrom:    { type: String, default: 'online' }, // 'online' | 'offline-sync'
  notes:         { type: String },
}, { timestamps: true });

// Index for fast daily report queries
OrderSchema.index({ storeId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
