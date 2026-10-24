import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Sparkles, AlertCircle, GraduationCap, Briefcase } from 'lucide-react';
import { api } from '../api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        const res = await api.register(name, email, password);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await api.login(email, password);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'demo' | 'instructor') => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.loginDemo(role);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-b from-blue-50/60 to-white border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100/70 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PollPulse Access</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Creator Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'login'
              ? 'Sign in to create surveys, view live charts, and export CSVs.'
              : 'Sign up to build custom surveys and collect student or customer feedback.'}
          </p>

          {/* Quick 1-Click Demo Buttons */}
          <div className="mt-4 pt-3 border-t border-blue-100/60">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Instant 1-Click Test Accounts
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('instructor')}
                className="flex items-center gap-2 p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 text-xs font-medium transition-all text-left group"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold truncate text-[11px]">Prof. Jordan</div>
                  <div className="text-[10px] text-emerald-700/80 truncate">CS301 Course Survey</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('demo')}
                className="flex items-center gap-2 p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-800 text-xs font-medium transition-all text-left group"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-200/80 text-blue-800 flex items-center justify-center shrink-0">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold truncate text-[11px]">Alex Morgan</div>
                  <div className="text-[10px] text-blue-700/80 truncate">Product Feedback</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switch */}
        <div className="flex border-b border-slate-100 px-6 pt-3 bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Taylor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password {mode === 'register' && <span className="text-slate-400 font-normal">(min 6 chars)</span>}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
