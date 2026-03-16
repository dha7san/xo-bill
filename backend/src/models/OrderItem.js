const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  
  // Selected configuration
  menuItemName: { type: String, required: true }, // snapshot of name at time of order
  variant: {
    name: { type: String },
    price: { type: Number, default: 0 }
  },
  modifiers: [{
    name: { type: String },
    price: { type: Number, default: 0 }
  }],
  
  quantity: { type: Number, required: true, min: 1 },
  
  // Pricing Snapshot
  unitPrice: { type: Number, required: true }, // Base Price + Variant + Modifiers
  totalPrice: { type: Number, required: true }, // unitPrice * qty
  taxAmount: { type: Number, default: 0 }, // calculated tax for this specific item

  notes: { type: String }, // e.g. "extra spicy"

  // Kitchen Display System (KDS) Status
  status: { 
    type: String, 
    enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Cancelled'],
    default: 'Pending'
  },
  
  sentToKitchenAt: { type: Date },
  preparedAt: { type: Date },
  servedAt: { type: Date }
}, {
  timestamps: true
});

orderItemSchema.index({ orderId: 1 });
orderItemSchema.index({ status: 1, createdAt: 1 }); // For KDS Queue list
orderItemSchema.index({ menuItem: 1 }); // for sales analytics

module.exports = mongoose.model('OrderItem', orderItemSchema);
