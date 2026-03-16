import { create } from 'zustand';
import { menuService } from '../services/menuService';

const useMenuStore = create((set, get) => ({
  categories: [],
  menuItems: [],
  isLoading: false,
  error: null,

  fetchMenu: async () => {
    set({ isLoading: true, error: null });
    try {
      const [categories, menuItems] = await Promise.all([
        menuService.getCategories(),
        menuService.getMenuItems()
      ]);
      set({ categories, menuItems, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

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
