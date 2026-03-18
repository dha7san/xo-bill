const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  skuCode:     { type: String },
  type:        { type: String, enum: ['restock', 'deduction', 'adjustment', 'initial'], required: true },
  quantity:    { type: Number, required: true },
  action:      { type: String }, // e.g. 'Order #123'
  previousStock: { type: Number },
  newStock:      { type: Number },
}, { timestamps: true });

inventoryLogSchema.index({ inventoryId: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
