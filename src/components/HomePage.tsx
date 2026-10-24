import React from 'react';
import { Survey, User } from '../types';
import {
  BarChart3,
  CheckCircle2,
  PlusCircle,
  FileSpreadsheet,
  ShieldCheck,
  Star,
  Users,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Layers,
  Check,
  Clock,
  HelpCircle
} from 'lucide-react';

interface HomePageProps {
  currentUser: User | null;
  featuredSurveys: Survey[];
  onNavigate: (view: string, surveyId?: number) => void;
  onOpenAuth: () => void;
  onDemoLogin: (role: 'demo' | 'instructor') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  featuredSurveys,
  onNavigate,
  onOpenAuth,
  onDemoLogin,
}) => {
  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-20 bg-gradient-to-b from-blue-50/70 via-white to-white border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wide mb-6 shadow-xs border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modern Web-Based Survey & Feedback Platform</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Collect User Feedback & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Transform Responses into Action
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Create multi-question surveys with 6 question types, distribute shareable links, prevent duplicate submissions, and analyze live feedback through visual charts and CSV exports.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => {
                if (!currentUser) onOpenAuth();
                else onNavigate('create');
              }}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create Survey Now</span>
            </button>

            <button
              onClick={() => onDemoLogin('instructor')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600"
            >
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              <span>Explore Course Survey Demo</span>
            </button>

            {currentUser && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Layers className="w-4 h-4" />
                <span>Go to My Surveys</span>
              </button>
            )}
          </div>

          {/* Key Trust Highlights */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-blue-100/70 text-left">
            <div className="p-3">
              <div className="text-2xl font-black text-slate-900">6 Types</div>
              <div className="text-xs text-slate-500 font-medium">Ratings, Choices, Yes/No, Text</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-blue-600">Real-Time</div>
              <div className="text-xs text-slate-500 font-medium">Visual Bar & Average Charts</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-emerald-600">RFC CSV</div>
              <div className="text-xs text-slate-500 font-medium">1-Click Spreadsheet Export</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-indigo-600">SQLite</div>
              <div className="text-xs text-slate-500 font-medium">Parameterized SQL & Strict Schema</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED / DEMO SURVEYS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
              Live Interactive Demos
            </div>
            <h2 className="text-2xl font-extrabold text-slate-950">
              Active Questionnaires Ready to Test
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Click any survey to submit live respondent feedback or inspect calculated visual analytics.
            </p>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
          >
            <span>View All in Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredSurveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {survey.category || 'General'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Accepting Responses
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {survey.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {survey.description || 'No description provided.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <strong className="text-slate-800">{survey.response_count || 0}</strong> responses
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <strong className="text-slate-800">{survey.question_count || 0}</strong> questions
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate('survey', survey.id)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                >
                  <span>Take Survey</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onNavigate('results', survey.id)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>View Results</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6 QUESTION TYPES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Rich Questionnaire Flexibility
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1">
            Built for Every Kind of Question
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Collect precise answers with native input controls designed for usability and accessibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:border-blue-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3">
              <Star className="w-5 h-5 fill-amber-500 text-amber-600" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">1. Rating-Scale Questions (1–5 Stars)</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Interactive star widgets with hover effects, rating averages, and 5-point distribution breakdowns.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:border-blue-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">2. Single-Choice Questions</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Radio button option cards that highlight cleanly with percentage breakdown bar charts in analytics.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:border-blue-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-3">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">3. Multiple-Choice Questions</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Multi-select checkbox options allowing respondents to choose all applicable preferences.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:border-blue-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">4. Yes / No Toggle Questions</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              High-visibility segmented toggle cards with immediate ratio comparison gauges.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:border-blue-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold mb-3">
              <Clock className="w-5 h-5 text-sky-600" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">5. Dropdown Selection Questions</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Compact select menus ideal for long lists like courses, job departments, or frequency intervals.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs hover:border-blue-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3">
              <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">6. Open-Ended Text Questions</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Generous input fields with character counters, verbatim feedback review cards, and search filtering.
            </p>
          </div>
        </div>
      </section>

      {/* SECURITY & ARCHITECTURE CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-4 border border-blue-400/30">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Full-Stack Security & Data Integrity</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Engineered for Rigorous Production Standards
            </h3>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Every survey is guarded by parameterized SQLite queries to eliminate SQL injection, Bcrypt password hashing, server-side data validation schemas, and authorized role ownership.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Parameterized Prepared Queries
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Bcrypt Salt Hashing
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Strict Client & Server Validation
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
