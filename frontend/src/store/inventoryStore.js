/**
 * inventoryStore.js
 *
 * Zustand store for inventory — now backed by MongoDB via the REST API.
 *
 * Schema bridge:
 *   Frontend uses:  { id (skuCode), name, unit, stock, minStock }
 *   Backend uses:   { skuCode, itemName, unitOfMeasure, currentStock, reorderLevel, ... }
 *
 * We always read/write using `skuCode` as the stable key.
 */
import { create } from 'zustand';
import { inventoryService } from '../services/inventoryService';

// ─── Default ingredient catalogue ─────────────────────────────────────────
// Used both as UI display defaults AND as the seeding payload for the backend.
// unit must match backend enum: 'g' | 'ml' | 'piece' | 'kg' | 'L' | 'box'
// (we map 'pcs' → 'piece' for backend)
export const DEFAULT_INGREDIENTS = [
  { id: 'flour',         name: 'All-Purpose Flour',  unit: 'g',      stock: 5000, minStock: 500  },
  { id: 'tomato_sauce',  name: 'Tomato Sauce',        unit: 'ml',     stock: 3000, minStock: 300  },
  { id: 'mozzarella',    name: 'Mozzarella Cheese',   unit: 'g',      stock: 2000, minStock: 200  },
  { id: 'pepperoni',     name: 'Pepperoni',            unit: 'g',      stock: 1000, minStock: 100  },
  { id: 'garlic',        name: 'Garlic',               unit: 'g',      stock: 400,  minStock: 50   },
  { id: 'butter',        name: 'Butter',               unit: 'g',      stock: 800,  minStock: 100  },
  { id: 'potato',        name: 'Potato',               unit: 'g',      stock: 4000, minStock: 500  },
  { id: 'truffle_oil',   name: 'Truffle Oil',          unit: 'ml',     stock: 200,  minStock: 30   },
  { id: 'coke_can',      name: 'Coke (330ml can)',     unit: 'piece',  stock: 48,   minStock: 10   },
  { id: 'lemon',         name: 'Lemon',                unit: 'piece',  stock: 30,   minStock: 5    },
  { id: 'sugar',         name: 'Sugar',                unit: 'g',      stock: 2000, minStock: 200  },
  { id: 'pasta',         name: 'Pasta',                unit: 'g',      stock: 3000, minStock: 300  },
  { id: 'cream',         name: 'Fresh Cream',          unit: 'ml',     stock: 1500, minStock: 200  },
  { id: 'parmesan',      name: 'Parmesan Cheese',      unit: 'g',      stock: 500,  minStock: 50   },
  { id: 'chili',         name: 'Red Chili Flakes',     unit: 'g',      stock: 200,  minStock: 20   },
  { id: 'burger_bun',    name: 'Burger Bun',           unit: 'piece',  stock: 40,   minStock: 8    },
  { id: 'beef_patty',    name: 'Beef Patty',           unit: 'g',      stock: 4000, minStock: 400  },
  { id: 'lettuce',       name: 'Lettuce',              unit: 'g',      stock: 600,  minStock: 80   },
  { id: 'cheddar',       name: 'Cheddar Cheese',       unit: 'g',      stock: 600,  minStock: 60   },
  { id: 'milk',          name: 'Full Cream Milk',      unit: 'ml',     stock: 3000, minStock: 300  },
  { id: 'vanilla_syrup', name: 'Vanilla Syrup',        unit: 'ml',     stock: 500,  minStock: 50   },
  { id: 'ice_cream',     name: 'Vanilla Ice Cream',    unit: 'g',      stock: 1000, minStock: 100  },
  { id: 'chocolate',     name: 'Dark Chocolate',       unit: 'g',      stock: 800,  minStock: 80   },
];

// ─── Recipe map: Menu Item Name → [{ id (skuCode), qty }] ──────────────────────
// Used for optimistic updates on the frontend.
export const RECIPES = {
  'Margherita Pizza':   [{ id: 'flour', qty: 200 }, { id: 'tomato_sauce', qty: 50 }, { id: 'mozzarella', qty: 100 }],
  'Pepperoni Pizza':    [{ id: 'flour', qty: 200 }, { id: 'tomato_sauce', qty: 50 }, { id: 'mozzarella', qty: 100 }, { id: 'pepperoni', qty: 80 }],
  'Garlic Bread':       [{ id: 'flour', qty: 150 }, { id: 'garlic', qty: 20 }, { id: 'butter', qty: 30 }],
  'Truffle Fries':      [{ id: 'potato', qty: 200 }, { id: 'truffle_oil', qty: 10 }],
  'Coke':               [{ id: 'coke_can', qty: 1 }],
  'Lemonade':           [{ id: 'lemon', qty: 2 }, { id: 'sugar', qty: 30 }],
  'Pasta Alfredo':      [{ id: 'pasta', qty: 150 }, { id: 'cream', qty: 100 }, { id: 'parmesan', qty: 30 }, { id: 'butter', qty: 20 }],
  'Arrabbiata':         [{ id: 'pasta', qty: 150 }, { id: 'tomato_sauce', qty: 80 }, { id: 'chili', qty: 5 }],
  'Classic Burger':     [{ id: 'burger_bun', qty: 1 }, { id: 'beef_patty', qty: 120 }, { id: 'lettuce', qty: 20 }],
  'Cheese Burger':      [{ id: 'burger_bun', qty: 1 }, { id: 'beef_patty', qty: 120 }, { id: 'cheddar', qty: 30 }, { id: 'lettuce', qty: 20 }],
  'Vanilla Shake':      [{ id: 'milk', qty: 200 }, { id: 'vanilla_syrup', qty: 30 }, { id: 'ice_cream', qty: 80 }],
  'Chocolate Brownie':  [{ id: 'flour', qty: 80 }, { id: 'chocolate', qty: 60 }, { id: 'butter', qty: 40 }, { id: 'sugar', qty: 50 }],
};

// ─── Helper: convert a backend Inventory doc → frontend ingredient shape ────
function toFrontend(doc) {
  return {
    id:       doc.skuCode,
    name:     doc.itemName,
    unit:     doc.unitOfMeasure === 'piece' ? 'pcs' : doc.unitOfMeasure,
    stock:    doc.currentStock,
    minStock: doc.reorderLevel,
    _id:      doc._id,
  };
}

// ─── Build the seed payload for the backend ─────────────────────────────────
function buildSeedPayload() {
  return DEFAULT_INGREDIENTS.map(ing => ({
    skuCode:       ing.id,
    itemName:      ing.name,
    unitOfMeasure: ing.unit === 'pcs' ? 'piece' : ing.unit,
    currentStock:  ing.stock,
    reorderLevel:  ing.minStock,
    unitCost:      0,
  }));
}

// ─── Zustand Store ──────────────────────────────────────────────────────────
const useInventoryStore = create((set, get) => ({
  ingredients: DEFAULT_INGREDIENTS,
  logs: [],
  isLoading: false,
  error: null,

  // ── Fetch all ingredients from the backend ──
  fetchInventory: async () => {
    set({ isLoading: true, error: null });
    try {
      const docs = await inventoryService.getAll();

      if (docs.length === 0) {
        // DB is empty — seed with defaults then re-fetch
        await inventoryService.seed(buildSeedPayload());
        const seeded = await inventoryService.getAll();
        set({ ingredients: seeded.map(toFrontend), isLoading: false });
      } else {
        set({ ingredients: docs.map(toFrontend), isLoading: false });
      }
    } catch (err) {
      console.warn('[Inventory] fetch failed, using local defaults:', err.message);
      set({ isLoading: false, error: err.message });
      // Keep using DEFAULT_INGREDIENTS as fallback
    }
  },

  fetchLogs: async (params = {}) => {
    try {
      const logs = await inventoryService.getLogs(params);
      set({ logs });
    } catch (err) {
      console.error('[Inventory] fetchLogs failed:', err);
    }
  },

  // ── Restock: add qty to an ingredient's stock ──
  restockIngredient: async (id, qty) => {
    // Optimistic update first
    set(state => ({
      ingredients: state.ingredients.map(i =>
        i.id === id ? { ...i, stock: i.stock + Number(qty) } : i
      ),
    }));

    try {
      await inventoryService.restock(id, qty);
    } catch (err) {
      console.error('[Inventory] restock failed:', err.message);
      // Rollback optimistic update
      set(state => ({
        ingredients: state.ingredients.map(i =>
          i.id === id ? { ...i, stock: i.stock - Number(qty) } : i
        ),
        error: err.message,
      }));
    }
  },

  // ── Update minStock / name for an ingredient ──
  updateIngredient: async (id, changes) => {
    const prev = get().ingredients.find(i => i.id === id);
    
    // Optimistic update
    set(state => ({
      ingredients: state.ingredients.map(i =>
        i.id === id ? { ...i, ...changes } : i
      ),
    }));

    try {
      if (changes.minStock !== undefined) {
        await inventoryService.updateMinStock(id, changes.minStock);
      }
    } catch (err) {
      console.error('[Inventory] updateIngredient failed:', err.message);
      // Rollback
      if (prev) {
        set(state => ({
          ingredients: state.ingredients.map(i =>
            i.id === id ? prev : i
          ),
          error: err.message,
        }));
      }
    }
  },

  // ── Deduct ingredients after order (optimistic) ──
  deductIngredients: (orderedItems) => {
    set(state => {
      const updated = state.ingredients.map(ing => ({ ...ing }));

      orderedItems.forEach(({ name, qty: orderedQty }) => {
        const recipe = RECIPES[name];
        if (!recipe) return;

        recipe.forEach(({ id: ingId, qty: perServing }) => {
          const idx = updated.findIndex(i => i.id === ingId);
          if (idx === -1) return;
          updated[idx] = {
            ...updated[idx],
            stock: Math.max(0, updated[idx].stock - perServing * orderedQty),
          };
        });
      });

      return { ingredients: updated };
    });
  },

  // ── Real-time sync: update a single ingredient's stock from socket event ──
  syncStock: (skuCode, newStock) => {
    set(state => ({
      ingredients: state.ingredients.map(i =>
        i.id === skuCode ? { ...i, stock: newStock } : i
      ),
    }));
  },

  // ── Reset all stocks to defaults (also re-seeds the backend) ──
  resetInventory: async () => {
    set({ ingredients: DEFAULT_INGREDIENTS });
    try {
      // Force re-seed by sending all items (service will upsert or skip)
      // We call bulkDeduct in reverse (negative would break validation)
      // Instead, just do a full re-fetch after a manual reset would need a 
      // dedicated reset endpoint. For now, just reset locally.
      // The user can re-seed by clearing DB manually if needed.
    } catch (err) {
      console.error('[Inventory] reset failed:', err.message);
    }
  },
}));

export default useInventoryStore;
