/**
 * XoPOS IndexedDB Service
 * Robust local persistence for offline-first operation.
 */

const DB_NAME = 'xopos_offline_db';
const DB_VERSION = 2; // Increment version for new stores

export const STORES = {
  ORDERS_QUEUE: 'orders_queue',
  SYNC_META: 'sync_metadata',
  CACHE: 'app_cache' // For menu, categories, settings
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

        // Cache for menu and categories
        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
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
      
      try {
        const request = callback(store);
        transaction.oncomplete = () => resolve(request ? request.result : null);
        transaction.onerror = (e) => {
          console.error(`IDB Error in ${storeName}:`, e);
          reject(transaction.error);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- Orders Queue Helpers ---

  async savePendingOrder(order) {
    return this.execute(STORES.ORDERS_QUEUE, 'readwrite', (store) => {
      return store.put({
        ...order,
        status: 'pending',
        timestamp: new Date().toISOString(),
        retries: 0,
        nextRetry: Date.now() // Ready for sync immediately
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

  async updateOrderRetry(id, retryCount, nextRetryMs) {
    const order = await this.execute(STORES.ORDERS_QUEUE, 'readonly', (store) => store.get(id));
    if (order) {
      order.retries = retryCount;
      order.nextRetry = nextRetryMs;
      return this.execute(STORES.ORDERS_QUEUE, 'readwrite', (store) => store.put(order));
    }
  }

  // --- Cache Helpers ---

  async setCache(key, data) {
    return this.execute(STORES.CACHE, 'readwrite', (store) => {
      return store.put({ key, data, updated_at: new Date().toISOString() });
    });
  }

  async getCache(key) {
    const result = await this.execute(STORES.CACHE, 'readonly', (store) => store.get(key));
    return result ? result.data : null;
  }

  async clearCache(key) {
    return this.execute(STORES.CACHE, 'readwrite', (store) => store.delete(key));
  }
}

export const localDB = new LocalDB();
