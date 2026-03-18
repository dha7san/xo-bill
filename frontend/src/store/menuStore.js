import { create } from 'zustand';
import { menuService } from '../services/menuService';
import { syncManager } from '../services/syncManager';

const useMenuStore = create((set, get) => ({
  categories: [],
  menuItems: [],
  isLoading: false,
  isFromCache: false,
  error: null,

  fetchMenu: async () => {
    set({ isLoading: true, error: null });
    
    // 1. Try Live API 首先 attempt live
    try {
      const [categories, menuItems] = await Promise.all([
        menuService.getCategories(),
        menuService.getMenuItems()
      ]);
      
      // Update Cache immediately when fresh data arrives
      syncManager.cacheMenuData(categories, menuItems);
      
      set({ categories, menuItems, isLoading: false, isFromCache: false });
    } catch (err) {
      console.warn('❌ API Fetch failed, attempting to serve from local cache...');
      
      // 2. Fallback to cache since offline
      const cached = await syncManager.getCachedMenu();
      if (cached) {
         set({ 
           categories: cached.categories, 
           menuItems: cached.items, 
           isLoading: false,
           isFromCache: true 
         });
      } else {
         set({ error: 'System is offline and no local data found.', isLoading: false });
      }
    }
  },

  // ... CRUD operations remain similar, but notice they'll fail during offline 
  // (we could add offline CRUD queueing later if requested)
  // Categories
  addCategory: async (categoryData) => {
    const newCategory = await menuService.createCategory(categoryData);
    set((state) => ({ categories: [...state.categories, newCategory] }));
    return newCategory;
  },
  editCategory: async (id, categoryData) => {
    const updatedCategory = await menuService.updateCategory(id, categoryData);
    set((state) => ({
      categories: state.categories.map((cat) => cat._id === id ? updatedCategory : cat)
    }));
    return updatedCategory;
  },
  removeCategory: async (id) => {
    await menuService.deleteCategory(id);
    set((state) => ({
      categories: state.categories.filter((cat) => cat._id !== id)
    }));
  },

  // Items
  addItem: async (itemData) => {
    const newItem = await menuService.createMenuItem(itemData);
    set((state) => ({ menuItems: [...state.menuItems, newItem] }));
    return newItem;
  },
  editItem: async (id, itemData) => {
    const updatedItem = await menuService.updateMenuItem(id, itemData);
    set((state) => ({
      menuItems: state.menuItems.map((item) => item._id === id ? updatedItem : item)
    }));
    return updatedItem;
  },
  removeItem: async (id) => {
    await menuService.deleteMenuItem(id);
    set((state) => ({
      menuItems: state.menuItems.filter((item) => item._id !== id)
    }));
  }
}));

export default useMenuStore;
