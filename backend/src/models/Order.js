const mongoose = require('mongoose');

// Mongoose Schema
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true }, // e.g., ORD-260314-001
  tableNumber: { type: Number },
  orderType: { 
    type: String, 
    enum: ['Dine-In', 'Takeaway', 'Delivery'], 
    default: 'Dine-In' 
  },
  waiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['Pending', 'Cooking', 'Served', 'Billed', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  subTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  paymentStatus: { 
    type: String, 
    enum: ['Unpaid', 'Partial', 'Paid', 'Refunded'], 
    default: 'Unpaid' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
