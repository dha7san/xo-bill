const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  isAvailable: { type: Boolean, default: true },
  isVeg: { type: Boolean, default: true },
  image: { type: String }, // URL to image
  inventoryItemRef: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Inventory' 
  } // Directly link to stock if 1:1, else complex recipe logic is needed
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
