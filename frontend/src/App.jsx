import React, { useState, useEffect, useCallback } from 'react';
import useCartStore from './store/cartStore';
import useInventoryStore, { RECIPES } from './store/inventoryStore';
import { inventoryService } from './services/inventoryService';
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
  X, CheckCircle2, Smartphone, BarChart2, Package, Lock, RefreshCw, Activity, Settings, LogOut,
  Search, Keyboard, Plus
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { printManager } from './services/printManager';

// ─── Config (from environment variables via config.js) ────────────────────
const UPI_ID    = CONFIG.upiId;
const STORE_NAME = CONFIG.storeName;

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

// ─── Modals ───
function CheckoutModal({ total, onConfirm, onCancel }) {
  const [payments, setPayments] = useState([]);
  const [currentAmount, setCurrentAmount] = useState('');
  const [currentMethod, setCurrentMethod] = useState('Cash');
  const [showQR, setShowQR] = useState(false);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - totalPaid);

  useEffect(() => {
    setCurrentAmount(remaining.toFixed(2));
  }, [remaining]);

  const addPayment = () => {
    const val = parseFloat(currentAmount);
    if (isNaN(val) || val <= 0) return;
    if (val > remaining + 0.01) return alert('Amount exceeds remaining balance');
    
    setPayments([...payments, { method: currentMethod, amount: val, id: Date.now() }]);
    if (currentMethod === 'UPI') setShowQR(false);
  };

  const removePayment = (id) => setPayments(payments.filter(p => p.id !== id));

  const handleFinalize = () => {
    if (Math.abs(totalPaid - total) > 0.1) return alert('Please pay the full amount before finalizing');
    onConfirm(payments);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease]">
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-[32px] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-800">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
               <Banknote className="text-emerald-400" /> Checkout & Payment
            </h2>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-0.5">Split payments supported</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-500 transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Input */}
          <div className="flex-1 p-8 border-r border-neutral-800 bg-neutral-950/30">
             <div className="mb-8 p-6 bg-neutral-900/50 border border-neutral-800 rounded-3xl text-center">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Bill</span>
                <div className="text-4xl font-black text-white mt-1">₹{total.toFixed(2)}</div>
             </div>

             <div className="space-y-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Payment Method</label>
                   <div className="grid grid-cols-3 gap-2">
                      {['Cash', 'UPI', 'Card'].map(m => (
                        <button key={m} onClick={() => setCurrentMethod(m)} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${currentMethod === m ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/20' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                           {m}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Amount to Pay</label>
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">₹</span>
                      <input 
                        type="number" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-4 py-4 text-white font-black text-xl outline-none focus:border-sky-500"
                        onFocus={(e) => e.target.select()}
                      />
                   </div>
                </div>

                {currentMethod === 'UPI' && !showQR && (
                  <button onClick={() => setShowQR(true)} className="w-full py-3 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                     <QrCode size={16} /> Show QR for this amount
                  </button>
                )}

                {showQR && (
                  <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl animate-[fadeIn_0.3s_ease]">
                    <img src={buildQrUrl(parseFloat(currentAmount || 0))} alt="QR" className="w-32 h-32" />
                    <button onClick={() => setShowQR(false)} className="text-[10px] font-black text-neutral-400 uppercase">Hide QR</button>
                  </div>
                )}

                <button 
                  onClick={addPayment}
                  disabled={remaining <= 0}
                  className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:grayscale disabled:opacity-30 transition-all font-sans"
                >
                  <Plus size={20} strokeWidth={3} /> Add Payment
                </button>
             </div>
          </div>

          {/* Right: Payment List */}
          <div className="w-64 bg-neutral-900/20 p-6 flex flex-col">
             <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4">Paid Breakdown</h3>
             <div className="flex-1 space-y-3 overflow-y-auto thin-scrollbar">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-2xl animate-[fadeIn_0.2s_ease]">
                    <div>
                      <div className="text-[10px] font-black text-white uppercase">{p.method}</div>
                      <div className="text-sm font-bold text-sky-400">₹{p.amount.toFixed(2)}</div>
                    </div>
                    <button onClick={() => removePayment(p.id)} className="p-1.5 text-neutral-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"><X size={14} /></button>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-700 gap-2 opacity-50 italic text-xs text-center border-2 border-dashed border-neutral-800 rounded-3xl">
                     No payments<br/>added yet
                  </div>
                )}
             </div>

             <div className="pt-6 border-t border-neutral-800 space-y-2">
                <div className="flex justify-between text-[10px] font-black text-neutral-500 uppercase"><span>Balanced</span><span>₹{totalPaid.toFixed(2)}</span></div>
                <div className={`flex justify-between text-[10px] font-black uppercase ${remaining > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                   <span>Pending</span>
                   <span>₹{remaining.toFixed(2)}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="p-6 bg-neutral-950/50 border-t border-neutral-800">
           <button 
             onClick={handleFinalize}
             disabled={Math.abs(remaining) > 0.1 || payments.length === 0}
             className="w-full py-4 bg-sky-500 text-white font-black rounded-2xl uppercase tracking-tighter text-lg shadow-xl shadow-sky-500/20 disabled:grayscale disabled:opacity-30 active:scale-95 transition-all"
           >
             Finalize Order
           </button>
        </div>
      </div>
    </div>
  );
}

function SuccessToast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-neutral-900 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-2xl shadow-xl animate-[fadeIn_0.3s_ease]">
      <CheckCircle2 size={22} /><span className="font-semibold text-white">{message}</span>
    </div>
  );
}

export default function App() {
  const {
    cart, addToCart, removeFromCart, clearCart,
    tableNumber, setTableNumber,
    completedOrders, recordOrder,
  } = useCartStore();

  const [activeCategory, setActiveCategory]   = useState('All');
  const [searchQuery, setSearchQuery]         = useState('');
  const [isOnline, setIsOnline]               = useState(navigator.onLine);
  const [paymentMethod, setPaymentMethod]     = useState('Cash');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReport, setShowReport]           = useState(false);
  const [showInventory, setShowInventory]     = useState(false);
  const [showAdmin, setShowAdmin]             = useState(false);
  const [toast, setToast]                     = useState(null);

  const { isAuthenticated, isLoading: isAuthLoading, init: initAuth, logout } = useAuthStore();
  const { cashierUnlocked, showManagerModal, unlockCashier, lockCashier, requireManager, onManagerUnlock, onManagerCancel } = useAppSecurity();
  const { categories: apiCategories, menuItems: apiItems, fetchMenu, isFromCache } = useMenuStore();
  const { ingredients, syncStock, fetchInventory, deductIngredients } = useInventoryStore();

  useEffect(() => {
    initAuth();
    syncManager.startAutoSync(20000);
    socketService.connect(CONFIG.storeId || 'default');
    
    const stopInv = socketService.on('inventory.updated', (p) => syncStock?.(p.ingredientId, p.newStock));
    const up = () => { setIsOnline(true); fetchMenu(); };
    const down = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    
    fetchMenu();
    fetchInventory();
    printManager.init();

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        if (e.key === 'Escape') { setSearchQuery(''); document.activeElement.blur(); }
        return;
      }
      if (e.key === 'F1') { e.preventDefault(); if (cart.length > 0) setShowCheckoutModal(true); }
      if (e.key === 'F2') { e.preventDefault(); setPaymentMethod('Cash'); }
      if (e.key === 'F3') { e.preventDefault(); setPaymentMethod('UPI'); }
      if (e.key === '/') { e.preventDefault(); document.getElementById('pos-search-input')?.focus(); }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      window.removeEventListener('keydown', handleKeyDown);
      stopInv();
      printManager.destroy();
    };
  }, [fetchMenu, fetchInventory, cart.length, syncStock]);

  const subTotal   = cart.reduce((s, i) => s + (i.price || i.basePrice) * i.qty, 0);
  const gst        = subTotal * CONFIG.gstRate;
  const grandTotal = subTotal + gst;

  const categories   = ['All', ...apiCategories.map(c => c.name)];
  const filteredMenu = apiItems.filter(item => {
    const matchesCat    = activeCategory === 'All' || (item.category?.name || item.category) === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const finaliseOrder = useCallback(async (payments = [], withPrint = false) => {
    const orderId = uuidv4();
    const payload = {
      orderNumber: orderId,
      tableNumber,
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price || i.basePrice, menuItemId: i._id || i.id })),
      subTotal,
      gst,
      totalAmount: grandTotal,
      orderType: 'Dine-In',
      payments,
      paymentMethod: payments.length > 1 ? 'Split' : (payments[0]?.method || paymentMethod),
      paymentStatus: 'paid',
      timestamp: new Date().toISOString(),
      storeId: CONFIG.storeId || 'default',
    };

    recordOrder(payload);
    await localDB.savePendingOrder({ id: orderId, payload });
    
    if (withPrint) {
      try {
        await axios.post(`${CONFIG.apiBaseUrl}/print?role=Receipt`, payload);
      } catch (err) {
        console.error('Print trigger failed:', err);
        // Fallback to local if backend is unreachable or fails
        await printReceipt({ cart, subTotal, gst, grandTotal, tableNumber, paymentMethod: payload.paymentMethod });
      }
    }

    deductIngredients(payload.items);
    syncManager.sync();
    clearCart();
    setToast(`${paymentMethod} Success! ₹${grandTotal.toFixed(0)} Collected.`);
  }, [cart, grandTotal, gst, paymentMethod, subTotal, tableNumber, recordOrder, deductIngredients, clearCart]);

  const handleCharge = async (p = false) => {
    if (cart.length === 0) return;
    if (paymentMethod === 'UPI') { setShowUpiModal(true); return; }
    if (paymentMethod === 'Card') { setShowCardModal(true); return; }
    await finaliseOrder(p);
  };

  if (isAuthLoading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <AuthScreen />;

  return (
    <>
      {!cashierUnlocked && <AppLockScreen onUnlock={unlockCashier} />}
      {showManagerModal && <ManagerPinModal title="Manager Access" onUnlock={onManagerUnlock} onCancel={onManagerCancel} />}
      {showInventory && <InventoryModal onClose={() => setShowInventory(false)} />}
      {showReport && <ReportModal completedOrders={completedOrders} onClose={() => setShowReport(false)} />}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
      {showCheckoutModal && (
        <CheckoutModal 
          total={grandTotal} 
          onConfirm={async (payments) => {
            setShowCheckoutModal(false);
            await finaliseOrder(payments, true);
          }} 
          onCancel={() => setShowCheckoutModal(false)} 
        />
      )}
      {toast && <SuccessToast message={toast} onDone={() => setToast(null)} />}

      <div className="flex flex-col h-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans select-none">
        
        {/* HEADER */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30"><Coffee size={24} /></div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">{STORE_NAME}</h1>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Billing System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-full">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-[10px] font-bold text-neutral-500 uppercase">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            
            <button onClick={() => requireManager(() => setShowInventory(true))} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all"><Package size={20} /></button>
            <button onClick={() => requireManager(() => setShowReport(true))} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all"><BarChart2 size={20} /></button>
            <button onClick={() => requireManager(() => setShowAdmin(true))} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all"><Settings size={20} /></button>
            <button onClick={lockCashier} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all"><Lock size={20} /></button>
            <button onClick={logout} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 transition-all"><LogOut size={20} /></button>

            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
               <span className="text-xs font-black text-neutral-500">TABLE</span>
               <input type="number" value={tableNumber} onChange={e => setTableNumber(Number(e.target.value))} className="w-8 bg-transparent text-white font-black text-lg outline-none" min="1" />
            </div>
          </div>
        </header>

        {/* MAIN BODY */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* MENU SIDE */}
          <main className="flex-1 flex flex-col bg-neutral-950 overflow-hidden border-r border-neutral-800">
            <div className="px-6 py-4 flex items-center gap-4 bg-neutral-900/20 border-b border-neutral-800/50">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                 <input id="pos-search-input" type="text" placeholder="Quick search... (Press / )" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl pl-10 pr-4 py-2.5 focus:border-sky-500 outline-none text-sm" />
               </div>
               <div className="hidden lg:flex gap-3 text-[10px] font-black text-neutral-600 uppercase">
                  <span className="bg-neutral-800 px-1.5 py-0.5 rounded">F1 Finalize</span>
                  <span className="bg-neutral-800 px-1.5 py-0.5 rounded">F2 Cash</span>
                  <span className="bg-neutral-800 px-1.5 py-0.5 rounded">F3 UPI</span>
               </div>
            </div>

            <div className="px-6 pt-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-neutral-900 text-neutral-500 hover:text-white border border-neutral-800'}`}>{cat}</button>
              ))}
            </div>

            <div className="flex-1 px-6 pb-6 overflow-y-auto thin-scrollbar">
               <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-4 mt-2">
                 {filteredMenu.map(item => (
                   <button key={item._id || item.id} onClick={() => addToCart({ ...item, price: item.basePrice || item.price })} className="group h-32 bg-neutral-900 border border-neutral-800 p-4 rounded-3xl hover:border-sky-500 transition-all flex flex-col justify-between text-left active:scale-95">
                      <div className="font-bold text-sm text-neutral-200 group-hover:text-white line-clamp-2 leading-tight">{item.name}</div>
                      <div className="flex justify-between items-center">
                         <span className="text-sky-400 font-black text-lg">₹{item.basePrice || item.price}</span>
                         <div className="w-8 h-8 rounded-full bg-neutral-800 group-hover:bg-sky-500 flex items-center justify-center text-white"><Plus size={18} strokeWidth={3} /></div>
                      </div>
                   </button>
                 ))}
               </div>
               {filteredMenu.length === 0 && searchQuery && (
                 <div className="flex flex-col items-center justify-center h-64 text-neutral-600 gap-2">
                    <Search size={40} className="opacity-10" />
                    <p className="text-sm font-bold uppercase tracking-widest">No matching items</p>
                    <button onClick={() => setSearchQuery('')} className="text-sky-500 text-xs font-bold uppercase hover:underline">Clear</button>
                 </div>
               )}
            </div>
          </main>

          {/* CART SIDE */}
          <aside className="w-[380px] flex flex-col bg-neutral-950 backdrop-blur-xl">
             <div className="px-5 py-4 border-b border-neutral-800 flex justify-between items-center">
                <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2"><ShoppingCart size={14} /> Current Order</h2>
                {cart.length > 0 && <button onClick={clearCart} className="text-neutral-600 hover:text-red-400"><Trash2 size={16} /></button>}
             </div>

             <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 thin-scrollbar">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-10 gap-3 grayscale">
                    <ShoppingCart size={64} /><p className="font-black uppercase tracking-widest text-sm">Empty Cart</p>
                  </div>
                ) : cart.map(item => (
                   <div key={item._id || item.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-4">
                        <span className="font-bold text-sm text-neutral-200 line-clamp-1">{item.name}</span>
                        <span className="font-black text-sm text-sky-400">₹{(item.price * item.qty).toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                         <button onClick={() => removeFromCart(item._id || item.id)} className="w-10 h-10 rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-400 flex items-center justify-center hover:text-red-400 active:scale-95 transition-all"><span className="text-2xl font-black mb-1">−</span></button>
                         <span className="w-5 text-center font-black text-lg text-white">{item.qty}</span>
                         <button onClick={() => addToCart(item)} className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center hover:bg-sky-500/20 active:scale-95 transition-all"><span className="text-2xl font-black mb-1">+</span></button>
                      </div>
                   </div>
                ))}
             </div>

             <div className="p-6 border-t border-neutral-800 bg-neutral-900/30 space-y-3">
                <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase tracking-widest"><span>Subtotal</span><span>₹{subTotal.toFixed(0)}</span></div>
                <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase tracking-widest"><span>GST 5%</span><span>₹{gst.toFixed(0)}</span></div>
                <div className="pt-2 flex justify-between items-end">
                   <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Total</span>
                   <span className="text-4xl font-black text-white tracking-tighter">₹{grandTotal.toFixed(0)}</span>
                </div>
             </div>
          </aside>
        </div>

        {/* PAYMENT BAR */}
        <div className="h-24 bg-neutral-900 border-t border-neutral-800 px-6 flex items-center justify-between gap-6 z-20">
           <div className="flex gap-2">
             {PAYMENT_METHODS.map(({ id, label, Icon, color }) => {
               const isActive = paymentMethod === id;
               const cls = COLOR_CLASSES[color];
               return (
                 <button key={id} onClick={() => setPaymentMethod(id)} className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all active:scale-95 ${isActive ? cls.active : 'bg-neutral-950 text-neutral-600 border-neutral-800 hover:text-neutral-400'}`}>
                   <Icon size={16} />{label}
                 </button>
               );
             })}
           </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowCheckoutModal(true)} 
                disabled={cart.length === 0} 
                className="h-16 px-12 bg-sky-500 text-white rounded-2xl font-black text-xl uppercase tracking-tighter shadow-xl shadow-sky-500/20 active:scale-95 disabled:grayscale disabled:opacity-50 transition-all flex items-center gap-4"
              >
                <Wallet size={24} strokeWidth={3} /> Charge Bill
              </button>
            </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .thin-scrollbar::-webkit-scrollbar { width: 4px; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </>
  );
}
