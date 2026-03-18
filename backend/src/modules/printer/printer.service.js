const net = require('net');
const Printer = require('./printer.model');
const logger = require('../../shared/utils/logger');
const { getRedis } = require('../../shared/db/redis');
const { publish, CHANNELS } = require('../../shared/events/eventBus');

const PRINT_QUEUE_KEY = 'print:queue:jobs';
const RETRY_LIMIT = 3;
const RETRY_DELAY = 5000; 

class PrinterService {
  /**
   * Main entry point to print an order or receipt
   */
  async print(order, options = {}) {
    const role = options.role || 'Receipt';
    const printers = await Printer.find({ role, isActive: true });

    if (!printers.length) {
      logger.warn(`No active printers found for role: ${role}`);
      return this.queueForLocal(order);
    }

    const results = [];
    for (const printer of printers) {
      const payload = (role === 'Kitchen' || role === 'Bar') ? this._buildKot(order) : this._buildReceipt(order);
      
      if (printer.type === 'LAN') {
        results.push(this.sendWithPayload(printer, payload));
      } else {
        results.push(this.queueForLocal(order, printer, payload));
      }
    }
    return Promise.all(results);
  }

  async sendWithPayload(printer, payload, attempt = 1) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.setTimeout(3000);

      client.connect(printer.port, printer.host, () => {
        client.write(payload, 'binary', () => {
          logger.info(`Successfully printed to LAN: ${printer.name}`);
          client.destroy();
          resolve({ success: true, printer: printer.name });
        });
      });

      const handleError = async (err) => {
        client.destroy();
        logger.error(`Print failed for ${printer.name} (Attempt ${attempt}/${RETRY_LIMIT}): ${err.message}`);
        
        if (attempt < RETRY_LIMIT) {
          setTimeout(() => resolve(this.sendWithPayload(printer, payload, attempt + 1)), RETRY_DELAY);
        } else {
          await Printer.findByIdAndUpdate(printer._id, { status: 'offline' });
          reject(err);
        }
      };

      client.on('error', handleError);
      client.on('timeout', () => handleError(new Error('Timeout')));
    });
  }

  async queueForLocal(order, printer = null, customPayload = null) {
    const job = {
      id: order.orderNumber || Date.now().toString(),
      printerId: printer?._id,
      printerName: printer?.name || 'Default USB',
      type: 'USB',
      payload: customPayload || this._buildReceipt(order),
      createdAt: new Date()
    };

    const redis = await getRedis();
    if (redis) await redis.rpush(PRINT_QUEUE_KEY, JSON.stringify(job));
    await publish(CHANNELS.PRINT_REQUESTED, job);
    return { success: true, queued: true, job };
  }

  async getAllPrinters() {
    return Printer.find();
  }

  async addPrinter(data) {
    return Printer.create(data);
  }

  async deletePrinter(id) {
    return Printer.findByIdAndDelete(id);
  }

  _buildKot(order) {
    const { tableNumber, orderNumber, items, orderType } = order;
    const ESC = '\x1b', GS = '\x1d';
    let r = ESC + '@' + ESC + 'a\x01' + ESC + '!\x30' + 'K.O.T\n' + ESC + '!\x00'; 
    r += `Table: ${tableNumber || 'N/A'}\n`;
    r += `Order: #${(orderNumber || '').slice(-4).toUpperCase()}\n`;
    r += `Type: ${orderType || 'Dine-In'}\n`;
    r += '--------------------------------\n' + ESC + 'a\x00';
    
    (items || []).forEach(item => {
      r += ESC + '!\x10' + `${item.qty} x ${item.name}` + ESC + '!\x00\n'; 
      if (item.notes) r += `   >> ${item.notes}\n`;
    });
    
    r += '--------------------------------\n';
    r += `Time: ${new Date().toLocaleTimeString()}\n\n\n\n` + GS + 'V\x41\x03';
    return Buffer.from(r, 'binary');
  }

  _buildReceipt(order) {
    const { tableNumber, items, grandTotal, totalAmount, paymentMethod } = order;
    const finalTotal = totalAmount || grandTotal || 0;
    
    const ESC = '\x1b', GS = '\x1d';
    const INIT = ESC + '@';
    const CENTER = ESC + 'a\x01';
    const LEFT = ESC + 'a\x00';
    
    let r = INIT;
    r += CENTER + ESC + 'E\x01' + 'XOPOS BILLING\n' + ESC + 'E\x00';
    r += `Table: ${tableNumber || 'N/A'}\n`;
    r += '--------------------------------\n';
    r += LEFT;
    
    (items || []).forEach(item => {
      const name = item.name.substring(0, 20).padEnd(20);
      const val = String(item.qty * (item.price || 0)).padStart(11);
      r += `${name}${val}\n`;
    });
    
    r += '--------------------------------\n';
    r += CENTER + ESC + 'E\x01' + `TOTAL: Rs.${finalTotal.toFixed(2)}\n` + ESC + 'E\x00';
    r += `Payment: ${paymentMethod || 'Unpaid'}\n`;
    r += '\n\n\n\n' + GS + 'V\x41\x03'; 
    
    return Buffer.from(r, 'binary');
  }
}

module.exports = new PrinterService();
