const net = require('net');
const Printer = require('./printer.model');
const logger = require('../../shared/utils/logger');
const { getRedis } = require('../../shared/db/redis');
const { publish, CHANNELS } = require('../../shared/events/eventBus');

const PRINT_QUEUE_KEY = 'print:queue:jobs';
const RETRY_LIMIT = 3;
const RETRY_DELAY = 5000; // 5 seconds

class PrinterService {
  /**
   * Main entry point to print an order or receipt
   */
  async print(order, options = {}) {
    // 1. Find suitable printers for the role
    const printers = await Printer.find({ 
      role: options.role || 'Receipt', 
      isActive: true 
    });

    if (!printers.length) {
      logger.warn(`No active printers found for role: ${options.role || 'Receipt'}`);
      // Fallback: Queue for browser pickup if no LAN printer is available
      return this.queueForLocal(order);
    }

    const results = [];
    for (const printer of printers) {
      if (printer.type === 'LAN') {
        results.push(this.sendToLan(printer, order));
      } else {
        // USB/Local printers are queued for the browser to pick up via Socket/Polling
        results.push(this.queueForLocal(order, printer));
      }
    }

    return Promise.all(results);
  }

  /**
   * Directly send to a LAN printer via TCP
   */
  async sendToLan(printer, order, attempt = 1) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      const timeout = 3000;

      client.setTimeout(timeout);

      client.connect(printer.port, printer.host, () => {
        const data = this._buildReceipt(order);
        client.write(data, 'binary', () => {
          logger.info(`Successfully printed to LAN: ${printer.name} (${printer.host})`);
          client.destroy();
          resolve({ success: true, printer: printer.name });
        });
      });

      const handleError = async (err) => {
        client.destroy();
        logger.error(`Print failed for ${printer.name} (Attempt ${attempt}/${RETRY_LIMIT}): ${err.message}`);
        
        if (attempt < RETRY_LIMIT) {
          setTimeout(async () => {
            try {
              const retryRes = await this.sendToLan(printer, order, attempt + 1);
              resolve(retryRes);
            } catch (rErr) {
              reject(rErr);
            }
          }, RETRY_DELAY);
        } else {
          // If all retries fail, mark printer as offline and notify
          await Printer.findByIdAndUpdate(printer._id, { status: 'offline' });
          reject(new Error(`Failed to print to ${printer.name} after ${RETRY_LIMIT} attempts`));
        }
      };

      client.on('error', handleError);
      client.on('timeout', () => handleError(new Error('Printer connection timeout')));
    });
  }

  /**
   * Queue for local (USB) printing via frontend
   */
  async queueForLocal(order, printer = null) {
    const job = {
      id: order.orderNumber || Date.now().toString(),
      printerId: printer?._id,
      printerName: printer?.name || 'Default USB',
      type: 'USB',
      payload: this._buildReceipt(order),
      createdAt: new Date()
    };

    const redis = await getRedis();
    if (redis) {
      await redis.rpush(PRINT_QUEUE_KEY, JSON.stringify(job));
    }
    
    // Notify connected terminals that a print job is ready
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

  _buildReceipt(order) {
    const { tableNumber, items, grandTotal, totalAmount, paymentMethod } = order;
    const finalTotal = totalAmount || grandTotal || 0;
    
    const ESC = '\x1b', GS = '\x1d', LF = '\x0a';
    const INIT = ESC + '@';
    const BOLD_ON = ESC + 'E\x01';
    const BOLD_OFF = ESC + 'E\x00';
    const CENTER = ESC + 'a\x01';
    const LEFT = ESC + 'a\x00';
    
    let r = INIT;
    r += CENTER + BOLD_ON + 'XOPOS BILLING\n' + BOLD_OFF;
    r += `Table: ${tableNumber || 'N/A'}\n`;
    r += '--------------------------------\n';
    r += LEFT;
    
    (items || []).forEach(item => {
      const name = item.name.substring(0, 20).padEnd(20);
      const val = String(item.qty * item.price).padStart(11);
      r += `${name}${val}\n`;
    });
    
    r += '--------------------------------\n';
    r += CENTER + BOLD_ON + `TOTAL: Rs.${finalTotal.toFixed(2)}\n` + BOLD_OFF;
    r += `Payment: ${paymentMethod || 'Unpaid'}\n`;
    r += '\n\n\n\n' + GS + 'V\x41\x03'; // Cut
    
    return Buffer.from(r, 'binary');
  }
}

module.exports = new PrinterService();
