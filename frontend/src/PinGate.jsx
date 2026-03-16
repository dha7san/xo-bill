import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, Coffee, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { CONFIG, verifyPin, SESSION_KEYS } from './config';

// ─── Pin dot display ───────────────────────────────────────────────────────
function PinDots({ length, filled }) {
  return (
    <div className="flex items-center justify-center gap-4 my-6">
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full transition-all duration-200 ${
            i < filled
              ? 'bg-sky-400 scale-110 shadow-[0_0_10px_rgba(56,189,248,0.6)]'
              : 'bg-neutral-700'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Numeric keypad ────────────────────────────────────────────────────────
const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

function Keypad({ onKey }) {
  // Also support keyboard input
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') onKey(e.key);
      if (e.key === 'Backspace') onKey('⌫');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onKey]);

  return (
    <div className="grid grid-cols-3 gap-3 w-64">
      {KEYS.map((k, i) => (
        k === '' ? (
          <div key={i} />   // empty cell
        ) : (
          <button
            key={i}
            onClick={() => onKey(k)}
            className={`h-14 rounded-2xl text-xl font-bold transition-all active:scale-90 select-none ${
              k === '⌫'
                ? 'bg-neutral-800 text-red-400 hover:bg-red-500/20 border border-neutral-700'
                : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
            }`}
          >
            {k}
          </button>
        )
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── Full-screen App Lock Screen  (cashier PIN) ────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export function AppLockScreen({ onUnlock }) {
  const [pin, setPin]       = useState('');
  const [error, setError]   = useState('');
  const [shaking, setShake] = useState(false);
  const PIN_LEN = 4;

  const handleKey = useCallback(async (k) => {
    if (k === '⌫') {
      setPin(p => p.slice(0, -1));
      setError('');
      return;
    }
    if (pin.length >= PIN_LEN) return;

    const next = pin + k;
    setPin(next);

    if (next.length === PIN_LEN) {
      const ok = await verifyPin(next, CONFIG.cashierPinHash);
      if (ok) {
        onUnlock();
      } else {
        setShake(true);
        setError('Incorrect PIN, try again');
        setTimeout(() => { setPin(''); setError(''); setShake(false); }, 800);
      }
    }
  }, [pin, onUnlock]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-neutral-950 select-none">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
          <Coffee size={28} strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">{CONFIG.storeName}</h1>
          <p className="text-neutral-500 text-sm font-medium tracking-widest uppercase">{CONFIG.storeTagline}</p>
        </div>
      </div>

      {/* Lock icon + title */}
      <div className="flex flex-col items-center gap-2 mb-2">
        <div className={`w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 transition-all ${shaking ? 'animate-[shake_0.4s_ease]' : ''}`}>
          <Lock size={22} />
        </div>
        <p className="text-neutral-300 font-semibold text-lg">Enter Cashier PIN</p>
      </div>

      {/* Dots */}
      <div className={shaking ? 'animate-[shake_0.4s_ease]' : ''}>
        <PinDots length={PIN_LEN} filled={pin.length} />
      </div>

      {/* Error */}
      <div className={`h-6 mb-4 flex items-center gap-1.5 text-sm text-red-400 font-medium transition-opacity ${error ? 'opacity-100' : 'opacity-0'}`}>
        <AlertCircle size={14} />
        {error || ' '}
      </div>

      {/* Keypad */}
      <Keypad onKey={handleKey} />

      <p className="text-neutral-700 text-xs mt-8">
        Default PIN: <span className="font-mono">1234</span> · Change via <span className="font-mono">.env.local</span>
      </p>

      {/* Shake animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── Manager PIN modal (shorter dialog, for Reports/Inventory) ─────────────
// ═══════════════════════════════════════════════════════════════════════════
export function ManagerPinModal({ title = 'Manager Access', onUnlock, onCancel }) {
  const [pin, setPin]       = useState('');
  const [error, setError]   = useState('');
  const [shaking, setShake] = useState(false);
  const [visible, setVisible] = useState(false);
  const PIN_LEN = 4;

  const handleKey = useCallback(async (k) => {
    if (k === '⌫') {
      setPin(p => p.slice(0, -1));
      setError('');
      return;
    }
    if (pin.length >= PIN_LEN) return;

    const next = pin + k;
    setPin(next);

    if (next.length === PIN_LEN) {
      const ok = await verifyPin(next, CONFIG.managerPinHash);
      if (ok) {
        onUnlock();
      } else {
        setShake(true);
        setError('Incorrect manager PIN');
        setTimeout(() => { setPin(''); setError(''); setShake(false); }, 800);
      }
    }
  }, [pin, onUnlock]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center">
        {/* Header */}
        <div className="w-11 h-11 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
          <ShieldCheck size={22} />
        </div>
        <h3 className="text-white font-bold text-lg mb-0.5">{title}</h3>
        <p className="text-neutral-500 text-xs mb-4">Enter your manager PIN to continue</p>

        {/* Pin input (text or dots) */}
        {visible ? (
          <div className="text-3xl font-black text-white tracking-[0.4em] h-12 flex items-center mb-2">
            {pin.padEnd(PIN_LEN, '·')}
          </div>
        ) : (
          <div className={shaking ? 'animate-[shake_0.4s_ease]' : ''}>
            <PinDots length={PIN_LEN} filled={pin.length} />
          </div>
        )}

        {/* Toggle visibility */}
        <button
          onClick={() => setVisible(v => !v)}
          className="text-neutral-600 hover:text-neutral-400 text-xs flex items-center gap-1 mb-2 transition-colors"
        >
          {visible ? <EyeOff size={12} /> : <Eye size={12} />}
          {visible ? 'Hide PIN' : 'Show PIN'}
        </button>

        {/* Error */}
        <div className={`h-5 mb-3 text-sm text-red-400 font-medium transition-opacity flex items-center gap-1 ${error ? 'opacity-100' : 'opacity-0'}`}>
          <AlertCircle size={13} />
          {error || ' '}
        </div>

        {/* Compact keypad */}
        <Keypad onKey={handleKey} />

        {/* Cancel */}
        <button
          onClick={onCancel}
          className="mt-5 text-neutral-600 hover:text-neutral-300 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── Hook: useAppSecurity ─────────────────────────────────────────────────
// Manages session state for cashier and manager auth.
// Session is cleared automatically when the browser tab is closed.
// ═══════════════════════════════════════════════════════════════════════════
export function useAppSecurity() {
  const [cashierUnlocked, setCashierUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEYS.cashierUnlocked) === '1'
  );
  const [managerUnlocked, setManagerUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEYS.managerUnlocked) === '1'
  );
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerCallback, setManagerCallback]   = useState(null);

  const unlockCashier = () => {
    sessionStorage.setItem(SESSION_KEYS.cashierUnlocked, '1');
    setCashierUnlocked(true);
  };

  const lockCashier = () => {
    sessionStorage.removeItem(SESSION_KEYS.cashierUnlocked);
    sessionStorage.removeItem(SESSION_KEYS.managerUnlocked);
    setCashierUnlocked(false);
    setManagerUnlocked(false);
  };

  /**
   * Request manager access. If already unlocked, calls cb immediately.
   * Otherwise shows the PIN modal.
   */
  const requireManager = (cb) => {
    if (managerUnlocked) { cb(); return; }
    setManagerCallback(() => cb);
    setShowManagerModal(true);
  };

  const onManagerUnlock = () => {
    sessionStorage.setItem(SESSION_KEYS.managerUnlocked, '1');
    setManagerUnlocked(true);
    setShowManagerModal(false);
    if (managerCallback) { managerCallback(); setManagerCallback(null); }
  };

  const onManagerCancel = () => {
    setShowManagerModal(false);
    setManagerCallback(null);
  };

  return {
    cashierUnlocked,
    managerUnlocked,
    showManagerModal,
    unlockCashier,
    lockCashier,
    requireManager,
    onManagerUnlock,
    onManagerCancel,
  };
}
