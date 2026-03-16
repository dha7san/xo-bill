import React, { useState, useEffect, useCallback } from 'react';
import useCartStore from './store/cartStore';
import useInventoryStore from './store/inventoryStore';
import ReportModal from './ReportModal';
import InventoryModal from './InventoryModal';
import { AppLockScreen, ManagerPinModal, useAppSecurity } from './PinGate';
import { CONFIG } from './config';
import { localDB } from './services/db';
import { syncManager } from './services/syncManager';
import { socketService } from './services/socketService';
import useMenuStore from './store/menuStore';
import AdminPanel from './AdminPanel';
import useAuthStore from './store/authStore';
import AuthScreen from './AuthScreen';
import {
  ShoppingCart, Receipt, Trash2, WifiOff, Coffee,
  Banknote, CreditCard, Wallet, Printer, QrCode,
  X, CheckCircle2, Smartphone, BarChart2, Package, Lock, RefreshCw, Activity, Settings, LogOut
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// ─── Config (from environment variables via config.js) ────────────────────
const UPI_ID    = CONFIG.upiId;
const STORE_NAME = CONFIG.storeName;

// DUMMY_MENU removed in favor of useMenuStore dynamic data

// ─── Payment Method Config ──────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash',   Icon: Banknote,    color: 'emerald' },
  { id: 'UPI',  label: 'UPI QR', Icon: QrCode,      color: 'orange'  },
  { id: 'Card', label: 'Card',   Icon: CreditCard,  color: 'indigo'  },
];

const COLOR_CLASSES = {
  emerald: { active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', icon: 'text-emerald-400' },
  orange:  { active: 'bg-orange-500/20 text-orange-400 border-orange-500/50',   icon: 'text-orange-400'  },
  indigo:  { active: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',   icon: 'text-indigo-400'  },
};

// ─── Build UPI deep-link & QR URL ──────────────────────────────────────────
function buildQrUrl(amount) {
  const upiString = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(STORE_NAME)}&am=${amount}&cu=INR`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiString)}`;
}

// ─── ESC/POS via Web Serial API ─────────────────────────────────────────────
async function printReceipt({ cart, subTotal, gst, grandTotal, tableNumber, paymentMethod }) {
  if (!navigator.serial) {
    alert('Web Serial API not supported. Please use Chrome or Edge.');
    return;
  }
  try {
    const ports = await navigator.serial.getPorts();
    const port  = ports.length > 0 ? ports[0] : await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });

    const writer  = port.writable.getWriter();
    const encoder = new TextEncoder();

    const ESC = '\x1b', GS = '\x1d';
    const INIT          = ESC + '@';
    const ALIGN_CENTER  = ESC + 'a\x01';
    const ALIGN_LEFT    = ESC + 'a\x00';
    const BOLD_ON       = ESC + 'E\x01';
    const BOLD_OFF      = ESC + 'E\x00';
    const CUT           = GS  + 'V\x41\x03';

    let r = INIT;
    r += ALIGN_CENTER + BOLD_ON + `${STORE_NAME}\n` + BOLD_OFF;
    r += `Table: ${tableNumber}\n`;
    r += `--------------------------------\n`;
    r += ALIGN_LEFT;

    cart.forEach(item => {
      const name  = item.name.substring(0, 18).padEnd(18);
      const qty   = String(item.qty).padStart(3);
      const price = String(item.price * item.qty).padStart(8);
      r += `${name} ${qty} ${price}\n`;
    });

    r += `--------------------------------\n`;
    r += `Subtotal:          ${subTotal.toFixed(2).padStart(10)}\n`;
    r += `GST (5%):          ${gst.toFixed(2).padStart(10)}\n`;
    r += `Payment:           ${paymentMethod.padStart(10)}\n`;
    r += ALIGN_CENTER + BOLD_ON + `TOTAL: Rs.${grandTotal.toFixed(2)}\n` + BOLD_OFF;
    r += `\n\n\n\n\n`;
    r += CUT;

    await writer.write(encoder.encode(r));
    writer.releaseLock();
    await port.close();
  } catch (err) {
    console.error('Print failed:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── UPI QR Modal ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
function UpiQrModal({ amount, onConfirm, onCancel }) {
  const qrUrl = buildQrUrl(amount.toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Smartphone size={20} className="text-orange-400" />
            <h3 className="font-bold text-lg text-white">Scan to Pay</h3>
          </div>
          <button onClick={onCancel} className="text-neutral-500 hover:text-white p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* QR Block */}
        <div className="flex flex-col items-center px-6 py-8 gap-5">
          <div className="p-3 bg-white rounded-2xl shadow-[0_0_40px_rgba(251,146,60,0.2)]">
            <img src={qrUrl} alt="UPI QR Code" width={220} height={220} className="rounded-lg" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-neutral-400 text-sm font-medium">UPI ID</p>
            <p className="text-white font-mono font-bold text-base">{UPI_ID}</p>
          </div>

          {/* Amount badge */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl px-6 py-3 w-full text-center">
            <p className="text-xs text-orange-400 font-semibold uppercase tracking-widest mb-1">Amount Due</p>
            <p className="text-3xl font-black text-white">
              <span className="text-orange-400 mr-1">₹</span>{amount.toFixed(2)}
            </p>
          </div>

          <p className="text-neutral-500 text-xs text-center">
            Ask the customer to scan using any UPI app.<br />
            Tap <strong className="text-white">Payment Received</strong> once confirmed.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(251,146,60,0.3)]"
          >
            <CheckCircle2 size={18} />
            Payment Received
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── Card Payment Modal ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
function CardModal({ amount, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <CreditCard size={20} className="text-indigo-400" />
            <h3 className="font-bold text-lg text-white">Card Payment</h3>
          </div>
          <button onClick={onCancel} className="text-neutral-500 hover:text-white p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center px-6 py-8 gap-6">
          {/* Animated card graphic */}
          <div className="w-48 h-28 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 shadow-[0_0_40px_rgba(99,102,241,0.3)] flex flex-col justify-between p-4 select-none">
            <div className="flex justify-between items-start">
              <div className="w-8 h-6 rounded bg-yellow-400/80"></div>
              <CreditCard size={20} className="text-white/40" />
            </div>
            <div className="text-white/60 text-xs tracking-[0.3em] font-mono">•••• •••• •••• ••••</div>
          </div>

          {/* Amount badge */}
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl px-6 py-3 w-full text-center">
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-1">Charge Amount</p>
            <p className="text-3xl font-black text-white">
              <span className="text-indigo-400 mr-1">₹</span>{amount.toFixed(2)}
            </p>
          </div>

          {/* Steps */}
          <ol className="text-sm text-neutral-400 space-y-2 w-full list-none">
            {['Insert or tap card on terminal', 'Customer enters PIN / taps', 'Confirm approval on screen'].map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          >
            <CheckCircle2 size={18} />
            Card Approved
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── Success Toast ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
function SuccessToast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-neutral-900 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.2)] animate-[fadeIn_0.3s_ease]">
      <CheckCircle2 size={22} />
      <span className="font-semibold text-white">{message}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── Main App ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const {
    cart, addToCart, removeFromCart, clearCart,
    tableNumber, setTableNumber,
    offlineOrders, addOfflineOrder, removeOfflineOrder,
    completedOrders, recordOrder,
  } = useCartStore();

  const [activeCategory, setActiveCategory]   = useState('All');
  const [isOnline, setIsOnline]               = useState(navigator.onLine);
  const [isWsConnected, setIsWsConnected]     = useState(false);
  const [isSyncing, setIsSyncing]             = useState(false);
  const [paymentMethod, setPaymentMethod]     = useState('Cash');
  const [showUpiModal, setShowUpiModal]       = useState(false);
  const [showCardModal, setShowCardModal]     = useState(false);
  const [showReport, setShowReport]           = useState(false);
  const [showInventory, setShowInventory]     = useState(false);
  const [showAdmin, setShowAdmin]             = useState(false);
  const [toast, setToast]                     = useState(null);

  const { user, isAuthenticated, isLoading: isAuthLoading, init: initAuth, logout } = useAuthStore();

  const {
    cashierUnlocked, showManagerModal,
    unlockCashier, lockCashier,
    requireManager, onManagerUnlock, onManagerCancel,
  } = useAppSecurity();

  const { categories: apiCategories, menuItems: apiItems, fetchMenu, isLoading: isMenuLoading } = useMenuStore();
  const { ingredients, deductIngredients, syncStock } = useInventoryStore();
  const lowStockCount = ingredients.filter(i => i.stock <= i.minStock).length;

  // ── Online / Socket / Sync Initialization ──
  useEffect(() => {
    // 0. Init Auth
    initAuth();

    // 1. Sync Manager Initialization
    syncManager.startAutoSync(20000); // Check every 20s
    
    // 2. WebSocket Initialization
    socketService.connect(CONFIG.storeId || 'default');
    
    const stopInvSync = socketService.on('inventory.updated', (payload) => {
      // payload: { ingredientId, newStock }
      if (syncStock) syncStock(payload.ingredientId, payload.newStock);
    });

    const stopOrderSync = socketService.on('order.created', (payload) => {
      // Notify current terminal if another terminal placed an order (optional)
      console.log('📡 Order received from other terminal:', payload.orderNumber);
    });

    // 3. Online/Offline Detect
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online',  up);
    window.addEventListener('offline', down);

    // 4. Fetch Menu from Backend
    fetchMenu();

    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      stopInvSync();
      stopOrderSync();
    };
  }, [syncStock, recordOrder, fetchMenu]);

  const subTotal   = cart.reduce((s, i) => s + (i.price || i.basePrice) * i.qty, 0);
  const gst        = subTotal * CONFIG.gstRate;
  const grandTotal = subTotal + gst;

  const categories   = ['All', ...apiCategories.map(c => c.name)];
  const filteredMenu = activeCategory === 'All' 
    ? apiItems 
    : apiItems.filter(i => (i.category?.name || i.category) === activeCategory);

  // ── Finalise order (Production-Grade Sync Logic) ──
  const finaliseOrder = useCallback(async (withPrint = false) => {
    const orderId = uuidv4();
    const payload = {
      orderNumber: orderId,
      tableNumber,
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price || i.basePrice, menuItemId: i._id || i.id })),
      totalAmount: grandTotal,
      orderType: 'Dine-In',
      paymentMethod,
      timestamp: new Date().toISOString(),
      storeId: CONFIG.storeId || 'default',
      terminalId: 'terminal-1' // In real app, get from config
    };

    // 1. Persist to local sales history (Zustand - for Reports UI immediate feedback)
    recordOrder(payload);

    // 2. Persist to IndexedDB sync queue (Reliable persistence)
    await localDB.savePendingOrder({ id: orderId, payload });

    // 3. Deduct ingredients locally (Optimistic update)
    deductIngredients(payload.items);

    // 4. Print receipt locally
    if (withPrint) {
      await printReceipt({ cart, subTotal, gst, grandTotal, tableNumber, paymentMethod });
    }

    // 5. Trigger immediate background sync
    syncManager.sync();

    clearCart();
    setToast(`${paymentMethod} payment of ₹${grandTotal.toFixed(2)} collected!`);
  }, [cart, grandTotal, gst, paymentMethod, subTotal, tableNumber, recordOrder, deductIngredients, clearCart]);

  // ── Main charge button handler ──
  const handleCharge = async (withPrint = false) => {
    if (cart.length === 0) return;

    if (paymentMethod === 'UPI')  { setShowUpiModal(true);  return; }
    if (paymentMethod === 'Card') { setShowCardModal(true); return; }

    // Cash → settle immediately
    await finaliseOrder(withPrint);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <>
      {/* ── App lock screen — shown until cashier PIN entered ── */}
      {!cashierUnlocked && <AppLockScreen onUnlock={unlockCashier} />}

      {/* ── Manager PIN modal ── */}
      {showManagerModal && (
        <ManagerPinModal
          title="Manager Access"
          onUnlock={onManagerUnlock}
          onCancel={onManagerCancel}
        />
      )}
      {/* ── Inventory Modal ── */}
      {showInventory && <InventoryModal onClose={() => setShowInventory(false)} />}

      {/* ── Report Modal ── */}
      {showReport && (
        <ReportModal
          completedOrders={completedOrders}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* ── Admin Panel Modal ── */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      {/* ── UPI Modal ── */}
      {showUpiModal && (
        <UpiQrModal
          amount={grandTotal}
          onConfirm={async () => { setShowUpiModal(false); await finaliseOrder(); }}
          onCancel={() => setShowUpiModal(false)}
        />
      )}

      {/* ── Card Modal ── */}
      {showCardModal && (
        <CardModal
          amount={grandTotal}
          onConfirm={async () => { setShowCardModal(false); await finaliseOrder(); }}
          onCancel={() => setShowCardModal(false)}
        />
      )}

      {/* ── Success Toast ── */}
      {toast && <SuccessToast message={toast} onDone={() => setToast(null)} />}

      {/* ── Shell ── */}
      <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">

        {/* ━━━ HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <header className="flex items-center justify-between px-6 py-4 bg-neutral-950 border-b border-neutral-800 shrink-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 border border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Coffee size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">{STORE_NAME}</h1>
              <p className="text-xs text-neutral-500 font-medium tracking-widest uppercase">Point of Sale</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Status Indicators */}
            <div className="flex items-center gap-3 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-full">
               <div className="flex items-center gap-1.5" title={isOnline ? 'Internet Connected' : 'Internet Offline'}>
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Net</span>
               </div>
               <div className="w-px h-3 bg-neutral-800" />
               <div className="flex items-center gap-1.5" title="Real-time Multi-device Sync">
                  <Activity size={12} className={isOnline ? 'text-sky-400' : 'text-neutral-600'} />
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Live</span>
               </div>
            </div>

            {/* Inventory button */}
            <button
              onClick={() => requireManager(() => setShowInventory(true))}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-violet-400 hover:border-violet-500/40 transition-all text-sm font-semibold"
            >
              <Package size={16} />
              Inventory
              {lowStockCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-yellow-500 text-neutral-950 text-[10px] font-black rounded-full flex items-center justify-center leading-none">
                  {lowStockCount}
                </span>
              )}
            </button>
            {/* Reports button */}
            <button
              onClick={() => requireManager(() => setShowReport(true))}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-sky-400 hover:border-sky-500/40 transition-all text-sm font-semibold"
            >
              <BarChart2 size={16} />
              Reports
            </button>
            {/* Admin button */}
            <button
               onClick={() => requireManager(() => setShowAdmin(true))}
               className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all text-sm font-semibold"
            >
               <Settings size={16} />
               Admin
            </button>
            {/* Lock button */}
            <button
              onClick={lockCashier}
              title="Lock terminal"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-500/40 transition-all text-sm font-semibold"
            >
              <Lock size={16} />
              Lock
            </button>
            {/* Logout button */}
            <button
               onClick={logout}
               title="Sign Out"
               className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-500/40 transition-all text-sm font-semibold"
            >
               <LogOut size={16} />
               Sign Out
            </button>
            <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
              <span className="text-sm font-medium text-neutral-400">Table</span>
              <input
                type="number"
                value={tableNumber}
                onChange={e => setTableNumber(Number(e.target.value))}
                className="w-12 bg-transparent text-white font-bold text-lg text-center outline-none [&::-webkit-inner-spin-button]:appearance-none"
                min="1"
              />
            </div>
          </div>
        </header>

        {/* ━━━ MIDDLE: Left Menu + Right Bill ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT: Menu ── */}
          <main className="flex-[3] flex flex-col bg-neutral-950 border-r border-neutral-800 overflow-hidden">

            {/* Category pills */}
            <div className="px-6 pt-5 pb-3 shrink-0 flex gap-3 overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeCategory === cat
                      ? 'bg-sky-500 text-white shadow-[0_0_18px_rgba(14,165,233,0.35)]'
                      : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1 px-6 pb-6 overflow-y-auto thin-scrollbar">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMenu.map(item => (
                  <div
                    key={item._id || item.id}
                    onClick={() => addToCart({ ...item, price: item.basePrice || item.price })}
                    className="group relative flex flex-col justify-between h-36 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl cursor-pointer hover:border-sky-500/50 transition-all duration-200 hover:shadow-[0_6px_24px_rgba(56,189,248,0.08)] hover:-translate-y-0.5 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-sky-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-sky-500/10 transition-all duration-500" />
                    <div className="font-semibold text-base text-neutral-300 group-hover:text-white transition-colors z-10 leading-snug">
                      {item.name}
                    </div>
                    <div className="flex justify-between items-end z-10">
                      <span className="text-sky-400 font-bold text-lg">₹{item.basePrice || item.price}</span>
                      <span className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-sky-500 text-neutral-400 group-hover:text-white transition-colors text-base font-bold">+</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* ── RIGHT: Bill ── */}
          <aside className="w-[360px] flex flex-col bg-neutral-900/50 border-l border-neutral-800 backdrop-blur-md overflow-hidden">

            {/* Bill header */}
            <div className="px-5 py-4 border-b border-neutral-800 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-sky-400" />
                Current Order
              </h2>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-neutral-600 hover:text-red-400 p-1.5 rounded-full hover:bg-red-500/10 transition-colors" title="Clear">
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5 thin-scrollbar">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-neutral-600 gap-3">
                  <ShoppingCart className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium">Select items from the menu</p>
                </div>
              ) : cart.map(item => (
                <div key={item._id || item.id} className="flex items-center justify-between bg-neutral-900 px-4 py-3 rounded-xl border border-neutral-800">
                  <div className="flex flex-col min-w-0 flex-1 mr-3">
                    <span className="font-medium text-sm text-white truncate">{item.name}</span>
                    <span className="text-sky-400 text-xs font-semibold mt-0.5">₹{((item.price || item.basePrice) * item.qty).toFixed(0)}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-950 rounded-full px-1 py-1 border border-neutral-800 shrink-0">
                    <button onClick={() => removeFromCart(item._id || item.id)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                      <span className="leading-none mb-px text-base">−</span>
                    </button>
                    <span className="text-sm font-bold text-white w-3 text-center">{item.qty}</span>
                    <button onClick={() => addToCart(item)} className="w-7 h-7 rounded-full flex items-center justify-center bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors">
                      <span className="leading-none mb-px text-base">+</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-900/80 space-y-2 shrink-0">
              <div className="flex justify-between text-sm text-neutral-400 font-medium">
                <span>Subtotal</span><span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-400 font-medium">
                <span>SGST (2.5%)</span><span>₹{(gst / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-neutral-400 font-medium">
                <span>CGST (2.5%)</span><span>₹{(gst / 2).toFixed(2)}</span>
              </div>
            </div>
          </aside>
        </div>

        {/* ━━━ BOTTOM: Payment Bar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="h-28 shrink-0 bg-neutral-900 border-t border-neutral-800 px-8 flex items-center justify-between shadow-[0_-8px_40px_rgba(0,0,0,0.4)] z-20">

          {/* Grand total */}
          <div className="flex flex-col">
            <span className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-1">Total Payable</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl text-sky-400 font-bold">₹</span>
              <span className="text-4xl font-black text-white tracking-tight">{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Right side: method selectors + action */}
          <div className="flex items-center gap-3">

            {/* Payment method buttons */}
            {PAYMENT_METHODS.map(({ id, label, Icon, color }) => {
              const isActive = paymentMethod === id;
              const cls = COLOR_CLASSES[color];
              return (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id)}
                  className={`flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm border transition-all duration-200 active:scale-95 ${
                    isActive ? cls.active : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-800 hover:text-white border-neutral-800'
                  }`}
                >
                  <Icon size={18} className={isActive ? cls.icon : 'text-neutral-600'} />
                  {label}
                </button>
              );
            })}

            {/* Divider */}
            <div className="w-px h-10 bg-neutral-800 mx-1" />

            {/* Print */}
            <button
              onClick={() => handleCharge(true)}
              disabled={cart.length === 0}
              title="Print & Charge"
              className={`flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm border transition-all duration-200 active:scale-95 ${
                cart.length === 0
                  ? 'bg-neutral-800 text-neutral-600 border-neutral-700 cursor-not-allowed'
                  : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 hover:text-white border-neutral-800'
              }`}
            >
              <Printer size={18} />
              Print
            </button>

            {/* Charge */}
            <button
              onClick={() => handleCharge(false)}
              disabled={cart.length === 0}
              className={`flex items-center gap-3 px-9 py-3.5 rounded-xl font-black text-base border transition-all duration-200 active:scale-95 ${
                cart.length === 0
                  ? 'bg-neutral-800 text-neutral-600 border-neutral-700 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-400 text-white border-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]'
              }`}
            >
              <Wallet size={20} />
              Charge Bill
            </button>
          </div>
        </div>
      </div>

      {/* Utility CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .thin-scrollbar::-webkit-scrollbar { width: 4px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </>
  );
}
