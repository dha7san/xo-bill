import { socketService } from './socketService';

class PrintManager {
  constructor() {
    this.isPrinting = false;
    this.queue = [];
  }

  init() {
    this.stopListener = socketService.on('print.requested', (job) => {
      console.log('🖨️ New print job received:', job);
      if (job.type === 'USB') {
        this.addToQueue(job);
      }
    });

    // Worker loop
    this.interval = setInterval(() => this.processQueue(), 2000);
  }

  addToQueue(job) {
    this.queue.push(job);
  }

  async processQueue() {
    if (this.isPrinting || this.queue.length === 0) return;

    this.isPrinting = true;
    const job = this.queue[0];

    try {
      await this.usbPrint(job.payload);
      this.queue.shift(); // Remove on success
      console.log('✅ Background print success:', job.id);
    } catch (err) {
      console.error('❌ Background print failed:', err.message);
      // Optional: Logic to stop worker or notify user
    } finally {
      this.isPrinting = false;
    }
  }

  /**
   * Web Serial API wrapper for Thermal Printing
   */
  async usbPrint(binaryData) {
    if (!navigator.serial) {
      throw new Error('Web Serial API not supported in this browser.');
    }

    let port;
    try {
      const ports = await navigator.serial.getPorts();
      if (ports.length === 0) {
        // We can't requestPort() in background, it requires user gesture
        throw new Error('No permission for any USB Serial ports. Please use the Print button once to authorize.');
      }
      port = ports[0];
      
      await port.open({ baudRate: 9600 });
      const writer = port.writable.getWriter();
      
      // Data is usually a base64 or raw string from backend
      // Backend sendToLan uses Buffer.from(r, 'binary')
      // Let's assume binaryData is a base64 string or ArrayBuffer
      const data = typeof binaryData === 'string' 
        ? new TextEncoder().encode(binaryData) 
        : new Uint8Array(binaryData);

      await writer.write(data);
      writer.releaseLock();
      await port.close();
    } catch (err) {
      if (port && port.opened) await port.close();
      throw err;
    }
  }

  destroy() {
    if (this.stopListener) this.stopListener();
    if (this.interval) clearInterval(this.interval);
  }
}

export const printManager = new PrintManager();
