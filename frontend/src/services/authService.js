import axios from 'axios';
import { CONFIG } from '../config';

const API_URL = `${CONFIG.apiBaseUrl}/auth`;

export const authService = {
  login: async (credentials) => {
    const response = await axios.post(`${API_URL}/login`, credentials);
    if (response.data.status === 'success') {
      const { token, user } = response.data.data;
      localStorage.setItem('pos_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return user;
    }
    throw new Error(response.data.message || 'Login failed');
  },

  register: async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.data.status === 'success') {
      const { token, user } = response.data.data;
      localStorage.setItem('pos_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return user;
    }
    throw new Error(response.data.message || 'Registration failed');
  },

  getMe: async () => {
    const token = localStorage.getItem('pos_token');
    if (!token) return null;
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      const response = await axios.get(`${API_URL}/me`);
      return response.data.data;
    } catch (err) {
      localStorage.removeItem('pos_token');
      delete axios.defaults.headers.common['Authorization'];
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('pos_token');
    delete axios.defaults.headers.common['Authorization'];
  }
};
