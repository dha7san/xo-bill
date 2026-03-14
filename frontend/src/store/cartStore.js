import { create } from 'zustand';

const useCartStore = create((set) => ({
  cart: [],
  tableNumber: 1,
  
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
}));

export default useCartStore;
