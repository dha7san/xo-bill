import axios from 'axios';
import { localDB } from './db';
import { CONFIG } from '../config';

/**
 * SyncManager
 * Implements exponential backoff, atomic batching, and conflict handling.
 */
class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.MAX_RETRIES = 6;
    this.RETRY_BASE_MS = 2000; // 2 seconds base
  }

  /**
   * Start periodic sync and setup network status handlers.
   * Auto-sync only runs if the navigator is online.
   */
  startAutoSync(intervalMs = 30000) {
    if (this.syncInterval) return;
    
    // Attempt sync immediately on start
    this.sync();
    
    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.sync();
      }
    }, intervalMs);

    // Also sync on browser online event (Immediate retry when internet is back)
    window.addEventListener('online', () => {
      console.log('🌐 Internet is back! Triggering immediate sync.');
      this.sync();
    });
  }

  /**
   * Main sync logic.
   * Processes only orders that are due for a retry.
   */
  async sync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const allPending = await localDB.getPendingOrders();
      if (allPending.length === 0) return;

      const now = Date.now();
      const readyToSync = allPending.filter(o => !o.nextRetry || o.nextRetry <= now);

      if (readyToSync.length > 0) {
        console.log(`🔄 SyncManager: Found ${readyToSync.length}/${allPending.length} orders due for retry.`);
        
        // Granular sync one-by-one to avoid batch failures blocking healthy orders
        for (const order of readyToSync) {
          await this.syncOne(order);
        }
      }
    } catch (err) {
      console.error('❌ SyncManager global error:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync an individual order with exponential backoff on failure.
   */
  async syncOne(order) {
    const token = localStorage.getItem('pos_token');
    
    try {
      // Backend automatically detects idempotency via order.payload.orderNumber
      // Conflict detection happens here (server responds with 200 for existing orders instead of 201)
      const response = await axios.post(`${CONFIG.apiBaseUrl}/orders`, order.payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.status === 201 || response.status === 200) {
        console.log(`✅ Synced order: ${order.id}`);
        await localDB.removeSyncedOrder(order.id);
      }
    } catch (err) {
      // Don't retry if the server explicitly tells us it's a structural error (400)
      if (err.response && (err.response.status === 400 || err.response.status === 403)) {
        console.error(`💥 Unfixable error on order ${order.id}:`, err.response.data.message);
        // Remove let manager investigate later? Or keep it as "error" status.
        return;
      }

      console.warn(`⚠️ Failed to sync order ${order.id} (Attempt ${order.retries + 1}):`, err.message);
      
      const nextRetryCount = (order.retries || 0) + 1;
      
      if (nextRetryCount >= this.MAX_RETRIES) {
        console.error(`💥 Order ${order.id} exhausted all retries. Marking for developer review.`);
        // Mark order as 'failed' in DB to stop auto-retrying
        await localDB.updateOrderRetry(order.id, nextRetryCount, Infinity);
        return;
      }

      // Calculate exponential backoff: 2^retries * base
      const delayMs = Math.pow(2, nextRetryCount) * this.RETRY_BASE_MS;
      const nextRetryTimestamp = Date.now() + delayMs;
      
      await localDB.updateOrderRetry(order.id, nextRetryCount, nextRetryTimestamp);
    }
  }

  /** --- Menu & Data Caching --- */

  /**
   * Cache fetched menu data locally for offline startup.
   */
  async cacheMenuData(categories, items) {
     await localDB.setCache('menu_categories', categories);
     await localDB.setCache('menu_items', items);
     console.log('📦 Menu data cached for offline use.');
  }

  /**
   * Retrieve cached menu data for offline mode.
   */
  async getCachedMenu() {
    const categories = await localDB.getCache('menu_categories');
    const items      = await localDB.getCache('menu_items');
    return (categories && items) ? { categories, items } : null;
  }
}

export const syncManager = new SyncManager();
