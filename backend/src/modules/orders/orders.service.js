const orderRepo   = require('./orders.repository');
const eventBus    = require('../../shared/events/eventBus');
const { CHANNELS } = require('../../shared/events/eventBus');
const inventoryService = require('../inventory/inventory.service');


class OrderService {
  async createOrder(dto, { io } = {}) {
    const { items, totalAmount, tableNumber, paymentMethod, payments,
            orderType, storeId, branchId, terminalId, orderNumber, timestamp } = dto;

    // Idempotency: skip if already synced
    const existing = await orderRepo.findByOrderNumber(orderNumber);
    if (existing) return { order: existing, duplicate: true };

    const subTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const gst      = subTotal * Number(process.env.GST_RATE ?? 0.05);

    const order = await orderRepo.create({
      orderNumber,
      storeId:       storeId || 'default',
      branchId:      branchId || 'main',
      terminalId:    terminalId || 'terminal-1',
      tableNumber,
      items,
      subTotal,
      gst,
      totalAmount,
      payments:      payments || [],
      paymentMethod,
      orderType,
      status:     'completed',
      kdsStatus:  'pending',
      syncedFrom: dto.syncedFrom || 'online',
      createdAt:  timestamp ? new Date(timestamp) : undefined,
    });

    // Deduce Inventory (Automatically lookup recipes)
    const stockUpdates = await inventoryService.deductByOrder(items, orderNumber).catch(err => {
      console.error('Inventory deduction failed:', err.message);
      return [];
    });

    // Broadcast stock updates via Socket.io so terminals update live
    if (io && stockUpdates.length > 0) {
      stockUpdates.forEach(({ skuCode, newStock }) => {
        io.to(`store:${order.storeId}`).emit('inventory.updated', { ingredientId: skuCode, newStock });
      });
    }

    // Broadcast via WebSocket if io is available
    if (io) {
      io.to(`store:${order.storeId}`).emit('order.created', order.toObject());
      io.to(`branch:${order.branchId}`).emit('kds.new_order', order.toObject());
    }

    return { order, duplicate: false };
  }

  // Offline batch sync
  async syncBatch(orders, { io } = {}) {
    const results = await Promise.allSettled(
      orders.map(o => this.createOrder(o, { io }))
    );
    return {
      synced:     results.filter(r => r.status === 'fulfilled' && !r.value?.duplicate).length,
      duplicates: results.filter(r => r.status === 'fulfilled' && r.value?.duplicate).length,
      failed:     results.filter(r => r.status === 'rejected').length,
    };
  }

  async getOrder(id) {
    const order = await orderRepo.findById(id);
    if (!order) { const e = new Error('Order not found'); e.status = 404; throw e; }
    return order;
  }

  async listOrders(storeId, query) {
    return orderRepo.findByStore(storeId, query);
  }

  async updateKdsStatus(id, kdsStatus, { io } = {}) {
    const order = await orderRepo.findById(id);
    if (!order) throw new Error('Order not found');

    order.kdsStatus = kdsStatus;
    if (kdsStatus === 'prepared') order.preparedAt = new Date();
    await order.save();

    if (io) {
      io.to(`branch:${order.branchId}`).emit('kds.status_updated', { id, kdsStatus });
      io.to(`store:${order.storeId}`).emit('order.updated', { id, kdsStatus });
    }
    return order;
  }
}

module.exports = new OrderService();
