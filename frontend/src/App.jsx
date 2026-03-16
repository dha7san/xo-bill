import React, { useState, useEffect } from 'react';
import useCartStore from './store/cartStore';
import { ShoppingCart, LayoutGrid, Search, Receipt, Trash2, WifiOff, Coffee, Banknote, CreditCard, Wallet, AlertCircle, Printer } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const DUMMY_MENU = [
  { id: 1, name: 'Margherita Pizza', price: 299, category: 'Pizza' },
  { id: 2, name: 'Pepperoni Pizza', price: 349, category: 'Pizza' },
  { id: 3, name: 'Garlic Bread', price: 149, category: 'Sides' },
  { id: 4, name: 'Truffle Fries', price: 199, category: 'Sides' },
  { id: 5, name: 'Coke', price: 60, category: 'Beverages' },
  { id: 6, name: 'Lemonade', price: 90, category: 'Beverages' },
  { id: 7, name: 'Pasta Alfredo', price: 250, category: 'Pasta' },
  { id: 8, name: 'Arrabbiata', price: 230, category: 'Pasta' },
  { id: 9, name: 'Classic Burger', price: 180, category: 'Burgers' },
  { id: 10, name: 'Cheese Burger', price: 220, category: 'Burgers' },
  { id: 11, name: 'Vanilla Shake', price: 150, category: 'Beverages' },
  { id: 12, name: 'Chocolate Brownie', price: 180, category: 'Dessert' },
];

export default function App() {
  const { cart, addToCart, removeFromCart, clearCart, tableNumber, setTableNumber, offlineOrders, addOfflineOrder, removeOfflineOrder } = useCartStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineOrders();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine && offlineOrders.length > 0) {
      syncOfflineOrders();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineOrders]);

  const syncOfflineOrders = async () => {
    if (offlineOrders.length === 0) return;
    
    console.log(`Syncing ${offlineOrders.length} offline orders...`);
    
    for (const order of offlineOrders) {
      try {
        console.log('Successfully synced order:', order.orderNumber);
        removeOfflineOrder(order.orderNumber);
      } catch (err) {
        console.error('Failed to sync order:', order.orderNumber);
      }
    }
  };

  const categories = ['All', ...new Set(DUMMY_MENU.map(i => i.category))];
  
  const filteredMenu = activeCategory === 'All' 
    ? DUMMY_MENU 
    : DUMMY_MENU.filter(i => i.category === activeCategory);

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const gst = subTotal * 0.05; // 5% GST
  const grandTotal = subTotal + gst;

  const handleCheckout = async (withPrint = false) => {
    if (cart.length === 0) return alert('Cart is empty!');
    
    // ESC/POS Thermal Printer Logic via Web Serial API
    if (withPrint) {
      if (!navigator.serial) {
        alert('Web Serial API not supported in this browser. Please use Chrome/Edge.');
      } else {
        try {
          let port;
          const ports = await navigator.serial.getPorts();
          if (ports.length > 0) {
            port = ports[0];
          } else {
            port = await navigator.serial.requestPort();
          }
          await port.open({ baudRate: 9600 });
          
          const writer = port.writable.getWriter();
          const encoder = new TextEncoder();
    
          const ESC = "\x1b", GS = "\x1d";
          const INIT = ESC + "@";
          const ALIGN_CENTER = ESC + "a" + "\x01";
          const ALIGN_LEFT = ESC + "a" + "\x00";
          const BOLD_ON = ESC + "E" + "\x01";
          const BOLD_OFF = ESC + "E" + "\x00";
          const CUT = GS + "V" + "\x41" + "\x03"; 
    
          let receipt = INIT;
          receipt += ALIGN_CENTER + BOLD_ON + "XOPOS BILLING\n" + BOLD_OFF;
          receipt += "--------------------------------\n";
          receipt += ALIGN_LEFT;
    
          cart.forEach(item => {
            const name = item.name.substring(0, 18).padEnd(18);
            const qty = String(item.qty).padStart(3);
            const price = String(item.price * item.qty).padStart(8);
            receipt += `${name} ${qty} ${price}\n`;
          });
    
          receipt += "--------------------------------\n";
          receipt += `Subtotal:                ${subTotal.toFixed(2).padStart(8)}\n`;
          receipt += `GST (5%):                 ${gst.toFixed(2).padStart(8)}\n`;
          receipt += ALIGN_CENTER + BOLD_ON + `TOTAL: Rs.${grandTotal.toFixed(2)}\n` + BOLD_OFF;
          receipt += "\n\n\n\n\n"; // Feed lines before cutting
          receipt += CUT;
    
          await writer.write(encoder.encode(receipt));
          writer.releaseLock();
          await port.close();
        } catch (err) {
          console.error('Print failed:', err);
        }
      }
    }

    const payload = {
      orderNumber: uuidv4(),
      tableNumber,
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, menuItemId: i.id })),
      totalAmount: grandTotal,
      orderType: 'Dine-In',
      timestamp: new Date().toISOString()
    };

    if (!isOnline) {
      addOfflineOrder(payload);
    } else {
      console.log('Sending to backend live:', payload);
    }
    
    // Quick success animation or state could go here, but for now we clear cart
    clearCart();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      
      {/* TOP: Header Navigation */}
      <header className="flex items-center justify-between px-6 py-4 bg-neutral-950 border-b border-neutral-800 shrink-0 z-10">
        <div className="flex space-x-3 items-center">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 border border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Coffee size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">XoPOS</h1>
            <p className="text-xs text-neutral-500 font-medium tracking-wide uppercase">Table Setup</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {!isOnline && (
            <div className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-full text-sm font-semibold shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <WifiOff size={16} />
              <span>Offline ({offlineOrders.length})</span>
            </div>
          )}
          
          <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
            <span className="text-sm font-medium text-neutral-400">Table</span>
            <input 
              type="number" 
              value={tableNumber} 
              onChange={(e) => setTableNumber(Number(e.target.value))}
              className="w-12 bg-transparent text-white font-bold text-lg text-center outline-none [&::-webkit-inner-spin-button]:appearance-none"
              min="1"
            />
          </div>
        </div>
      </header>

      {/* MID: Main Application Area (Left Menu, Right Bill) */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT: Menu Items */}
        <main className="flex-[3] flex flex-col bg-neutral-950 border-r border-neutral-800 relative z-0 hide-scrollbar">
          
          {/* Category Chips Ribbon */}
          <div className="p-6 shrink-0 flex gap-3 overflow-x-auto custom-scrollbar">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat 
                    ? 'bg-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] scale-105' 
                    : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'
                }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="flex-1 p-6 pt-0 overflow-y-auto custom-scrollbar relative">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-20">
              {filteredMenu.map(item => (
                <div 
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="group relative flex flex-col justify-between h-40 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl cursor-pointer hover:border-sky-500/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(56,189,248,0.08)] hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-sky-500/10 transition-all duration-500"></div>
                  <div className="font-semibold text-lg text-neutral-300 group-hover:text-white transition-colors z-10 leading-tight">
                    {item.name}
                  </div>
                  <div className="flex justify-between items-end z-10">
                    <div className="text-sky-400 font-bold text-xl drop-shadow-sm">
                      ₹{item.price}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-sky-500 text-neutral-400 group-hover:text-white transition-colors">
                      <span className="text-xl font-light">+</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Soft gradient at the bottom of the list */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none"></div>
          </div>
        </main>

        {/* RIGHT: Current Bill */}
        <aside className="w-[380px] flex flex-col bg-neutral-900/40 relative z-10 backdrop-blur-md">
          <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/80 shrink-0">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
              <Receipt className="w-5 h-5 text-sky-400" />
              Current Order
            </h2>
            {cart.length > 0 && (
              <button 
                onClick={clearCart} 
                className="text-neutral-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10 transition-colors"
                title="Clear Cart"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-4">
                <ShoppingCart className="w-16 h-16 opacity-20" />
                <p className="font-medium text-sm">Add items from the menu</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-neutral-900 p-4 rounded-2xl border border-neutral-800/80 shadow-sm animate-[fadeIn_0.2s_ease-out]">
                  <div className="flex flex-col max-w-[150px]">
                    <span className="font-medium text-white truncate" title={item.name}>{item.name}</span>
                    <span className="text-sm font-semibold text-sky-400 mt-1">₹{item.price * item.qty}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-neutral-950 rounded-full px-1 py-1 border border-neutral-800">
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors">
                      <span className="text-lg leading-none mb-[2px]">-</span>
                    </button>
                    <span className="text-sm font-bold w-4 text-center text-white">{item.qty}</span>
                    <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors">
                      <span className="text-lg leading-none mb-[2px]">+</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Totals Container (Sits within Right Side but connects visually to Bottom) */}
          <div className="p-5 border-t border-neutral-800 bg-neutral-900/90 shrink-0 space-y-3">
            <div className="flex justify-between text-neutral-400 text-sm font-medium">
              <span>Subtotal</span>
              <span>₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-400 text-sm font-medium">
              <span>GST (5%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-neutral-800 border-dashed m-0"></div>
          </div>
        </aside>
      </div>

      {/* BOTTOM: Payment Actions Pane */}
      <div className="h-28 shrink-0 bg-neutral-900 border-t border-neutral-800 px-8 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.4)] z-20">
        
        {/* Total Prominent Display */}
        <div className="flex flex-col">
          <span className="text-neutral-400 text-sm font-bold uppercase tracking-wider mb-1">Amount to Pay</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl text-sky-400 font-bold">₹</span>
            <span className="text-4xl font-black text-white tracking-tight">{grandTotal.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-6 py-4 rounded-xl font-bold bg-neutral-950 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800 shadow-sm active:scale-95">
            <Banknote size={20} className="text-emerald-400" /> 
            <span>Cash</span>
          </button>
          
          <button className="flex items-center gap-2 px-6 py-4 rounded-xl font-bold bg-neutral-950 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800 shadow-sm active:scale-95">
            <CreditCard size={20} className="text-indigo-400" /> 
            <span>Card</span>
          </button>
          
          {/* Print & Charge Button */}
          <button 
            onClick={() => handleCheckout(true)}
            disabled={cart.length === 0}
            className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all active:scale-95 border
              ${cart.length === 0 
                ? 'bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed' 
                : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border-indigo-500/30 hover:border-indigo-500 shadow-sm'
              }
            `}
            title="Print Receipt & Charge"
          >
            <Printer size={20} />
            <span>Print</span>
          </button>

          {/* Main Checkout Button */}
          <button 
            onClick={() => handleCheckout(false)}
            disabled={cart.length === 0}
            className={`flex items-center gap-3 px-10 py-4 rounded-xl font-black text-lg transition-all active:scale-95 border
              ${cart.length === 0 
                ? 'bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed' 
                : 'bg-sky-500 text-white hover:bg-sky-400 border-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]'
              }
            `}
          >
            <Wallet size={24} />
            <span>Charge Bill</span>
          </button>
        </div>
        
      </div>

      {/* Basic Utility Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
