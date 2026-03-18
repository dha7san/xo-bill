const Inventory = require('../../models/Inventory');

// Static recipes for mapping menu items (names) to inventory ingredients (skuCodes)
// We use names instead of IDs because MongoDB IDs can change on reseed
const RECIPES_BY_NAME = {
  'Margherita Pizza':   [{ skuCode: 'flour', qty: 200 }, { skuCode: 'tomato_sauce', qty: 50 }, { skuCode: 'mozzarella', qty: 100 }],
  'Pepperoni Pizza':    [{ skuCode: 'flour', qty: 200 }, { skuCode: 'tomato_sauce', qty: 50 }, { skuCode: 'mozzarella', qty: 100 }, { skuCode: 'pepperoni', qty: 80 }],
  'Garlic Bread':       [{ skuCode: 'flour', qty: 150 }, { skuCode: 'garlic', qty: 20 }, { skuCode: 'butter', qty: 30 }],
  'Truffle Fries':      [{ skuCode: 'potato', qty: 200 }, { skuCode: 'truffle_oil', qty: 10 }],
  'Coke':               [{ skuCode: 'coke_can', qty: 1 }],
  'Lemonade':           [{ skuCode: 'lemon', qty: 2 }, { skuCode: 'sugar', qty: 30 }],
  'Pasta Alfredo':      [{ skuCode: 'pasta', qty: 150 }, { skuCode: 'cream', qty: 100 }, { skuCode: 'parmesan', qty: 30 }, { skuCode: 'butter', qty: 20 }],
  'Arrabbiata':         [{ skuCode: 'pasta', qty: 150 }, { skuCode: 'tomato_sauce', qty: 80 }, { skuCode: 'chili', qty: 5 }],
  'Classic Burger':     [{ skuCode: 'burger_bun', qty: 1 }, { skuCode: 'beef_patty', qty: 120 }, { skuCode: 'lettuce', qty: 20 }],
  'Cheese Burger':      [{ skuCode: 'burger_bun', qty: 1 }, { skuCode: 'beef_patty', qty: 120 }, { skuCode: 'cheddar', qty: 30 }, { skuCode: 'lettuce', qty: 20 }],
  'Vanilla Shake':      [{ skuCode: 'milk', qty: 200 }, { skuCode: 'vanilla_syrup', qty: 30 }, { skuCode: 'ice_cream', qty: 80 }],
  'Chocolate Brownie':  [{ skuCode: 'flour', qty: 80 }, { skuCode: 'chocolate', qty: 60 }, { skuCode: 'butter', qty: 40 }, { skuCode: 'sugar', qty: 50 }],
};

class InventoryService {
  async getInventory(query = {}) {
    const filter = {};
    if (query.status === 'low') {
      filter.$expr = { $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$reorderLevel'] }] };
    } else if (query.status === 'out') {
      filter.currentStock = 0;
    }
    return Inventory.find(filter).sort({ itemName: 1 });
  }

  async getInventoryBySkuCode(skuCode) {
    return Inventory.findOne({ skuCode });
  }

  async createInventoryItem(data) {
    return Inventory.create(data);
  }

  async upsertBySkuCode(skuCode, data) {
    return Inventory.findOneAndUpdate(
      { skuCode },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );
  }

  async updateInventoryItem(id, data) {
    return Inventory.findByIdAndUpdate(id, data, { new: true });
  }

  async updateStock(id, quantityChange) {
    const item = await Inventory.findById(id);
    if (!item) {
      const error = new Error('Inventory item not found');
      error.status = 404;
      throw error;
    }
    item.currentStock = Math.max(0, item.currentStock + quantityChange);
    item.lastRestockedDate = quantityChange > 0 ? new Date() : item.lastRestockedDate;
    return item.save();
  }

  async restockBySku(skuCode, qty) {
    const item = await Inventory.findOne({ skuCode });
    if (!item) {
      const error = new Error(`Inventory item not found: ${skuCode}`);
      error.status = 404;
      throw error;
    }
    item.currentStock = Math.max(0, item.currentStock + Number(qty));
    item.lastRestockedDate = new Date();
    return item.save();
  }

  async updateMinStockBySku(skuCode, reorderLevel) {
    const item = await Inventory.findOne({ skuCode });
    if (!item) {
      const error = new Error(`Inventory item not found: ${skuCode}`);
      error.status = 404;
      throw error;
    }
    item.reorderLevel = Number(reorderLevel);
    return item.save();
  }

  /**
   * Bulk deduct stock when an order is placed.
   * deductions: [{ skuCode, qty }]
   */
  async bulkDeduct(deductions) {
    const results = [];
    for (const { skuCode, qty } of deductions) {
      const item = await Inventory.findOne({ skuCode });
      if (!item) continue; // skip unknown ingredients gracefully
      item.currentStock = Math.max(0, item.currentStock - Number(qty));
      await item.save();
      results.push({ skuCode, newStock: item.currentStock });
    }
    return results;
  }

  /**
   * Bulk upsert for seeding. data: array of ingredient objects.
   * Skips items that already exist (by skuCode) so it won't overwrite real data.
   */
  async seed(items) {
    const results = [];
    for (const item of items) {
      const existing = await Inventory.findOne({ skuCode: item.skuCode });
      if (!existing) {
        const created = await Inventory.create(item);
        results.push({ skuCode: item.skuCode, action: 'created' });
      } else {
        results.push({ skuCode: item.skuCode, action: 'skipped' });
      }
    }
    return results;
  }

  async getLowStockAlerts() {
    return Inventory.find({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] }
    });
  }

  /**
   * Deduct stock based on an order.
   * Looks up items by name for recipe matching.
   */
  async deductByOrder(items) {
    const deductions = [];
    for (const item of items) {
      // 1. Fallback to hardcoded recipes by name
      const recipe = RECIPES_BY_NAME[item.name];
      if (recipe) {
        recipe.forEach(r => {
          deductions.push({ skuCode: r.skuCode, qty: r.qty * item.qty });
        });
      }
      
      // 2. If item has recipeLink populated, we'd use that here (future enhancement)
    }

    if (deductions.length > 0) {
      return this.bulkDeduct(deductions);
    }
    return [];
  }
}

module.exports = new InventoryService();
