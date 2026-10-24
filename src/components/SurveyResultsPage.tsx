import React, { useState, useEffect } from 'react';
import { SurveyResults, IndividualResponse } from '../types';
import { api } from '../api';
import { VisualChart } from './VisualChart';
import {
  BarChart3,
  Download,
  Share2,
  Trash2,
  ExternalLink,
  Edit3,
  Filter,
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Table as TableIcon,
  PieChart,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface SurveyResultsPageProps {
  surveyId: number;
  onNavigate: (view: string, surveyId?: number) => void;
  onOpenShare: (survey: any) => void;
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const SurveyResultsPage: React.FC<SurveyResultsPageProps> = ({
  surveyId,
  onNavigate,
  onOpenShare,
  onShowToast,
}) => {
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [detailedResponses, setDetailedResponses] = useState<{
    questions: any[];
    responses: IndividualResponse[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'responses'>('analytics');
  const [selectedQuestionFilter, setSelectedQuestionFilter] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const [resData, respData] = await Promise.all([
        api.getSurveyResults(surveyId),
        api.getIndividualResponses(surveyId),
      ]);
      setResults(resData);
      setDetailedResponses(respData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to fetch analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [surveyId]);

  const handleClearResponses = async () => {
    setClearing(true);
    try {
      await api.clearResponses(surveyId);
      onShowToast('All survey responses cleared.', 'success');
      setShowClearConfirm(false);
      await fetchResults();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to clear responses', 'error');
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold mt-3">Computing analytics & charts...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center">
        <h2 className="text-base font-bold text-slate-900">Survey Not Found</h2>
        <button
          onClick={() => onNavigate('dashboard')}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { survey, summary, questions } = results;

  const filteredQuestions =
    selectedQuestionFilter === 'all'
      ? questions
      : questions.filter((q) => String(q.id) === selectedQuestionFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {survey.category || 'General'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  survey.is_active === 1
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    survey.is_active === 1 ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                {survey.is_active === 1 ? 'Accepting Responses' : 'Closed'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-snug">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                {survey.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Export CSV */}
            <a
              href={api.getExportCsvUrl(survey.id)}
              download
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              title="Download clean RFC-4180 CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>

            {/* Share link */}
            <button
              type="button"
              onClick={() => onOpenShare(survey)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Share Link</span>
            </button>

            {/* Fill Survey as respondent */}
            <button
              type="button"
              onClick={() => onNavigate('survey', survey.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Fill Form</span>
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => onNavigate('edit', survey.id)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Edit questions"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchResults}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Refresh results"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Analytics Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-800">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Total Submissions</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-950 mt-1">
              {summary.totalResponses}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Avg Completion</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {summary.avgCompletionSeconds > 0 ? `${summary.avgCompletionSeconds}s` : '1.5 min'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Total Questions</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {questions.length}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-700">Created</div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {new Date(survey.created_at).toLocaleDateString()}
              </div>
            </div>

            {summary.totalResponses > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline p-1"
                title="Clear test responses"
              >
                Clear Data
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-blue-100 shadow-xs">
        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Visual Analytics ({questions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('responses')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'responses'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Individual Responses ({summary.totalResponses})</span>
          </button>
        </div>

        {/* Filter by question (only in analytics tab) */}
        {activeTab === 'analytics' && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedQuestionFilter}
              onChange={(e) => setSelectedQuestionFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Show All Questions ({questions.length})</option>
              {questions.map((q) => (
                <option key={q.id} value={String(q.id)}>
                  Q{q.display_order}: {q.question_text.substring(0, 35)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ANALYTICS TAB: VISUAL CHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {summary.totalResponses === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No responses recorded yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Share this survey link with respondents or submit a quick test response to populate visual charts.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => onNavigate('survey', survey.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                >
                  Submit Test Response
                </button>
                <button
                  onClick={() => onOpenShare(survey)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  Share Link
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredQuestions.map((q) => (
                <VisualChart key={q.id} question={q} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* RESPONSES TAB: INDIVIDUAL SUBMISSIONS TABLE */}
      {activeTab === 'responses' && detailedResponses && (
        <div className="bg-white rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Individual Response Records ({detailedResponses.responses.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological submission log with timestamp and completion duration.
              </p>
            </div>
            <a
              href={api.getExportCsvUrl(survey.id)}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </a>
          </div>

          {detailedResponses.responses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No submissions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-16">#</th>
                    <th className="py-3 px-4 w-32">Date</th>
                    <th className="py-3 px-4 w-24">Duration</th>
                    {detailedResponses.questions.map((q) => (
                      <th key={q.id} className="py-3 px-4 min-w-[200px]">
                        Q{q.display_order || ''}: {q.question_text}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailedResponses.responses.map((resp, i) => (
                    <tr key={resp.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {i + 1}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {resp.submission_date
                          ? new Date(resp.submission_date).toLocaleString()
                          : 'Recent'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {resp.completion_seconds ? `${resp.completion_seconds}s` : 'N/A'}
                      </td>
                      {detailedResponses.questions.map((q) => {
                        const raw = resp.answers[q.id];
                        let display = raw || '—';
                        try {
                          const parsed = JSON.parse(raw);
                          if (Array.isArray(parsed)) display = parsed.join(', ');
                        } catch {
                          // normal text
                        }
                        return (
                          <td key={q.id} className="py-3 px-4 max-w-xs truncate" title={display}>
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Clear responses confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Reset All Responses?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will delete all recorded answers for this survey so you can restart collecting responses fresh.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={handleClearResponses}
                className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {clearing ? 'Clearing...' : 'Clear Responses'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
