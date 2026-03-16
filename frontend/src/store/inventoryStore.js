import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Default ingredient catalogue ─────────────────────────────────────────
// unit: 'g' | 'ml' | 'pcs'
// stock / minStock are in the same unit
export const DEFAULT_INGREDIENTS = [
  { id: 'flour',        name: 'All-Purpose Flour',  unit: 'g',   stock: 5000, minStock: 500  },
  { id: 'tomato_sauce', name: 'Tomato Sauce',        unit: 'ml',  stock: 3000, minStock: 300  },
  { id: 'mozzarella',   name: 'Mozzarella Cheese',   unit: 'g',   stock: 2000, minStock: 200  },
  { id: 'pepperoni',    name: 'Pepperoni',            unit: 'g',   stock: 1000, minStock: 100  },
  { id: 'garlic',       name: 'Garlic',               unit: 'g',   stock: 400,  minStock: 50   },
  { id: 'butter',       name: 'Butter',               unit: 'g',   stock: 800,  minStock: 100  },
  { id: 'potato',       name: 'Potato',               unit: 'g',   stock: 4000, minStock: 500  },
  { id: 'truffle_oil',  name: 'Truffle Oil',          unit: 'ml',  stock: 200,  minStock: 30   },
  { id: 'coke_can',     name: 'Coke (330ml can)',     unit: 'pcs', stock: 48,   minStock: 10   },
  { id: 'lemon',        name: 'Lemon',                unit: 'pcs', stock: 30,   minStock: 5    },
  { id: 'sugar',        name: 'Sugar',                unit: 'g',   stock: 2000, minStock: 200  },
  { id: 'pasta',        name: 'Pasta',                unit: 'g',   stock: 3000, minStock: 300  },
  { id: 'cream',        name: 'Fresh Cream',          unit: 'ml',  stock: 1500, minStock: 200  },
  { id: 'parmesan',     name: 'Parmesan Cheese',      unit: 'g',   stock: 500,  minStock: 50   },
  { id: 'chili',        name: 'Red Chili Flakes',     unit: 'g',   stock: 200,  minStock: 20   },
  { id: 'burger_bun',   name: 'Burger Bun',           unit: 'pcs', stock: 40,   minStock: 8    },
  { id: 'beef_patty',   name: 'Beef Patty',           unit: 'g',   stock: 4000, minStock: 400  },
  { id: 'lettuce',      name: 'Lettuce',              unit: 'g',   stock: 600,  minStock: 80   },
  { id: 'cheddar',      name: 'Cheddar Cheese',       unit: 'g',   stock: 600,  minStock: 60   },
  { id: 'milk',         name: 'Full Cream Milk',      unit: 'ml',  stock: 3000, minStock: 300  },
  { id: 'vanilla_syrup',name: 'Vanilla Syrup',        unit: 'ml',  stock: 500,  minStock: 50   },
  { id: 'ice_cream',    name: 'Vanilla Ice Cream',    unit: 'g',   stock: 1000, minStock: 100  },
  { id: 'chocolate',    name: 'Dark Chocolate',       unit: 'g',   stock: 800,  minStock: 80   },
];

// ─── Recipe map: menuItemId → [{ id, qty }] ────────────────────────────────
// qty is the amount consumed PER SERVING (1 unit sold)
export const RECIPES = {
  1:  [ // Margherita Pizza
    { id: 'flour',        qty: 200 },
    { id: 'tomato_sauce', qty: 50  },
    { id: 'mozzarella',   qty: 100 },
  ],
  2:  [ // Pepperoni Pizza
    { id: 'flour',        qty: 200 },
    { id: 'tomato_sauce', qty: 50  },
    { id: 'mozzarella',   qty: 100 },
    { id: 'pepperoni',    qty: 80  },
  ],
  3:  [ // Garlic Bread
    { id: 'flour',  qty: 150 },
    { id: 'garlic', qty: 20  },
    { id: 'butter', qty: 30  },
  ],
  4:  [ // Truffle Fries
    { id: 'potato',      qty: 200 },
    { id: 'truffle_oil', qty: 10  },
  ],
  5:  [ // Coke
    { id: 'coke_can', qty: 1 },
  ],
  6:  [ // Lemonade
    { id: 'lemon', qty: 2   },
    { id: 'sugar', qty: 30  },
  ],
  7:  [ // Pasta Alfredo
    { id: 'pasta',    qty: 150 },
    { id: 'cream',    qty: 100 },
    { id: 'parmesan', qty: 30  },
    { id: 'butter',   qty: 20  },
  ],
  8:  [ // Arrabbiata
    { id: 'pasta',        qty: 150 },
    { id: 'tomato_sauce', qty: 80  },
    { id: 'chili',        qty: 5   },
  ],
  9:  [ // Classic Burger
    { id: 'burger_bun',  qty: 1   },
    { id: 'beef_patty',  qty: 120 },
    { id: 'lettuce',     qty: 20  },
  ],
  10: [ // Cheese Burger
    { id: 'burger_bun',  qty: 1   },
    { id: 'beef_patty',  qty: 120 },
    { id: 'cheddar',     qty: 30  },
    { id: 'lettuce',     qty: 20  },
  ],
  11: [ // Vanilla Shake
    { id: 'milk',         qty: 200 },
    { id: 'vanilla_syrup',qty: 30  },
    { id: 'ice_cream',    qty: 80  },
  ],
  12: [ // Chocolate Brownie
    { id: 'flour',     qty: 80  },
    { id: 'chocolate', qty: 60  },
    { id: 'butter',    qty: 40  },
    { id: 'sugar',     qty: 50  },
  ],
};

// ─── Zustand Store ─────────────────────────────────────────────────────────
const useInventoryStore = create(
  persist(
    (set, get) => ({
      ingredients: DEFAULT_INGREDIENTS,

      // Deduct ingredients based on ordered items
      deductIngredients: (orderedItems) => {
        set((state) => {
          const updated = state.ingredients.map(ing => ({ ...ing })); // shallow clone array

          orderedItems.forEach(({ menuItemId, qty: orderedQty }) => {
            const recipe = RECIPES[menuItemId];
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

      // Restock: add qty to an ingredient's stock
      restockIngredient: (id, qty) => {
        set((state) => ({
          ingredients: state.ingredients.map(i =>
            i.id === id ? { ...i, stock: i.stock + Number(qty) } : i
          ),
        }));
      },

      // Update minStock or name for an ingredient
      updateIngredient: (id, changes) => {
        set((state) => ({
          ingredients: state.ingredients.map(i =>
            i.id === id ? { ...i, ...changes } : i
          ),
        }));
      },

      // Reset all stocks to defaults
      resetInventory: () => set({ ingredients: DEFAULT_INGREDIENTS }),
    }),
    { name: 'pos-inventory' }
  )
);

export default useInventoryStore;
