const { asyncHandler } = require('../../shared/middleware/errorHandler');
const inventoryService = require('./inventory.service');

// GET /api/inventory  — list all or filter by ?status=low|out
const getInventory = asyncHandler(async (req, res) => {
  const inventory = await inventoryService.getInventory(req.query);
  res.json(inventory);
});

// POST /api/inventory  — create a single item
const createItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.createInventoryItem(req.body);
  res.status(201).json(item);
});

// PUT /api/inventory/:id  — full update by _id
const updateItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.updateInventoryItem(req.params.id, req.body);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json(item);
});

// PATCH /api/inventory/:id/stock  — adjust stock by _id (positive = add, negative = deduct)
const updateStock = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const item = await inventoryService.updateStock(req.params.id, quantity);
  res.json(item);
});

// PATCH /api/inventory/sku/:skuCode/restock  — add stock by SKU code
const restockBySku = asyncHandler(async (req, res) => {
  const { qty } = req.body;
  if (!qty || Number(qty) <= 0) return res.status(400).json({ message: 'qty must be positive' });
  const item = await inventoryService.restockBySku(req.params.skuCode, qty);
  res.json(item);
});

// PATCH /api/inventory/sku/:skuCode/minstock  — update reorder level by SKU code
const updateMinStockBySku = asyncHandler(async (req, res) => {
  const { reorderLevel } = req.body;
  if (reorderLevel == null || Number(reorderLevel) < 0) {
    return res.status(400).json({ message: 'reorderLevel must be non-negative' });
  }
  const item = await inventoryService.updateMinStockBySku(req.params.skuCode, reorderLevel);
  res.json(item);
});

// POST /api/inventory/deduct  — bulk deduct when an order is placed
// body: { deductions: [{ skuCode, qty }] }
const bulkDeduct = asyncHandler(async (req, res) => {
  const { deductions } = req.body;
  if (!Array.isArray(deductions) || deductions.length === 0) {
    return res.status(400).json({ message: 'deductions must be a non-empty array' });
  }
  const results = await inventoryService.bulkDeduct(deductions);

  // Emit real-time update via Socket.IO so other terminals see the changes
  const io = req.app.get('io');
  if (io) {
    results.forEach(({ skuCode, newStock }) => {
      io.emit('inventory.updated', { ingredientId: skuCode, newStock });
    });
  }

  res.json({ success: true, updated: results });
});

// POST /api/inventory/seed  — seed default ingredients (skips existing ones)
// body: { items: [...] }  (no auth needed on first run — route is protected by authMiddleware)
const seed = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items must be a non-empty array' });
  }
  const results = await inventoryService.seed(items);
  res.json({ success: true, results });
});

// GET /api/inventory/alerts  — items at or below reorder level
const getAlerts = asyncHandler(async (req, res) => {
  const alerts = await inventoryService.getLowStockAlerts();
  res.json(alerts);
});

// GET /api/inventory/logs — get history of stock changes
const getLogs = asyncHandler(async (req, res) => {
  const logs = await inventoryService.getLogs(req.query);
  res.json(logs);
});

module.exports = {
  getInventory,
  createItem,
  updateItem,
  updateStock,
  restockBySku,
  updateMinStockBySku,
  bulkDeduct,
  seed,
  getAlerts,
  getLogs
};
