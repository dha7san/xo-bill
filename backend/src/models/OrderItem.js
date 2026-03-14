const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true,
    index: true // Important for querying items by order
  },
  menuItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MenuItem', 
    required: true 
  },
  nameSnapshot: { type: String, required: true }, // Save name at time of order
  priceSnapshot: { type: Number, required: true }, // Save price at time of order
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true },
  notes: { type: String }, // e.g., "Extra spicy"
  status: { 
    type: String, 
    enum: ['Pending', 'Preparing', 'Served', 'Cancelled'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('OrderItem', orderItemSchema);
