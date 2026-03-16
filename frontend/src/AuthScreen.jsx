import React, { useState } from 'react';
import { Mail, Lock, User, Key, ArrowRight, ShieldCheck, Coffee } from 'lucide-react';
import useAuthStore from './store/authStore';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'pin'
  const { login, register, error, isLoading } = useAuthStore();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        if (loginMethod === 'email') {
          await login({ email, password });
        } else {
          await login({ pin });
        }
      } else {
        await register({ firstName, lastName, email, password, pin });
      }
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>

      <div className="w-full max-w-[420px] z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center text-sky-400 border border-sky-500/30 mb-6 shadow-2xl">
            <Coffee size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">XoPOS</h1>
          <p className="text-neutral-500 font-medium tracking-wide">Premium Restaurant Management</p>
        </div>

        <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex gap-1 bg-neutral-950 p-1.5 rounded-2xl mb-8 border border-neutral-800">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isLogin ? 'bg-sky-500 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!isLogin ? 'bg-sky-500 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          {isLogin && (
            <div className="flex justify-center gap-6 mb-8 border-b border-neutral-800 pb-4">
              <button 
                onClick={() => setLoginMethod('email')}
                className={`text-xs font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${loginMethod === 'email' ? 'text-sky-400 border-sky-400' : 'text-neutral-600 border-transparent hover:text-neutral-400'}`}
              >
                Email
              </button>
              <button 
                onClick={() => setLoginMethod('pin')}
                className={`text-xs font-black uppercase tracking-widest pb-2 transition-all border-b-2 ${loginMethod === 'pin' ? 'text-sky-400 border-sky-400' : 'text-neutral-600 border-transparent hover:text-neutral-400'}`}
              >
                PIN
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                    <input
                      type="text"
                      required
                      value={firstName} onChange={e => setFirstName(e.target.value)}
                      placeholder="John"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none focus:border-sky-500 transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Last Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={lastName} onChange={e => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-sky-500 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {(isLogin ? loginMethod === 'email' : true) && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                  <input
                    type="email"
                    required
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="manager@restaurant.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none focus:border-sky-500 transition-all font-medium"
                  />
                </div>
              </div>
            )}

            {(isLogin ? loginMethod === 'email' : true) && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                  <input
                    type="password"
                    required
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none focus:border-sky-500 transition-all font-medium"
                  />
                </div>
              </div>
            )}

            {(isLogin ? loginMethod === 'pin' : true) && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Store PIN</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    value={pin} onChange={e => setPin(e.target.value)}
                    placeholder="1 2 3 4"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none focus:border-sky-500 transition-all font-mono tracking-[0.8em] text-center"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold text-center animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-white font-black py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] flex items-center justify-center gap-3 active:scale-95 group"
            >
              {isLoading ? 'Processing...' : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 text-neutral-600">
          <ShieldCheck size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">End-to-End Encrypted Terminal</span>
        </div>
      </div>
    </div>
  );
}
