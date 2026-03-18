const Joi = require('joi');

/**
 * Common Validation Schemas using Joi.
 */
const schemas = {
  // 1. Auth Schemas
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
  register: Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  // 2. Inventory Schemas
  createInventoryItem: Joi.object({
    itemName: Joi.string().min(2).required(),
    skuCode: Joi.string().required(),
    unitOfMeasure: Joi.string().valid('kg', 'g', 'L', 'ml', 'piece', 'box').required(),
    currentStock: Joi.number().min(0).required(),
    reorderLevel: Joi.number().min(0).required(),
    unitCost: Joi.number().min(0).required(),
  }),
  updateInventoryStock: Joi.object({
    quantity: Joi.number().required(), // positive or negative
  }),

  // 3. Order Schemas
  createOrder: Joi.object({
    items: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      qty: Joi.number().integer().min(1).required(),
      price: Joi.number().min(0).required(),
      menuItemId: Joi.string().required(),
    })).min(1).required(),
    totalAmount: Joi.number().min(0).required(),
    tableNumber: Joi.number().required(),
    paymentMethod: Joi.string().valid('Cash', 'UPI', 'Card', 'Credit').required(),
  }),
};

module.exports = schemas;
