const inventoryService = require('../services/inventoryService');

const getInventory = async (req, res) => {
  try { res.json(await inventoryService.getInventory()); } 
  catch (error) { res.status(500).json({ message: error.message }); }
};

const createInventoryItem = async (req, res) => {
  try { res.status(201).json(await inventoryService.createInventoryItem(req.body)); } 
  catch (error) { res.status(400).json({ message: error.message }); }
};

const updateStock = async (req, res) => {
  try { res.json(await inventoryService.updateStock(req.params.id, req.body.quantity)); } 
  catch (error) { res.status(400).json({ message: error.message }); }
};

module.exports = { getInventory, createInventoryItem, updateStock };
