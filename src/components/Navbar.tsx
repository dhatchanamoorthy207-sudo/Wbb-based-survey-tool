import React, { useState } from 'react';
import { User } from '../types';
import {
  FileText,
  BarChart3,
  PlusCircle,
  Home,
  LogOut,
  LogIn,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeView: string;
  onNavigate: (view: string, surveyId?: number) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onDemoLogin: (role: 'demo' | 'instructor') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  onNavigate,
  onOpenAuth,
  onLogout,
  onDemoLogin,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <span>PollPulse</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-md">Pro</span>
            </div>
            <div className="text-[11px] text-slate-500 -mt-0.5 font-medium">Smart Surveys & Analytics</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeView === 'home'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          {currentUser && (
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>My Surveys</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!currentUser) {
                onOpenAuth();
              } else {
                onNavigate('create');
              }
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeView === 'create'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>Create Survey</span>
          </button>
        </nav>

        {/* Right side: Demo switch & User profile */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
              title="Switch demo account"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">1-Click Demo Accounts</span>
              <span className="sm:hidden">Demo</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            {demoDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setDemoDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  Switch Preset Account
                </div>
                <button
                  onClick={() => {
                    onDemoLogin('instructor');
                    setDemoDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-slate-900">Prof. Jordan Reed</div>
                    <div className="text-[11px] text-slate-500 truncate">CS301 Course & Assignment Surveys</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onDemoLogin('demo');
                    setDemoDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 border-t border-slate-100"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-slate-900">Alex Morgan</div>
                    <div className="text-[11px] text-slate-500 truncate">Product Experience & CSAT Lead</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* User Profile or Sign In */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                aria-expanded={userDropdownOpen}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {currentUser.email}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      onNavigate('dashboard');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>My Surveys & Results</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('create');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>New Survey</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      onLogout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg active:scale-98"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
