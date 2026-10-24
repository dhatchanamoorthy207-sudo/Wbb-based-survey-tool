import React, { useState } from 'react';
import { QuestionAnalytics } from '../types';
import { Star, CheckCircle, ThumbsUp, ThumbsDown, MessageSquare, Search, Filter } from 'lucide-react';

interface VisualChartProps {
  question: QuestionAnalytics;
}

export const VisualChart: React.FC<VisualChartProps> = ({ question }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 transition-all hover:shadow-md">
      {/* Question Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center">
              Q{question.display_order}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
              {question.question_type.replace('_', ' ')}
            </span>
            {question.is_required ? (
              <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                Required
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                Optional
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 leading-snug">
            {question.question_text}
          </h3>
          {question.help_text && (
            <p className="text-xs text-slate-500 mt-0.5 italic">{question.help_text}</p>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs font-semibold text-slate-500">Responses</div>
          <div className="text-lg font-extrabold text-blue-600">{question.totalAnswers}</div>
        </div>
      </div>

      {/* Analytics Content by Question Type */}
      <div className="mt-5">
        {/* RATING SCALE (1-5 STARS) */}
        {question.question_type === 'rating' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
              <div className="text-center sm:text-left shrink-0">
                <div className="text-4xl font-extrabold text-amber-600 tracking-tight">
                  {question.averageRating ? question.averageRating.toFixed(1) : '0.0'}
                </div>
                <div className="flex items-center gap-1 justify-center sm:justify-start mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(question.averageRating || 0)
                          ? 'fill-amber-400 text-amber-500'
                          : 'fill-slate-100 text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[11px] font-semibold text-amber-800/80 mt-1">
                  Average from {question.totalAnswers} ratings
                </div>
              </div>

              {/* Star distribution bars */}
              <div className="flex-1 w-full space-y-1.5 border-t sm:border-t-0 sm:border-l border-amber-200/60 pt-3 sm:pt-0 sm:pl-6">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = question.distribution ? question.distribution[stars] || 0 : 0;
                  const pct = question.totalAnswers > 0 ? Math.round((count / question.totalAnswers) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <div className="w-12 flex items-center gap-1 font-semibold text-slate-700 shrink-0">
                        <span>{stars}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      </div>
                      <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-16 text-right font-medium text-slate-600 shrink-0">
                        {count} ({pct}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* YES / NO */}
        {question.question_type === 'yes_no' && question.breakdown && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 mb-2">
              {question.breakdown.map((item) => {
                const isYes = item.label.toLowerCase() === 'yes';
                return (
                  <div
                    key={item.label}
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      isYes ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isYes ? (
                        <ThumbsUp className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ThumbsDown className="w-4 h-4 text-slate-500" />
                      )}
                      <span className="font-bold text-sm">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold">{item.percentage}%</span>
                      <span className="text-xs text-slate-500 block">({item.count} votes)</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Split Progress Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {question.breakdown.map((item) => {
                const isYes = item.label.toLowerCase() === 'yes';
                return (
                  <div
                    key={item.label}
                    style={{ width: `${item.percentage}%` }}
                    className={`h-full transition-all duration-500 ${isYes ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    title={`${item.label}: ${item.count} (${item.percentage}%)`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* SINGLE CHOICE, DROPDOWN, MULTIPLE CHOICE */}
        {['single_choice', 'dropdown', 'multiple_choice'].includes(question.question_type) &&
          question.breakdown && (
            <div className="space-y-3">
              {question.breakdown.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">No options recorded.</div>
              ) : (
                question.breakdown.map((item, idx) => {
                  const colors = [
                    'from-blue-600 to-indigo-600',
                    'from-sky-500 to-blue-500',
                    'from-teal-500 to-emerald-500',
                    'from-violet-500 to-purple-500',
                    'from-amber-500 to-orange-500',
                    'from-rose-500 to-pink-500',
                  ];
                  const barGradient = colors[idx % colors.length];

                  return (
                    <div key={item.label} className="group">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                          {item.label}
                        </span>
                        <span className="font-medium text-slate-500">
                          <strong className="text-slate-800">{item.count}</strong> responses ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
                          style={{ width: `${Math.max(item.percentage, item.count > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        {/* OPEN-ENDED TEXT RESPONSES */}
        {question.question_type === 'text' && (
          <div className="space-y-3">
            {question.textResponses && question.textResponses.length > 0 ? (
              <>
                {/* Search in text responses */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search keywords in respondent feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto pr-1 space-y-2">
                  {question.textResponses
                    .filter((r) => !searchTerm || r.text.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors"
                      >
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          "{item.text}"
                        </p>
                        <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
                          <span>Respondent #{item.id}</span>
                          <span>
                            {item.date ? new Date(item.date).toLocaleDateString() : 'Recent submission'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 italic">
                No text responses submitted yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
