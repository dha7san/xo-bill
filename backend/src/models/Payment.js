const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  
  amount: { type: Number, required: true, min: 0 },
  
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Digital Wallet', 'Loyalty Points', 'Other'], 
    required: true 
  },
  
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'], 
    default: 'Completed' 
  },
  
  transactionReference: { type: String }, // External ID from payment gateway
  
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  tipsAmount: { type: Number, default: 0 },
  
  notes: { type: String }
}, {
  timestamps: true
});

paymentSchema.index({ orderId: 1, status: 1 });
paymentSchema.index({ createdAt: -1, status: 1 }); // End of day reconciliation
paymentSchema.index({ paymentMethod: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
