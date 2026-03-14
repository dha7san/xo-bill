import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set) => ({
      cart: [],
      tableNumber: 1,
      offlineOrders: [],
      
      setTableNumber: (num) => set({ tableNumber: num }),
      
      addToCart: (item) => set((state) => {
        const existing = state.cart.find((i) => i.id === item.id);
        if (existing) {
          return {
            cart: state.cart.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
          };
        }
        return { cart: [...state.cart, { ...item, qty: 1 }] };
      }),

      removeFromCart: (itemId) => set((state) => ({
        cart: state.cart.map(i => i.id === itemId ? { ...i, qty: Math.max(0, i.qty - 1) } : i).filter(i => i.qty > 0)
      })),

      clearCart: () => set({ cart: [] }),

      addOfflineOrder: (order) => set((state) => ({
        offlineOrders: [...state.offlineOrders, order]
      })),

      removeOfflineOrder: (orderNumber) => set((state) => ({
        offlineOrders: state.offlineOrders.filter(o => o.orderNumber !== orderNumber)
      })),
      
      clearOfflineOrders: () => set({ offlineOrders: [] })
    }),
    {
      name: 'pos-storage', // unique name for localStorage key
    }
  )
);

export default useCartStore;
