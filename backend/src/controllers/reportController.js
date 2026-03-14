const reportService = require('../services/reportService');

const getDailySales = async (req, res) => {
  try {
    const { date } = req.query; // e.g., '2026-03-14'
    if (!date) return res.status(400).json({ message: 'Date query param required' });

    const report = await reportService.getDailySales(date);
    res.json(report.length ? report[0] : { totalSales: 0, totalOrders: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDailySales };
