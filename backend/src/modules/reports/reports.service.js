const orderRepo = require('../orders/orders.repository');

class ReportService {
  async daily(storeId, date) {
    const [revenue, topItems, payments] = await Promise.all([
      orderRepo.dailyRevenue(storeId, date),
      orderRepo.topItems(storeId, this._dayRange(date)),
      orderRepo.paymentBreakdown(storeId, this._dayRange(date)),
    ]);
    return {
      date:    (date ?? new Date()).toISOString().slice(0, 10),
      revenue: revenue.total,
      orders:  revenue.count,
      avgOrder: revenue.avgOrder,
      topItems,
      paymentBreakdown: payments,
    };
  }

  async range(storeId, from, to) {
    const [topItems, payments, orders] = await Promise.all([
      orderRepo.topItems(storeId, { from, to }),
      orderRepo.paymentBreakdown(storeId, { from, to }),
      orderRepo.findByStore(storeId, { from, to, limit: 500 }),
    ]);
    const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    return { from, to, revenue, orders: orders.length, topItems, paymentBreakdown: payments };
  }

  _dayRange(date = new Date()) {
    const d = new Date(date);
    const from = new Date(d); from.setHours(0, 0, 0, 0);
    const to   = new Date(d); to.setHours(23, 59, 59, 999);
    return { from, to };
  }
}

module.exports = new ReportService();
