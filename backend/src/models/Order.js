const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
    },
    items: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['Pending', 'Cooking', 'Served', 'Paid'],
      default: 'Pending',
    },
    gstRate: {
      type: Number,
      default: 5, // typical restaurant GST
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Unpaid'],
      default: 'Unpaid',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
