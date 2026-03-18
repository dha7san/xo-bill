/**
 * inventoryService.js
 * 
 * All HTTP calls for Inventory, talking to /api/inventory.
 * Uses axios which already has the auth token set by authService.
 */
import axios from 'axios';
import { CONFIG } from '../config';

const BASE = `${CONFIG.apiBaseUrl}/inventory`;

export const inventoryService = {
  /** Fetch all ingredients from the backend */
  getAll: async () => {
    const { data } = await axios.get(BASE);
    return data; // array of Mongoose Inventory docs
  },

  /** Restock an ingredient by its SKU code (slug, e.g. 'flour') */
  restock: async (skuCode, qty) => {
    const { data } = await axios.patch(`${BASE}/sku/${encodeURIComponent(skuCode)}/restock`, { qty });
    return data;
  },

  /** Update the minimum stock (reorder level) for an ingredient by SKU */
  updateMinStock: async (skuCode, reorderLevel) => {
    const { data } = await axios.patch(`${BASE}/sku/${encodeURIComponent(skuCode)}/minstock`, { reorderLevel });
    return data;
  },

  /**
   * Bulk-deduct ingredients after an order is placed.
   * deductions: [{ skuCode, qty }]
   */
  bulkDeduct: async (deductions) => {
    const { data } = await axios.post(`${BASE}/deduct`, { deductions });
    return data;
  },

  /**
   * Seed default ingredients to the database.
   * Called once on first load if the DB is empty.
   * items: array of objects matching the backend schema
   */
  seed: async (items) => {
    const { data } = await axios.post(`${BASE}/seed`, { items });
    return data;
  },

  /** Get low-stock alerts */
  getAlerts: async () => {
    const { data } = await axios.get(`${BASE}/alerts`);
    return data;
  },

  /** Get stock movement logs */
  getLogs: async (params = {}) => {
    const { data } = await axios.get(`${BASE}/logs`, { params });
    return data;
  },
};
