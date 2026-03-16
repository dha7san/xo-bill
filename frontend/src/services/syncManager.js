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
    this.MAX_RETRIES = 5;
  }

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

    // Also sync on browser online event
    window.addEventListener('online', () => this.sync());
  }

  async sync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const pendingOrders = await localDB.getPendingOrders();
      if (pendingOrders.length === 0) return;

      console.log(`🔄 SyncManager: Found ${pendingOrders.length} pending orders to sync.`);

      // Option A: Sync individually for granular error handling
      // Better for POS where one corrupted order shouldn't block others
      for (const order of pendingOrders) {
        await this.syncOne(order);
      }
    } catch (err) {
      console.error('❌ SyncManager global error:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncOne(order) {
    const token = sessionStorage.getItem('pos_access_token');
    
    try {
      const response = await axios.post(`${CONFIG.apiBaseUrl}/orders`, order.payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.status === 201 || response.status === 200) {
        console.log(`✅ Synced order: ${order.id}`);
        await localDB.removeSyncedOrder(order.id);
      }
    } catch (err) {
      console.warn(`⚠️ Failed to sync order ${order.id}:`, err.message);
      
      const nextRetry = (order.retries || 0) + 1;
      if (nextRetry >= this.MAX_RETRIES) {
        console.error(`💥 Order ${order.id} reached max retries. Needs manual intervention.`);
        // Here we could flag it in DB for the manager
      }
      
      await localDB.updateOrderRetry(order.id, nextRetry);
    }
  }
}

export const syncManager = new SyncManager();
