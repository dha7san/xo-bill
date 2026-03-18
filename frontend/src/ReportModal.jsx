import React, { useMemo, useState } from 'react';
import {
  X, TrendingUp, ShoppingBag, Banknote, BarChart2,
  CreditCard, QrCode, Trophy, ArrowUpRight, Calendar
} from 'lucide-react';

// ─── Helper: format currency ────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n).toFixed(2)}`;

// ─── Helper: today's date string YYYY-MM-DD ─────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── Helper: build 24-slot hourly buckets ───────────────────────────────────
function buildHourly(orders) {
  const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, revenue: 0 }));
  orders.forEach(o => {
    const h = new Date(o.timestamp).getHours();
    buckets[h].revenue += o.totalAmount;
  });
  return buckets;
}

// ─── Tiny bar chart (pure CSS) ───────────────────────────────────────────────
function HourlyChart({ buckets }) {
  const max = Math.max(...buckets.map(b => b.revenue), 1);
  const active = buckets.filter(b => b.revenue > 0);
  if (active.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-neutral-600 text-sm">
        No sales recorded today
      </div>
    );
  }
  return (
    <div className="flex items-end gap-[3px] h-20 w-full">
      {buckets.map(b => {
        const pct = (b.revenue / max) * 100;
        return (
          <div key={b.hour} className="group relative flex-1 flex flex-col items-center justify-end h-full">
            <div
              className="w-full rounded-sm bg-sky-500/40 group-hover:bg-sky-400 transition-all duration-200"
              style={{ height: `${Math.max(pct, b.revenue > 0 ? 4 : 0)}%` }}
            />
            {/* Tooltip */}
            {b.revenue > 0 && (
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="bg-neutral-800 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap border border-neutral-700">
                  {b.hour.toString().padStart(2, '0')}:00 — {fmt(b.revenue)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, Icon, color }) {
  const colorMap = {
    sky:     'bg-sky-500/10 text-sky-400 border-sky-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    orange:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
    indigo:  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
        <p className="text-neutral-400 text-sm font-medium mt-0.5">{label}</p>
        {sub && <p className="text-neutral-600 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Payment method breakdown bar ────────────────────────────────────────────
function PaymentBar({ label, amount, total, Icon, color }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  const colorMap = {
    emerald: 'bg-emerald-500',
    orange:  'bg-orange-500',
    indigo:  'bg-indigo-500',
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-neutral-300 font-medium">
          <Icon size={14} className={`text-${color}-400`} />
          {label}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-neutral-500 text-xs">{pct.toFixed(0)}%</span>
          <span className="text-white font-semibold w-24 text-right">{fmt(amount)}</span>
        </div>
      </div>
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorMap[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Helper: build daily trend buckets ──────────────────────────────────────
function buildTrend(orders, range) {
  const days = range === 'week' ? 7 : 30;
  const labels = [];
  const totals = [];
  
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    labels.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
    
    const dayTotal = orders
      .filter(o => o.timestamp.startsWith(dStr))
      .reduce((s, o) => s + o.totalAmount, 0);
    totals.push(dayTotal);
  }
  return { labels, totals };
}

function TrendChart({ data }) {
  const max = Math.max(...data.totals, 1);
  return (
    <div className="flex items-end gap-1 h-32 w-full pt-6">
      {data.totals.map((val, idx) => {
        const pct = (val / max) * 100;
        return (
          <div key={idx} className="group relative flex-1 flex flex-col items-center justify-end h-full">
            <div 
              className="w-full rounded-t-md bg-emerald-500/40 group-hover:bg-emerald-400 transition-all border-t border-emerald-500/20"
              style={{ height: `${Math.max(pct, val > 0 ? 5 : 0)}%` }}
            />
            {val > 0 && (
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="bg-neutral-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap border border-neutral-700 font-bold">
                  {data.labels[idx]} — {fmt(val)}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── Main Report Modal ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export default function ReportModal({ completedOrders, onClose }) {
  const [tab, setTab] = useState('today'); // 'today' | 'week' | 'month' | 'all'

  const orders = useMemo(() => {
    const now = new Date();
    if (tab === 'today') {
      const today = todayStr();
      return completedOrders.filter(o => o.timestamp.startsWith(today));
    }
    if (tab === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return completedOrders.filter(o => new Date(o.timestamp) >= weekAgo);
    }
    if (tab === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return completedOrders.filter(o => new Date(o.timestamp) >= monthAgo);
    }
    return completedOrders;
  }, [completedOrders, tab]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const orderCount   = orders.length;
    const avgOrder     = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Item aggregation
    const itemMap = {};
    orders.forEach(o => {
      o.items.forEach(it => {
        if (!itemMap[it.name]) itemMap[it.name] = { name: it.name, qty: 0, revenue: 0, price: it.price };
        itemMap[it.name].qty     += it.qty;
        itemMap[it.name].revenue += it.qty * it.price;
      });
    });
    const topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

    // Payment breakdown
    const payBreakdown = { Cash: 0, UPI: 0, Card: 0 };
    orders.forEach(o => {
      if (o.payments && o.payments.length > 0) {
        o.payments.forEach(p => {
          payBreakdown[p.method] = (payBreakdown[p.method] || 0) + p.amount;
        });
      } else {
        const m = o.paymentMethod || 'Cash';
        payBreakdown[m] = (payBreakdown[m] || 0) + o.totalAmount;
      }
    });

    const hourly = buildHourly(orders);
    const trend  = (tab === 'week' || tab === 'month') ? buildTrend(orders, tab) : null;

    return { totalRevenue, orderCount, avgOrder, topItems, payBreakdown, hourly, trend };
  }, [orders, tab]);

  const tabLabel = tab === 'today' ? 'Today' : (tab === 'week' ? 'Past 7 Days' : (tab === 'month' ? 'Past 30 Days' : 'All Time'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      {/* Modal panel */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <BarChart2 size={18} />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">Sales Report</h2>
              <p className="text-neutral-500 text-xs">
                {tab === 'today'
                  ? new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  : `${completedOrders.length} total orders in history`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Tab selector */}
            <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
              {['today', 'week', 'month', 'all'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    tab === t
                      ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-neutral-500 hover:text-white p-2 rounded-full hover:bg-neutral-800 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 thin-scrollbar">

          {/* ── Key Metrics ── */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Total Revenue"
              value={fmt(stats.totalRevenue)}
              sub={`${tabLabel}`}
              Icon={TrendingUp}
              color="sky"
            />
            <StatCard
              label="Orders"
              value={stats.orderCount}
              sub={`${tabLabel}`}
              Icon={ShoppingBag}
              color="emerald"
            />
            <StatCard
              label="Avg. Order Value"
              value={stats.orderCount > 0 ? fmt(stats.avgOrder) : '—'}
              sub="per transaction"
              Icon={ArrowUpRight}
              color="orange"
            />
          </div>

          {/* ── Hourly Chart (today only) ── */}
          {tab === 'today' && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-sky-400" />
                <h3 className="text-white font-semibold text-sm">Hourly Revenue — Today</h3>
              </div>
              <HourlyChart buckets={stats.hourly} />
              <div className="flex justify-between text-neutral-600 text-xs mt-2 px-0.5">
                <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
              </div>
            </div>
          )}

          {/* ── Daily Trend Chart (week/month) ── */}
          {(tab === 'week' || tab === 'month') && stats.trend && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 animate-[fadeIn_0.3s_ease]">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <h3 className="text-white font-semibold text-sm">Daily Revenue Trend</h3>
                  </div>
                  <span className="text-[10px] font-black text-neutral-500 uppercase">{tab === 'week' ? 'Last 7 Days' : 'Last 30 Days'}</span>
               </div>
               <TrendChart data={stats.trend} />
               <div className="flex justify-between text-neutral-600 text-[10px] uppercase font-bold mt-3 px-1">
                  <span>{stats.trend.labels[0]}</span>
                  <span>{stats.trend.labels[Math.floor(stats.trend.labels.length / 2)]}</span>
                  <span>{stats.trend.labels[stats.trend.labels.length - 1]}</span>
               </div>
            </div>
          )}

          {/* ── Two-column bottom section ── */}
          <div className="grid grid-cols-5 gap-4">

            {/* Top Selling Items — 3 cols */}
            <div className="col-span-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={16} className="text-orange-400" />
                <h3 className="text-white font-semibold text-sm">Top Selling Items</h3>
              </div>
              {stats.topItems.length === 0 ? (
                <p className="text-neutral-600 text-sm text-center py-6">No items sold {tabLabel.toLowerCase()}</p>
              ) : (
                <div className="space-y-2.5">
                  {stats.topItems.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-3">
                      {/* Rank badge */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        idx === 1 ? 'bg-neutral-400/20 text-neutral-400' :
                        idx === 2 ? 'bg-orange-700/20 text-orange-600' :
                                    'bg-neutral-800 text-neutral-500'
                      }`}>{idx + 1}</div>
                      {/* Name + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-neutral-200 text-sm font-medium truncate">{item.name}</span>
                          <span className="text-sky-400 text-xs font-bold ml-2 shrink-0">{fmt(item.revenue)}</span>
                        </div>
                        <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-400"
                            style={{ width: `${(item.revenue / (stats.topItems[0]?.revenue || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-neutral-500 text-xs w-12 text-right shrink-0">×{item.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Breakdown — 2 cols */}
            <div className="col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Banknote size={16} className="text-emerald-400" />
                <h3 className="text-white font-semibold text-sm">Payment Methods</h3>
              </div>
              {stats.orderCount === 0 ? (
                <p className="text-neutral-600 text-sm text-center py-6 flex-1">No data</p>
              ) : (
                <div className="space-y-4 flex-1 justify-center flex flex-col">
                  <PaymentBar
                    label="Cash"
                    amount={stats.payBreakdown.Cash || 0}
                    total={stats.totalRevenue}
                    Icon={Banknote}
                    color="emerald"
                  />
                  <PaymentBar
                    label="UPI"
                    amount={stats.payBreakdown.UPI || 0}
                    total={stats.totalRevenue}
                    Icon={QrCode}
                    color="orange"
                  />
                  <PaymentBar
                    label="Card"
                    amount={stats.payBreakdown.Card || 0}
                    total={stats.totalRevenue}
                    Icon={CreditCard}
                    color="indigo"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Orders table (last 20) ── */}
          {orders.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-800 flex items-center gap-2">
                <ShoppingBag size={15} className="text-neutral-400" />
                <h3 className="text-white font-semibold text-sm">
                  Recent Orders
                  <span className="text-neutral-500 font-normal ml-1">(last {Math.min(orders.length, 20)})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-500 text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-semibold">Time</th>
                      <th className="px-5 py-3 text-left font-semibold">Table</th>
                      <th className="px-5 py-3 text-left font-semibold">Items</th>
                      <th className="px-5 py-3 text-left font-semibold">Payment</th>
                      <th className="px-5 py-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...orders].reverse().slice(0, 20).map((o, i) => (
                      <tr key={o.orderNumber} className={`border-b border-neutral-800/60 hover:bg-neutral-800/30 transition-colors ${i % 2 === 0 ? '' : ''}`}>
                        <td className="px-5 py-3 text-neutral-400 font-mono text-xs">
                          {new Date(o.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3 text-neutral-300">T{o.tableNumber}</td>
                        <td className="px-5 py-3 text-neutral-400 max-w-[180px] truncate" title={o.items.map(it => it.name).join(', ')}>
                          {o.items.map(it => `${it.name} ×${it.qty}`).join(', ')}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            o.paymentMethod === 'Cash'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : o.paymentMethod === 'UPI'
                                ? 'bg-orange-500/10 text-orange-400'
                                : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {o.paymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-white font-semibold">{fmt(o.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
