import axios from 'axios';
import { CONFIG } from '../config';

const API_URL = `${CONFIG.apiBaseUrl}/menu`;

export const menuService = {
  // Categories
  getCategories: async () => {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  },
  createCategory: async (categoryData) => {
    const response = await axios.post(`${API_URL}/categories`, categoryData);
    return response.data;
  },
  updateCategory: async (id, categoryData) => {
    const response = await axios.put(`${API_URL}/categories/${id}`, categoryData);
    return response.data;
  },
  deleteCategory: async (id) => {
    await axios.delete(`${API_URL}/categories/${id}`);
  },

  // Menu Items
  getMenuItems: async (categoryId = '') => {
    const response = await axios.get(`${API_URL}/items`, {
      params: { categoryId }
    });
    return response.data;
  },
  createMenuItem: async (itemData) => {
    const response = await axios.post(`${API_URL}/items`, itemData);
    return response.data;
  },
  updateMenuItem: async (id, itemData) => {
    const response = await axios.put(`${API_URL}/items/${id}`, itemData);
    return response.data;
  },
  deleteMenuItem: async (id) => {
    await axios.delete(`${API_URL}/items/${id}`);
  }
};
