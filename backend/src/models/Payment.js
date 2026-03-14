const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  cashierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  amount: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Card', 'UPI', 'Wallet'], 
    required: true 
  },
  transactionId: { type: String }, // External reference from PG (e.g., Razorpay/UPI ref)
  status: { 
    type: String, 
    enum: ['Success', 'Failed', 'Refunded'], 
    default: 'Success' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
