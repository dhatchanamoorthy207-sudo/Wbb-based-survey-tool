import React, { useState, useEffect, useRef } from 'react';
import { Survey, Question } from '../types';
import { api } from '../api';
import confetti from 'canvas-confetti';
import {
  Star,
  CheckCircle2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Check,
  ShieldCheck,
  Clock,
  Layers
} from 'lucide-react';

interface PublicSurveyPageProps {
  surveyId: number;
  onNavigate: (view: string, surveyId?: number) => void;
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const PublicSurveyPage: React.FC<PublicSurveyPageProps> = ({
  surveyId,
  onNavigate,
  onShowToast,
}) => {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessages, setErrorMessages] = useState<Record<number, string>>({});
  const [hoverRating, setHoverRating] = useState<Record<number, number>>({});
  const [startTime] = useState<number>(Date.now());
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    setLoading(true);
    api.getPublicSurvey(surveyId)
      .then((data) => {
        setSurvey(data.survey);
        setQuestions(data.questions);

        // Check if respondent already answered on this machine
        const submittedKey = `pollpulse_answered_${surveyId}`;
        if (localStorage.getItem(submittedKey)) {
          // You can still let them answer or show notice
        }
      })
      .catch((err) => {
        onShowToast(err.message || 'Survey not found or inactive', 'error');
      })
      .finally(() => setLoading(false));
  }, [surveyId]);

  // Answer change handlers
  const handleAnswerSingle = (qId: number, val: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
    // Clear validation error if fixed
    if (errorMessages[qId]) {
      setErrorMessages((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const handleToggleMultiple = (qId: number, optionVal: string) => {
    const currentList: string[] = Array.isArray(answers[qId]) ? answers[qId] : [];
    let updated: string[];
    if (currentList.includes(optionVal)) {
      updated = currentList.filter((item) => item !== optionVal);
    } else {
      updated = [...currentList, optionVal];
    }
    setAnswers((prev) => ({ ...prev, [qId]: updated }));
    if (errorMessages[qId]) {
      setErrorMessages((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<number, string> = {};
    let firstFailedId: number | null = null;

    for (const q of questions) {
      if (!q.id) continue;
      const val = answers[q.id];
      const isMissing =
        val === undefined ||
        val === null ||
        (typeof val === 'string' && val.trim() === '') ||
        (Array.isArray(val) && val.length === 0);

      if (q.is_required && isMissing) {
        errors[q.id] = 'This question requires an answer before submitting.';
        if (!firstFailedId) firstFailedId = q.id;
      }
    }

    setErrorMessages(errors);

    if (firstFailedId && questionRefs.current[firstFailedId]) {
      questionRefs.current[firstFailedId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      onShowToast('Please answer all required questions highlighted in red.', 'error');
      return;
    }

    setSubmitting(true);
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    try {
      await api.submitSurveyResponse(surveyId, {
        answers,
        completion_seconds: durationSeconds,
      });

      // Mark locally
      localStorage.setItem(`pollpulse_answered_${surveyId}`, 'true');

      // Trigger celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSubmitted(true);
      onShowToast('Feedback recorded successfully! Thank you.', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to submit response.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute completion progress percentage
  const totalQuestions = questions.length;
  const answeredCount = questions.filter((q) => {
    if (!q.id) return false;
    const v = answers[q.id];
    return v !== undefined && v !== null && (typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) ? v.length > 0 : true);
  }).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold mt-3">Loading survey...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Survey Unavailable</h2>
        <p className="text-xs text-slate-500 mt-1">
          This survey does not exist or has been removed by the author.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (survey.is_active !== 1) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 text-center">
        <Clock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Survey is Closed</h2>
        <p className="text-xs text-slate-500 mt-1">
          The survey owner has marked this questionnaire as closed to new responses.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
        >
          Return to Home
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto my-16 bg-white p-8 sm:p-12 rounded-3xl border border-blue-100 shadow-xl text-center space-y-5 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Submission Received
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            Thank you for your feedback!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Your responses to <strong>"{survey.title}"</strong> have been securely saved to our database. Your input helps improve future course content, assignments, and experiences.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('results', survey.id)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            Inspect Live Results
          </button>
          <button
            onClick={() => {
              setAnswers({});
              setSubmitted(false);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Survey Title Card */}
      <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
            {survey.category || 'Feedback'}
          </span>
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Anonymous & Verified</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-snug">
          {survey.title}
        </h1>

        {survey.description && (
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {survey.description}
          </p>
        )}

        {/* Sticky-style Progress Bar */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span>Progress: {answeredCount} of {totalQuestions} answered</span>
            <span className="text-blue-600 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => {
          if (!q.id) return null;
          const qId = q.id;
          const currentVal = answers[qId];
          const hasError = Boolean(errorMessages[qId]);

          return (
            <div
              key={qId}
              ref={(el) => { questionRefs.current[qId] = el; }}
              className={`bg-white rounded-2xl border p-6 transition-all shadow-xs ${
                hasError
                  ? 'border-rose-400 ring-2 ring-rose-200'
                  : 'border-blue-100 hover:border-blue-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {q.question_text}
                      {q.is_required && (
                        <span className="text-rose-500 font-bold ml-1" title="Required question">
                          *
                        </span>
                      )}
                    </h3>
                    {q.help_text && (
                      <p className="text-xs text-slate-500 mt-1 italic">{q.help_text}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* INPUT FIELDS ACCORDING TO TYPE */}
              <div className="mt-4 pt-2">
                {/* 1. RATING (1-5 STARS) */}
                {q.question_type === 'rating' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 sm:gap-3 py-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isHovered = (hoverRating[qId] || 0) >= star;
                        const isSelected = Number(currentVal) >= star;
                        const active = isHovered || (!hoverRating[qId] && isSelected);

                        const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Exceptional'];

                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating((prev) => ({ ...prev, [qId]: star }))}
                            onMouseLeave={() => setHoverRating((prev) => ({ ...prev, [qId]: 0 }))}
                            onClick={() => handleAnswerSingle(qId, star)}
                            className="p-1 rounded-xl transition-transform hover:scale-115 focus:outline-none"
                            title={`${star} star - ${labels[star]}`}
                          >
                            <Star
                              className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                                active
                                  ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                                  : 'fill-slate-100 text-slate-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                      {currentVal && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg ml-2">
                          {currentVal} of 5 Stars
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. SINGLE CHOICE (RADIO BUTTONS) */}
                {q.question_type === 'single_choice' && (
                  <div className="space-y-2">
                    {(q.options || []).map((opt, optIdx) => {
                      const selected = currentVal === opt;
                      return (
                        <label
                          key={optIdx}
                          onClick={() => handleAnswerSingle(qId, opt)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                            selected
                              ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 text-blue-900 font-semibold shadow-2xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50/80 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${qId}`}
                            checked={selected}
                            onChange={() => handleAnswerSingle(qId, opt)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs sm:text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 3. MULTIPLE CHOICE (CHECKBOXES) */}
                {q.question_type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-slate-400 mb-1">Select all that apply:</div>
                    {(q.options || []).map((opt, optIdx) => {
                      const selectedList = Array.isArray(currentVal) ? currentVal : [];
                      const selected = selectedList.includes(opt);
                      return (
                        <label
                          key={optIdx}
                          onClick={() => handleToggleMultiple(qId, opt)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                            selected
                              ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 text-blue-900 font-semibold shadow-2xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50/80 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleToggleMultiple(qId, opt)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs sm:text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 4. YES / NO TOGGLE */}
                {q.question_type === 'yes_no' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleAnswerSingle(qId, 'Yes')}
                      className={`py-3.5 px-4 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        currentVal === 'Yes'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Yes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAnswerSingle(qId, 'No')}
                      className={`py-3.5 px-4 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        currentVal === 'No'
                          ? 'bg-slate-800 border-slate-800 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>No</span>
                    </button>
                  </div>
                )}

                {/* 5. DROPDOWN SELECTION */}
                {q.question_type === 'dropdown' && (
                  <div>
                    <select
                      value={currentVal || ''}
                      onChange={(e) => handleAnswerSingle(qId, e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium"
                    >
                      <option value="">Please select an option...</option>
                      {(q.options || []).map((opt, optIdx) => (
                        <option key={optIdx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 6. OPEN-ENDED TEXT */}
                {q.question_type === 'text' && (
                  <div className="space-y-1">
                    <textarea
                      rows={3}
                      maxLength={2000}
                      placeholder="Type your response here..."
                      value={currentVal || ''}
                      onChange={(e) => handleAnswerSingle(qId, e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                    />
                    <div className="flex justify-end text-[10px] text-slate-400">
                      {(currentVal || '').length} / 2000 characters
                    </div>
                  </div>
                )}
              </div>

              {/* Error indicator */}
              {hasError && (
                <div className="mt-3 text-xs font-semibold text-rose-600 flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessages[qId]}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Submit Button */}
        <div className="pt-4 pb-12 text-center space-y-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Submit Response</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-400">
            Responses are securely processed and validated using parameterized database transactions.
          </p>
        </div>
      </form>
    </div>
  );
};
