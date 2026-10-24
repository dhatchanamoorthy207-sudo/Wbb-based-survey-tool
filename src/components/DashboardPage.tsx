import React, { useState, useEffect } from 'react';
import { Survey, User } from '../types';
import { api } from '../api';
import {
  PlusCircle,
  BarChart3,
  Share2,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileText,
  Users,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface DashboardPageProps {
  currentUser: User;
  onNavigate: (view: string, surveyId?: number) => void;
  onOpenShare: (survey: Survey) => void;
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  onNavigate,
  onOpenShare,
  onShowToast,
}) => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const data = await api.getMySurveys();
      setSurveys(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load surveys', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [currentUser]);

  const handleToggleStatus = async (survey: Survey, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.toggleSurveyStatus(survey.id);
      setSurveys((prev) =>
        prev.map((s) => (s.id === survey.id ? { ...s, is_active: res.is_active } : s))
      );
      onShowToast(res.message, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update status', 'error');
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      await api.deleteSurvey(id);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
      onShowToast('Survey deleted successfully.', 'success');
      setDeletingId(null);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete survey', 'error');
    }
  };

  const totalResponses = surveys.reduce((acc, s) => acc + (s.response_count || 0), 0);
  const activeCount = surveys.filter((s) => s.is_active === 1).length;

  const categories = ['All', ...Array.from(new Set(surveys.map((s) => s.category || 'General')))];

  const filteredSurveys = surveys.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Metrics */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Creator Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {currentUser.name}!
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              Manage your active questionnaires, collect real-time responses, and generate instant analytics.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('create')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-blue-700 hover:bg-blue-50 shadow-md transition-all hover:scale-102"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Survey</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/20">
          <div>
            <div className="text-xs text-blue-200 font-medium">My Surveys</div>
            <div className="text-2xl sm:text-3xl font-black mt-0.5">{surveys.length}</div>
          </div>
          <div>
            <div className="text-xs text-blue-200 font-medium">Total Responses</div>
            <div className="text-2xl sm:text-3xl font-black mt-0.5 text-blue-100">{totalResponses}</div>
          </div>
          <div>
            <div className="text-xs text-blue-200 font-medium">Currently Open</div>
            <div className="text-2xl sm:text-3xl font-black mt-0.5 text-emerald-300">{activeCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-blue-100 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by survey title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 hidden sm:inline" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Survey Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold mt-3">Loading surveys...</p>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No surveys found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm || categoryFilter !== 'All'
              ? 'Try adjusting your search query or category filter.'
              : 'You have not created any surveys yet. Start collecting valuable feedback in minutes.'}
          </p>
          <button
            onClick={() => onNavigate('create')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Survey</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSurveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 pb-3">
                {/* Header: Category & Active status toggle */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {survey.category || 'General'}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleToggleStatus(survey, e)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                      survey.is_active === 1
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                    }`}
                    title="Click to toggle Open/Closed status"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        survey.is_active === 1 ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span>{survey.is_active === 1 ? 'Accepting Responses' : 'Closed'}</span>
                  </button>
                </div>

                <h3
                  onClick={() => onNavigate('results', survey.id)}
                  className="font-bold text-base text-slate-900 hover:text-blue-600 transition-colors cursor-pointer leading-snug line-clamp-2"
                >
                  {survey.title}
                </h3>

                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {survey.description || 'No description provided.'}
                </p>

                {/* Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <strong className="text-slate-900">{survey.response_count || 0}</strong> responses
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(survey.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-1">
                <button
                  onClick={() => onNavigate('results', survey.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
                  title="View analytical charts and responses"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Results</span>
                </button>

                <button
                  onClick={() => onOpenShare(survey)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                  title="Share questionnaire link"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('survey', survey.id)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                  title="Preview / Fill survey as respondent"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('edit', survey.id)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                  title="Edit survey questions"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeletingId(survey.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
                  title="Delete survey"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete this survey?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will permanently remove the survey and all recorded respondent answers. This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deletingId)}
                className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
