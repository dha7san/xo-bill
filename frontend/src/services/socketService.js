import { io } from 'socket.io-client';
import { CONFIG } from '../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(storeId = 'default') {
    if (this.socket?.connected) return;

    this.socket = io(CONFIG.apiBaseUrl.replace('/api', ''), {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to POS WebSocket');
      this.socket.emit('join-store', storeId);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔌 Disconnected from WebSocket:', reason);
    });

    // Re-register all listeners on reconnect
    this.socket.on('reconnect', () => {
      this.socket.emit('join-store', storeId);
    });

    // Dispatch events to registered callbacks
    this.socket.onAny((eventName, ...args) => {
      const callbacks = this.listeners.get(eventName) || [];
      callbacks.forEach(cb => cb(...args));
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    return () => {
      const filtered = this.listeners.get(event).filter(cb => cb !== callback);
      this.listeners.set(event, filtered);
    };
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
