import React, { useState, useEffect } from 'react';
import { User, Survey } from './types';
import { api, getStoredUser, clearStoredAuth } from './api';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ShareModal } from './components/ShareModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { HomePage } from './components/HomePage';
import { DashboardPage } from './components/DashboardPage';
import { SurveyBuilderPage } from './components/SurveyBuilderPage';
import { PublicSurveyPage } from './components/PublicSurveyPage';
import { SurveyResultsPage } from './components/SurveyResultsPage';
import { BarChart3, ShieldCheck, Heart, Github } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [activeView, setActiveView] = useState<string>('home');
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | undefined>(undefined);
  const [featuredSurveys, setFeaturedSurveys] = useState<Survey[]>([]);

  // Modals & Toasts
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareSurvey, setShareSurvey] = useState<Survey | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check URL params on mount (for share links like ?view=survey&id=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const idParam = params.get('id');

    if (viewParam === 'survey' && idParam) {
      setSelectedSurveyId(Number(idParam));
      setActiveView('survey');
    } else if (viewParam === 'results' && idParam) {
      setSelectedSurveyId(Number(idParam));
      setActiveView('results');
    }
  }, []);

  // Sync current user profile from server
  useEffect(() => {
    if (getStoredUser()) {
      api.getCurrentUser()
        .then((user) => setCurrentUser(user))
        .catch(() => {
          clearStoredAuth();
          setCurrentUser(null);
        });
    }
  }, []);

  // Load featured community surveys
  const loadFeaturedSurveys = () => {
    api.getCommunitySurveys()
      .then(setFeaturedSurveys)
      .catch(() => {});
  };

  useEffect(() => {
    loadFeaturedSurveys();
  }, []);

  const handleNavigate = (view: string, surveyId?: number) => {
    setSelectedSurveyId(surveyId);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update browser URL query without full reload
    const url = new URL(window.location.href);
    if (view === 'survey' && surveyId) {
      url.searchParams.set('view', 'survey');
      url.searchParams.set('id', String(surveyId));
    } else if (view === 'results' && surveyId) {
      url.searchParams.set('view', 'results');
      url.searchParams.set('id', String(surveyId));
    } else {
      url.searchParams.delete('view');
      url.searchParams.delete('id');
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    showToast('Signed out successfully.', 'info');
    if (activeView === 'dashboard' || activeView === 'create' || activeView === 'edit') {
      handleNavigate('home');
    }
  };

  const handleDemoLogin = async (role: 'demo' | 'instructor') => {
    try {
      const res = await api.loginDemo(role);
      setCurrentUser(res.user);
      showToast(`Welcome! Signed in as ${res.user.name}.`, 'success');
      handleNavigate('dashboard');
    } catch (err: any) {
      showToast(err.message || 'Demo sign in failed.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Global Navigation Header */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={handleNavigate}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onDemoLogin={handleDemoLogin}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeView === 'home' && (
          <HomePage
            currentUser={currentUser}
            featuredSurveys={featuredSurveys}
            onNavigate={handleNavigate}
            onOpenAuth={() => setAuthModalOpen(true)}
            onDemoLogin={handleDemoLogin}
          />
        )}

        {activeView === 'dashboard' && (
          currentUser ? (
            <DashboardPage
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onOpenShare={(s) => setShareSurvey(s)}
              onShowToast={showToast}
            />
          ) : (
            <div className="py-24 text-center">
              <h2 className="text-lg font-bold text-slate-900">Sign in Required</h2>
              <p className="text-xs text-slate-500 mt-1">Please sign in to access your surveys.</p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
              >
                Sign In
              </button>
            </div>
          )
        )}

        {activeView === 'create' && (
          <SurveyBuilderPage
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {activeView === 'edit' && selectedSurveyId && (
          <SurveyBuilderPage
            surveyId={selectedSurveyId}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {activeView === 'survey' && selectedSurveyId && (
          <PublicSurveyPage
            surveyId={selectedSurveyId}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {activeView === 'results' && selectedSurveyId && (
          <SurveyResultsPage
            surveyId={selectedSurveyId}
            onNavigate={handleNavigate}
            onOpenShare={(s) => setShareSurvey(s)}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">PollPulse</span>
            <span className="text-slate-300">•</span>
            <span>Survey & Student Feedback Platform</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => handleNavigate('home')}
              className="hover:text-blue-600 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavigate('dashboard')}
              className="hover:text-blue-600 transition-colors"
            >
              Surveys
            </button>
            <button
              onClick={() => handleDemoLogin('instructor')}
              className="hover:text-emerald-600 transition-colors font-semibold"
            >
              Educator Demo
            </button>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              SQLite Parameterized Queries
            </span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome, ${user.name}!`, 'success');
          handleNavigate('dashboard');
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={Boolean(shareSurvey)}
        survey={shareSurvey}
        onClose={() => setShareSurvey(null)}
        onTakeSurvey={(id) => handleNavigate('survey', id)}
      />
    </div>
  );
}
