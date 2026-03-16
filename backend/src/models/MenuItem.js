const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  
  // Base pricing
  basePrice: { type: Number, required: true, min: 0 },
  
  // Cost tracking
  costPrice: { type: Number, default: 0, min: 0 },
  
  // Variations e.g., Small, Medium, Large
  variations: [{
    name: { type: String, required: true },
    price: { type: Number, required: true }, // Absolute price or additional
    costPrice: { type: Number, default: 0 }
  }],
  
  // Modifiers e.g., Extra Cheese, No Onion
  modifiers: [{
    name: { type: String, required: true },
    price: { type: Number, default: 0 } // Extra added cost
  }],

  // Metadata
  dietary: {
    isVeg: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
    containsNuts: { type: Boolean, default: false }
  },

  preparationTimeMin: { type: Number, default: 10 }, // estimated mins to prep
  imageUrl: { type: String },
  
  // Taxation overrides (if applies differently than global setting)
  taxRatePercent: { type: Number, default: null },

  // Inventory Integration (Optional Recipe Link)
  recipeLink: [{
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    quantityUsed: { type: Number, required: true }
  }],

  isAvailable: { type: Boolean, default: true },
  barcodeOptions: { type: String, index: true, sparse: true }
}, { 
  timestamps: true 
});

menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' }); // Text search capabilities

module.exports = mongoose.model('MenuItem', menuItemSchema);
