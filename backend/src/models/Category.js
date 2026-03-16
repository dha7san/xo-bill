const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true, default: '' },
  imageColorOrUrl: { type: String, default: '#FFFFFF' }, // fallback color or URL
  parentCategory: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    default: null 
  },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Index to efficiently list active categories sorted by displayOrder
categorySchema.index({ isActive: 1, displayOrder: 1 });
categorySchema.index({ parentCategory: 1 });

module.exports = mongoose.model('Category', categorySchema);
