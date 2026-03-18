const { asyncHandler } = require('../../shared/middleware/errorHandler');
const orderService      = require('./orders.service');

// Inject io from app context so service can broadcast
const withIo = (req) => ({ io: req.app.get('io') });

const createOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(req.body, withIo(req));
  res.status(result.duplicate ? 200 : 201).json(result);
});

// POST /orders/sync-batch — accepts array of offline orders
const syncBatch = asyncHandler(async (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders) || orders.length === 0) {
    return res.status(400).json({ error: 'orders[] array required' });
  }
  const summary = await orderService.syncBatch(orders, withIo(req));
  res.json(summary);
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrder(req.params.id);
  res.json(order);
});

const listOrders = asyncHandler(async (req, res) => {
  const storeId = req.user?.storeId ?? 'default';
  const orders  = await orderService.listOrders(storeId, req.query);
  res.json(orders);
});

const updateKdsStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { kdsStatus } = req.body;
  const order = await orderService.updateKdsStatus(id, kdsStatus, withIo(req));
  res.json(order);
});

module.exports = { createOrder, syncBatch, getOrder, listOrders, updateKdsStatus };
