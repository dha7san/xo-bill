const router = require('express').Router();
const inventoryController = require('./inventory.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');

router.use(authMiddleware);

// List & create
router.get('/',    inventoryController.getInventory);
router.post('/',   inventoryController.createItem);

// Low-stock alerts
router.get('/alerts', inventoryController.getAlerts);

// Bulk deduct (called when order is placed)
router.post('/deduct', inventoryController.bulkDeduct);

// Seed default data
router.post('/seed', inventoryController.seed);

// SKU-based shortcuts (used by frontend — avoids needing MongoDB _id)
router.patch('/sku/:skuCode/restock',  inventoryController.restockBySku);
router.patch('/sku/:skuCode/minstock', inventoryController.updateMinStockBySku);

// _id-based routes
router.put('/:id',          inventoryController.updateItem);
router.patch('/:id/stock',  inventoryController.updateStock);

module.exports = router;
