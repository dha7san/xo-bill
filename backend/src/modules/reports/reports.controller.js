const { asyncHandler } = require('../../shared/middleware/errorHandler');
const reportService     = require('./reports.service');

const daily = asyncHandler(async (req, res) => {
  const storeId = req.user?.storeId ?? 'default';
  const date    = req.query.date ? new Date(req.query.date) : new Date();
  const report  = await reportService.daily(storeId, date);
  res.json(report);
});

const range = asyncHandler(async (req, res) => {
  const storeId = req.user?.storeId ?? 'default';
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from and to dates required' });
  const report = await reportService.range(storeId, from, to);
  res.json(report);
});

module.exports = { daily, range };
