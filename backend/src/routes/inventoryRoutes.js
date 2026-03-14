const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.route('/')
  .get(inventoryController.getInventory)
  .post(inventoryController.createInventoryItem);

router.put('/:id/stock', inventoryController.updateStock);

module.exports = router;
