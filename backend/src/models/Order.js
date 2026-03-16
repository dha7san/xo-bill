const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true }, // E.g. ORD-20231015-001
  
  orderType: { 
    type: String, 
    enum: ['Dine-In', 'Takeaway', 'Delivery'], 
    default: 'Dine-In' 
  },
  
  // For Dine-In
  tableNumber: { type: String },
  guestCount: { type: Number, default: 1 },

  // For Delivery / CRM
  customer: {
    name: { type: String },
    phone: { type: String },
    address: { type: String }
  },

  // Staff assigned
  waiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Workflow Status
  status: { 
    type: String, 
    enum: ['Open', 'Sent to Kitchen', 'Partial Served', 'Served', 'Billed', 'Completed', 'Cancelled'],
    default: 'Open'
  },

  // Financials
  subTotal: { type: Number, default: 0, required: true },
  taxTotal: { type: Number, default: 0, required: true },
  discountTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0, required: true },
  
  discountReason: { type: String }, // e.g., 'Coupon', 'Manager Comp'
  
  paymentStatus: { 
    type: String, 
    enum: ['Unpaid', 'Partial', 'Paid', 'Refunded'], 
    default: 'Unpaid' 
  },
  
  notes: { type: String }
}, { 
  timestamps: true 
});

// Calculate totals efficiently via indexing
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ waiterId: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
