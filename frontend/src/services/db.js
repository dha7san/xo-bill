/**
 * XoPOS IndexedDB Service
 * Robust local persistence for offline-first operation.
 */

const DB_NAME = 'xopos_offline_db';
const DB_VERSION = 1;

export const STORES = {
  ORDERS_QUEUE: 'orders_queue',
  SYNC_META: 'sync_metadata'
};

class LocalDB {
  constructor() {
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Orders queue for unsynced orders
        if (!db.objectStoreNames.contains(STORES.ORDERS_QUEUE)) {
          db.createObjectStore(STORES.ORDERS_QUEUE, { keyPath: 'id' });
        }
        
        // Meta data for sync tracking
        if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
          db.createObjectStore(STORES.SYNC_META, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async execute(storeName, mode, callback) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // --- Orders Queue Helpers ---

  async savePendingOrder(order) {
    return this.execute(STORES.ORDERS_QUEUE, 'readwrite', (store) => {
      return store.put({
        ...order,
        status: 'pending',
        timestamp: new Date().toISOString(),
        retries: 0
      });
    });
  }

  async getPendingOrders() {
    return this.execute(STORES.ORDERS_QUEUE, 'readonly', (store) => {
      return store.getAll();
    });
  }

  async removeSyncedOrder(id) {
    return this.execute(STORES.ORDERS_QUEUE, 'readwrite', (store) => {
      return store.delete(id);
    });
  }

  async updateOrderRetry(id, retryCount) {
    const order = await this.execute(STORES.ORDERS_QUEUE, 'readonly', (store) => store.get(id));
    if (order) {
      order.retries = retryCount;
      return this.execute(STORES.ORDERS_QUEUE, 'readwrite', (store) => store.put(order));
    }
  }
}

export const localDB = new LocalDB();
