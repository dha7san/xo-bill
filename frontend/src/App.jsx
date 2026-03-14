import React, { useState, useEffect } from 'react';
import useCartStore from './store/cartStore';
import { ShoppingCart, LayoutGrid, Search, Receipt, Trash2, WifiOff } from 'lucide-react';
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
];

function App() {
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

    // Initial check just in case
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
        // Mock API Call to actual backend endpoint
        // e.g. await axios.post('http://localhost:5000/api/billing', order)
        console.log('Successfully synced order:', order.orderNumber);
        removeOfflineOrder(order.orderNumber);
      } catch (err) {
        console.error('Failed to sync order:', order.orderNumber);
      }
    }
    
    if (offlineOrders.length > 0) {
      alert(`Successfully synced pending orders!`);
    }
  };

  const categories = ['All', ...new Set(DUMMY_MENU.map(i => i.category))];
  
  const filteredMenu = activeCategory === 'All' 
    ? DUMMY_MENU 
    : DUMMY_MENU.filter(i => i.category === activeCategory);

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const gst = subTotal * 0.05; // 5% GST
  const grandTotal = subTotal + gst;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty!');
    
    // Simulate API call to standard backend format
    const payload = {
      orderNumber: uuidv4(), // Generate UUID here
      tableNumber,
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, menuItemId: i.id })),
      totalAmount: grandTotal,
      orderType: 'Dine-In',
      timestamp: new Date().toISOString()
    };

    if (!isOnline) {
      addOfflineOrder(payload);
      alert(`You are offline. Order for Table ${tableNumber} has been saved locally and will sync when internet returns!`);
    } else {
      console.log('Sending to backend live:', payload);
      // e.g. await axios.post('http://localhost:5000/api/billing', payload)
      // If error occurs, we could catch and addOfflineOrder(payload)
      alert(`Live order placed for Table ${tableNumber}!\nAmount: ₹${grandTotal.toFixed(2)}`);
    }
    
    clearCart();
  };

  return (
    <div className="app-container panel">
      {/* LEFT: Menu Area */}
      <div className="main-area">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2><LayoutGrid size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }}/> Categories</h2>
          <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '5px' }}>
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`panel ${activeCategory === cat ? 'active' : ''}`}
                style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '20px', 
                  cursor: 'pointer',
                  border: activeCategory === cat ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: activeCategory === cat ? 'rgba(56, 189, 248, 0.2)' : 'var(--bg-card)',
                  color: 'white'
                }}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="menu-grid fade-in">
          {filteredMenu.map(item => (
            <div key={item.id} className="menu-item" onClick={() => addToCart(item)}>
              <div className="name">{item.name}</div>
              <div className="price">₹{item.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Cart Area */}
      <div className="cart-sidebar panel">
        <div className="cart-header">
          <h3>
            <ShoppingCart size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}/> 
            Current Order
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isOnline && (
              <span className="badge" title={`${offlineOrders.length} pending orders`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <WifiOff size={12} />
                Offline ({offlineOrders.length})
              </span>
            )}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Table</span>
            <input 
              type="number" 
              value={tableNumber} 
              onChange={(e) => setTableNumber(Number(e.target.value))}
              style={{ width: '50px', padding: '5px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border)', borderRadius: '4px' }}
              min="1"
            />
            <Trash2 
               size={20} 
               color="var(--danger)" 
               cursor="pointer" 
               onClick={clearCart}
               style={{ marginLeft: '10px' }}
            />
          </div>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
              Cart is empty. Select items to add.
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item fade-in">
                <div className="cart-item-details">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">₹{item.price} × {item.qty}</span>
                </div>
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => removeFromCart(item.id)}>-</button>
                  <span>{item.qty}</span>
                  <button className="qty-btn" onClick={() => addToCart(item)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="totals-row">
            <span>Subtotal</span>
            <span>₹{subTotal.toFixed(2)}</span>
          </div>
          <div className="totals-row">
            <span>SGST (2.5%)</span>
            <span>₹{(gst / 2).toFixed(2)}</span>
          </div>
          <div className="totals-row">
            <span>CGST (2.5%)</span>
            <span>₹{(gst / 2).toFixed(2)}</span>
          </div>
          <div className="totals-row grand-total">
            <span>Total</span>
            <span style={{ color: 'var(--accent)' }}>₹{grandTotal.toFixed(2)}</span>
          </div>
          
          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={handleCheckout}>
            <Receipt size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
            Charge ₹{grandTotal.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
