const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true, unique: true, trim: true },
  skuCode: { type: String, unique: true, sparse: true },
  
  category: { type: String, trim: true }, // e.g. 'Dairy', 'Vegetables', 'Meat'
  
  unitOfMeasure: { 
    type: String, 
    enum: ['kg', 'g', 'L', 'ml', 'piece', 'box'], 
    required: true 
  },
  
  currentStock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 }, // alert when currentStock <= reorderLevel
  
  unitCost: { type: Number, default: 0, required: true },
  
  supplierInfo: {
    name: { type: String },
    contact: { type: String }
  },
  
  lastRestockedDate: { type: Date }
}, {
  timestamps: true
});

inventorySchema.index({ currentStock: 1, reorderLevel: 1 }); // low stock alert queries
inventorySchema.index({ itemName: 'text' });

module.exports = mongoose.model('Inventory', inventorySchema);
