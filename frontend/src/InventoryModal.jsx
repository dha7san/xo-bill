import React, { useState, useMemo, useEffect } from 'react';
import {
  X, Package, AlertTriangle, CheckCircle2, Plus,
  RotateCcw, Search, ChevronDown, ChevronUp, FlaskConical, Loader2
} from 'lucide-react';
import useInventoryStore, { RECIPES, DEFAULT_INGREDIENTS } from './store/inventoryStore';
import useMenuStore from './store/menuStore';

// ─── Status helpers ───────────────────────────────────────────────────────
function getStatus(ing) {
  if (ing.stock === 0)              return 'out';
  if (ing.stock <= ing.minStock)    return 'low';
  return 'ok';
}

const STATUS_CONFIG = {
  out: { label: 'Out of Stock', badge: 'bg-red-500/15 text-red-400 border border-red-500/30',    bar: 'bg-red-500'    },
  low: { label: 'Low Stock',    badge: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', bar: 'bg-yellow-500'  },
  ok:  { label: 'In Stock',     badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30', bar: 'bg-emerald-500' },
};

// ─── Restock input row ────────────────────────────────────────────────────
function RestockRow({ ingredient, onRestock }) {
  const [qty, setQty] = useState('');

  const commit = () => {
    const n = Number(qty);
    if (n > 0) { onRestock(ingredient.id, n); setQty(''); }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="number"
        value={qty}
        onChange={e => setQty(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && commit()}
        placeholder={`Add ${ingredient.unit}`}
        className="flex-1 bg-neutral-950 border border-neutral-700 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-sky-500/60 placeholder:text-neutral-600"
        min="1"
      />
      <button
        onClick={commit}
        disabled={!qty || Number(qty) <= 0}
        className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500 hover:text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
      >
        <Plus size={14} />
        Add
      </button>
    </div>
  );
}

// ─── Single ingredient card ───────────────────────────────────────────────
function IngredientCard({ ingredient, onRestock, onUpdateMin }) {
  const [expanded, setExpanded] = useState(false);
  const [editMin, setEditMin]   = useState(false);
  const [minVal, setMinVal]     = useState(String(ingredient.minStock));

  const status = getStatus(ingredient);
  const cfg    = STATUS_CONFIG[status];

  // max for bar display: double the minStock or current stock (whichever bigger)
  const barMax = Math.max(ingredient.stock, ingredient.minStock * 4, 1);
  const pct    = Math.min((ingredient.stock / barMax) * 100, 100);

  const commitMin = () => {
    const n = Number(minVal);
    if (n > 0) onUpdateMin(ingredient.id, { minStock: n });
    setEditMin(false);
  };

  return (
    <div className={`bg-neutral-900 border rounded-xl overflow-hidden transition-all duration-200 ${
      status === 'out' ? 'border-red-500/30' : status === 'low' ? 'border-yellow-500/30' : 'border-neutral-800'
    }`}>
      {/* Row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-800/40 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          status === 'out' ? 'bg-red-500/10 text-red-400' :
          status === 'low' ? 'bg-yellow-500/10 text-yellow-400' :
          'bg-neutral-800 text-neutral-400'
        }`}>
          <Package size={15} />
        </div>

        {/* Name + bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium text-sm text-white truncate">{ingredient.name}</span>
            <span className="text-xs font-bold text-white shrink-0">
              {ingredient.stock} <span className="text-neutral-500 font-normal">{ingredient.unit}</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Status badge */}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
          {cfg.label}
        </span>

        {/* Expand chevron */}
        <div className="text-neutral-600 shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-neutral-800/60 space-y-3">
          {/* Min stock row */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Min. Alert Level</span>
            {editMin ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minVal}
                  onChange={e => setMinVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && commitMin()}
                  className="w-20 bg-neutral-950 border border-neutral-700 text-white text-sm rounded-lg px-2 py-1 outline-none focus:border-sky-500/50 text-right"
                />
                <span className="text-neutral-500 text-xs">{ingredient.unit}</span>
                <button onClick={commitMin} className="text-xs bg-sky-500 text-white px-2 py-1 rounded-lg font-semibold">Save</button>
              </div>
            ) : (
              <button onClick={() => setEditMin(true)} className="text-neutral-300 hover:text-sky-400 transition-colors">
                {ingredient.minStock} {ingredient.unit}
                <span className="text-neutral-600 ml-1 text-xs">(edit)</span>
              </button>
            )}
          </div>

          {/* Restock input */}
          <div>
            <p className="text-xs text-neutral-600 mb-1 font-medium uppercase tracking-wide">Restock</p>
            <RestockRow ingredient={ingredient} onRestock={onRestock} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Menu item recipe popup ────────────────────────────────────────────────
function LogsView({ logs }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-600 gap-3">
        <RotateCcw className="w-12 h-12 opacity-20" />
        <p className="text-sm font-medium">No inventory logs found yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div key={log._id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between group">
          <div className="flex items-center gap-4">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-xs ${
                log.type === 'restock' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                log.type === 'deduction' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-blue-500/10 text-blue-400 border-blue-500/20'
             }`}>
                {log.type === 'restock' ? '+' : log.type === 'deduction' ? '-' : '±'}
             </div>
             <div>
                <div className="flex items-center gap-2">
                   <span className="font-bold text-sm text-white">{log.inventoryId?.itemName || log.skuCode}</span>
                   <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">({log.skuCode})</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                   <span className="font-medium text-neutral-400">{log.action || 'Stock update'}</span>
                   <span>•</span>
                   <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
             </div>
          </div>
          <div className="text-right">
             <div className={`text-sm font-black ${log.type === 'restock' ? 'text-emerald-400' : 'text-red-400'}`}>
                {log.type === 'restock' ? '+' : '-'}{log.quantity}
             </div>
             <div className="text-[10px] font-bold text-neutral-600 uppercase mt-0.5">
                {log.previousStock} → {log.newStock}
             </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecipeView({ ingredients, menuItems }) {

  const ingMap = Object.fromEntries(ingredients.map(i => [i.id, i]));

  return (
    <div className="space-y-3">
      {menuItems.map(item => {
        const recipe = RECIPES[item.name] || [];
        const canMake = recipe.every(({ id, qty }) => {
          const ing = ingMap[id];
          return ing && ing.stock >= qty;
        });
        const maxServings = recipe.length === 0 ? '∞' :
          Math.floor(Math.min(...recipe.map(({ id, qty }) => {
            const ing = ingMap[id];
            return ing ? ing.stock / qty : Infinity;
          })));

        return (
          <div key={item.id} className={`bg-neutral-900 border rounded-xl p-4 ${canMake ? 'border-neutral-800' : 'border-red-500/20'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-white">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">Can make:</span>
                <span className={`text-sm font-bold ${Number(maxServings) <= 0 ? 'text-red-400' : Number(maxServings) <= 3 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  {maxServings} servings
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recipe.map(({ id, qty }) => {
                const ing = ingMap[id];
                const enough = ing && ing.stock >= qty;
                return (
                  <span key={id} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    enough ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {ing?.name ?? id}: {qty}{ing?.unit}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── Main Inventory Modal ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export default function InventoryModal({ onClose }) {
  const { ingredients, logs, restockIngredient, updateIngredient, resetInventory, fetchInventory, fetchLogs, isLoading } = useInventoryStore();
  const { menuItems } = useMenuStore();

  useEffect(() => { 
    fetchInventory(); 
  }, []);

  const [tab, setTab]         = useState('stock');   // 'stock' | 'logs' | 'recipes'
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');     // 'all' | 'low' | 'out'

  useEffect(() => {
    if (tab === 'logs') fetchLogs();
  }, [tab]);

  const filtered = useMemo(() => {
    return ingredients
      .filter(i => {
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' ? true : getStatus(i) === filter;
        return matchSearch && matchFilter;
      })
      .sort((a, b) => {
        const order = { out: 0, low: 1, ok: 2 };
        return order[getStatus(a)] - order[getStatus(b)];
      });
  }, [ingredients, search, filter]);

  const outCount = ingredients.filter(i => getStatus(i) === 'out').length;
  const lowCount = ingredients.filter(i => getStatus(i) === 'low').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Package size={18} />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">Inventory</h2>
              <p className="text-neutral-500 text-xs">{ingredients.length} ingredients tracked</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Alert badges */}
            {outCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/25">
                <AlertTriangle size={12} /> {outCount} Out
              </span>
            )}
            {lowCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/25">
                <AlertTriangle size={12} /> {lowCount} Low
              </span>
            )}

            {/* Tab switcher */}
            <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
              {[['stock', 'Stock'], ['logs', 'History'], ['recipes', 'Recipes']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                    tab === id ? 'bg-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button onClick={onClose} className="text-neutral-500 hover:text-white p-2 rounded-full hover:bg-neutral-800 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Search / Filter toolbar (stock tab only) ── */}
        {tab === 'stock' && (
          <div className="flex items-center gap-3 px-6 py-3 border-b border-neutral-800 shrink-0">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search ingredients…"
                className="w-full bg-neutral-900 border border-neutral-800 text-white text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:border-violet-500/50 placeholder:text-neutral-600"
              />
            </div>
            {['all', 'low', 'out'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  filter === f
                    ? f === 'out' ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : f === 'low' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                      : 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                    : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
              </button>
            ))}
            <button
              onClick={async () => { if (confirm('Reset all ingredient stocks to default quantities?')) { await resetInventory(); fetchInventory(); } }}
              className="flex items-center gap-1.5 text-neutral-500 hover:text-red-400 px-3 py-2 rounded-xl hover:bg-red-500/10 border border-neutral-800 text-sm font-medium transition-colors"
              title="Reset all stock to defaults"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        )}

        {/* ── Scrollable body ── */}
        {/* ── Loading overlay ── */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-950/70 rounded-3xl backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="text-violet-400 animate-spin" />
              <p className="text-sm text-neutral-400 font-medium">Syncing inventory…</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2.5 thin-scrollbar">
          {tab === 'stock' ? (
            filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-600 gap-3">
                <Package className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium">No ingredients match your filter</p>
              </div>
            ) : (
              filtered.map(ing => (
                <IngredientCard
                  key={ing.id}
                  ingredient={ing}
                  onRestock={restockIngredient}
                  onUpdateMin={updateIngredient}
                />
              ))
            )
          ) : tab === 'logs' ? (
            <LogsView logs={logs} />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                <FlaskConical size={14} className="text-violet-400" />
                Recipe & Yield Models
              </div>
              <RecipeView ingredients={ingredients} menuItems={menuItems} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
