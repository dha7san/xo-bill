const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  skuCode: { type: String, unique: true },
  quantityInStock: { type: Number, required: true, default: 0 },
  unit: { 
    type: String, 
    enum: ['kg', 'g', 'L', 'ml', 'pcs', 'bottles'], 
    required: true 
  },
  minimumStockLevel: { type: Number, default: 10 }, // Triggers low stock alert
  costPerUnit: { type: Number },
  lastRestockedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
