const Inventory = require('../models/Inventory');

const getInventory = async () => await Inventory.find({});
const createInventoryItem = async (data) => await Inventory.create(data);
const updateStock = async (id, qty) => await Inventory.findByIdAndUpdate(id, { $inc: { quantityInStock: qty } }, { new: true });

module.exports = { getInventory, createInventoryItem, updateStock };
