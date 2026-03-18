const { asyncHandler } = require('../../shared/middleware/errorHandler');
const billingService = require('./billing.service');

const checkout = asyncHandler(async (req, res) => {
  const result = await billingService.checkout(req.body, { io: req.app.get('io') });
  res.status(result.duplicate ? 200 : 201).json(result);
});

const getEstimate = asyncHandler(async (req, res) => {
  const estimate = billingService.calculateBill(req.body.items, req.body.discount);
  res.json(estimate);
});

module.exports = {
  checkout,
  getEstimate
};
