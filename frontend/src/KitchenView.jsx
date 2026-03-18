import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, ChefHat, Timer, CheckCircle, Flame, 
  ExternalLink, Maximize2, Bell, RefreshCcw
} from 'lucide-react';
import axios from 'axios';
import { socketService } from './services/socketService';
import { CONFIG } from './config';

const STATUS_COLORS = {
  pending:  'bg-neutral-800 text-neutral-400 border-neutral-700',
  cooking:  'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse',
  prepared: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function KdsTicket({ order, onUpdateStatus }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((new Date() - new Date(order.createdAt)) / 1000);
      setElapsed(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isUrgent = elapsed > (order.orderType === 'Takeaway' ? 600 : 900); // 10-15 mins

  return (
    <div className={`flex flex-col h-full bg-neutral-900 border-2 rounded-3xl overflow-hidden transition-all duration-300 ${
       order.kdsStatus === 'cooking' ? 'border-orange-500' : 'border-neutral-800'
    }`}>
      {/* Ticket Header */}
      <div className={`p-4 flex items-center justify-between border-b ${
        order.kdsStatus === 'cooking' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-neutral-800/50 border-neutral-800'
      }`}>
        <div>
          <h3 className="text-xl font-black text-white">#{order.orderNumber.slice(-4).toUpperCase()}</h3>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-[10px] font-black uppercase bg-white/10 px-2 py-0.5 rounded-full text-white/50">
               Table {order.tableNumber}
             </span>
             <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${order.orderType === 'Takeaway' ? 'bg-sky-500 text-white' : 'bg-violet-500 text-white'}`}>
               {order.orderType}
             </span>
          </div>
        </div>
        <div className={`flex flex-col items-end ${isUrgent ? 'text-red-400' : 'text-neutral-500'}`}>
          <div className="flex items-center gap-1 font-mono font-bold text-lg">
             <Timer size={16} /> {formatTime(elapsed)}
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest mt-0.5">Time Elapsed</span>
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 thin-scrollbar">
        {order.items.map((it, idx) => (
          <div key={idx} className="flex items-start gap-4">
             <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center font-black text-white shrink-0">
                {it.qty}
             </div>
             <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-lg leading-tight">{it.name}</div>
                {/* Modifiers / Notes could go here */}
                {it.notes && <div className="text-xs text-orange-400/80 italic mt-1 font-medium">"{it.notes}"</div>}
             </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-800 grid grid-cols-2 gap-3">
         {order.kdsStatus === 'pending' ? (
           <button 
             onClick={() => onUpdateStatus(order._id, 'cooking')}
             className="col-span-2 py-4 rounded-2xl bg-orange-500 text-white font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
           >
             <Flame size={20} /> Start Cooking
           </button>
         ) : (
           <>
              <button 
                onClick={() => onUpdateStatus(order._id, 'pending')}
                className="py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-500 font-bold uppercase text-xs transition-all"
              >
                Undo
              </button>
              <button 
                onClick={() => onUpdateStatus(order._id, 'prepared')}
                className="py-3 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> Ready
              </button>
           </>
         )}
      </div>
    </div>
  );
}

export default function KitchenView({ onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${CONFIG.apiBaseUrl}/orders?kdsStatus=pending,cooking`);
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();

    // Real-time listeners
    const stopNew = socketService.on('kds.new_order', (order) => {
      setOrders(prev => [...prev, order]);
      new Audio('/notification.mp3').play().catch(() => {}); // Optional: alert sound
    });

    const stopUpdate = socketService.on('kds.status_updated', ({ id, kdsStatus }) => {
       if (kdsStatus === 'prepared' || kdsStatus === 'served') {
         setOrders(prev => prev.filter(o => o._id !== id));
       } else {
         setOrders(prev => prev.map(o => o._id === id ? { ...o, kdsStatus } : o));
       }
    });

    return () => {
      stopNew();
      stopUpdate();
    };
  }, []);

  const updateStatus = async (id, status) => {
     try {
       await axios.patch(`${CONFIG.apiBaseUrl}/orders/${id}/kds`, { kdsStatus: status });
       // Logic for local update if socket hasn't arrived
       if (status === 'prepared') {
         setOrders(prev => prev.filter(o => o._id !== id));
       } else {
         setOrders(prev => prev.map(o => o._id === id ? { ...o, kdsStatus: status } : o));
       }
     } catch (err) {
       alert('Failed to update status');
     }
  };

  const pendingCount = orders.filter(o => o.kdsStatus === 'pending').length;
  const cookingCount = orders.filter(o => o.kdsStatus === 'cooking').length;

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col font-sans select-none overflow-hidden">
      {/* KDS Header */}
      <div className="h-20 bg-neutral-900 border-b border-neutral-800 px-8 flex items-center justify-between shrink-0 shadow-2xl">
         <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
               <ChefHat size={28} strokeWidth={2.5} />
            </div>
            <div>
               <h1 className="text-2xl font-black text-white tracking-tight">KITCHEN DISPLAY</h1>
               <div className="flex items-center gap-3 text-xs font-bold mt-0.5">
                  <span className="flex items-center gap-1.5 text-neutral-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM ACTIVE
                  </span>
                  <span className="text-neutral-700">|</span>
                  <span className="text-orange-400 uppercase tracking-widest">{pendingCount} NEW</span>
                  <span className="text-sky-400 uppercase tracking-widest">{cookingCount} COOKING</span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <button onClick={fetchActiveOrders} className="p-3 text-neutral-500 hover:text-white transition-colors">
               <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="h-10 w-px bg-neutral-800 mx-2"></div>
            <button onClick={onClose} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white px-6 py-2.5 rounded-2xl font-bold transition-all flex items-center gap-2">
               <X size={18} /> Exit KDS
            </button>
         </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-8 overflow-x-auto overflow-y-hidden bg-neutral-950">
         <div className="flex gap-6 h-full min-w-max">
            {orders.length === 0 && !loading && (
              <div className="w-full flex flex-col items-center justify-center opacity-30 gap-5">
                 <ChefHat size={120} strokeWidth={1} />
                 <p className="text-2xl font-black uppercase tracking-[0.3em]">Kitchen Is Clear</p>
              </div>
            )}
            
            {orders.map(order => (
              <div key={order._id} className="w-80 h-full shrink-0">
                <KdsTicket order={order} onUpdateStatus={updateStatus} />
              </div>
            ))}
         </div>
      </div>

      {/* Connection Toast (Static for now) */}
      <div className="fixed bottom-6 right-8 bg-neutral-800 border border-neutral-700 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl">
         <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
         <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Branch Node: Main Kitchen</span>
      </div>
    </div>
  );
}
