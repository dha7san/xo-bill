import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set) => ({
      cart: [],
      tableNumber: 1,
      offlineOrders: [],
      completedOrders: [],   // ← persisted sales history for reports

      setTableNumber: (num) => set({ tableNumber: num }),

      addToCart: (item) => set((state) => {
        const itemId = item._id || item.id;
        const existing = state.cart.find((i) => (i._id || i.id) === itemId);
        
        if (existing) {
          return {
            cart: state.cart.map((i) => (i._id || i.id) === itemId ? { ...i, qty: i.qty + 1 } : i)
          };
        }
        return { cart: [...state.cart, { ...item, qty: 1 }] };
      }),

      removeFromCart: (itemId) => set((state) => ({
        cart: state.cart
          .map(i => (i._id || i.id) === itemId ? { ...i, qty: Math.max(0, i.qty - 1) } : i)
          .filter(i => i.qty > 0)
      })),

      clearCart: () => set({ cart: [] }),

      // Record a successfully paid order to history
      recordOrder: (order) => set((state) => ({
        completedOrders: [...state.completedOrders, order]
      })),

      // Prune orders older than 30 days to keep storage lean
      pruneOldOrders: () => set((state) => {
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return {
          completedOrders: state.completedOrders.filter(
            o => new Date(o.timestamp).getTime() > cutoff
          )
        };
      }),

      addOfflineOrder: (order) => set((state) => ({
        offlineOrders: [...state.offlineOrders, order]
      })),

      removeOfflineOrder: (orderNumber) => set((state) => ({
        offlineOrders: state.offlineOrders.filter(o => o.orderNumber !== orderNumber)
      })),

      clearOfflineOrders: () => set({ offlineOrders: [] }),
    }),
    {
      name: 'pos-storage',
    }
  )
);

export default useCartStore;
