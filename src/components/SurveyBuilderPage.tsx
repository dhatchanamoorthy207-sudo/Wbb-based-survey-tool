import React, { useState, useEffect } from 'react';
import { Question, QuestionType, SurveyTemplate } from '../types';
import { api } from '../api';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Star,
  CheckCircle2,
  Layers,
  Check,
  ChevronDown,
  FileText,
  Sparkles,
  Save,
  Eye,
  Settings,
  HelpCircle,
  GraduationCap,
  AlertCircle
} from 'lucide-react';

interface SurveyBuilderPageProps {
  surveyId?: number; // if editing
  onNavigate: (view: string, surveyId?: number) => void;
  onShowToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const SurveyBuilderPage: React.FC<SurveyBuilderPageProps> = ({
  surveyId,
  onNavigate,
  onShowToast,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Education');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Fetch templates & survey if editing
  useEffect(() => {
    api.getTemplates().then(setTemplates).catch(() => {});

    if (surveyId) {
      setLoadingInitial(true);
      api.getSurvey(surveyId)
        .then((data) => {
          setTitle(data.survey.title);
          setDescription(data.survey.description || '');
          setCategory(data.survey.category || 'General');
          setQuestions(
            data.questions.map((q) => ({
              ...q,
              options: q.options ? (q.options as any[]).map((o) => (typeof o === 'string' ? o : o.option_text)) : [],
              is_required: Boolean(q.is_required),
            }))
          );
        })
        .catch((err) => {
          onShowToast(err.message || 'Failed to load survey for editing', 'error');
        })
        .finally(() => setLoadingInitial(false));
    } else {
      // Default initial question
      setQuestions([
        {
          question_text: 'Overall, how satisfied are you with our course and assignment material?',
          question_type: 'rating',
          is_required: true,
          display_order: 1,
          help_text: 'Rate from 1 (Poor) to 5 (Outstanding)',
          options: [],
        },
        {
          question_text: 'What was your favorite assignment or topic covered?',
          question_type: 'text',
          is_required: false,
          display_order: 2,
          help_text: 'Share any details or highlights',
          options: [],
        },
      ]);
    }
  }, [surveyId]);

  const handleAddQuestion = (type: QuestionType = 'single_choice') => {
    const newQ: Question = {
      question_text: '',
      question_type: type,
      is_required: true,
      display_order: questions.length + 1,
      help_text: '',
      options: ['multiple_choice', 'single_choice', 'dropdown'].includes(type)
        ? ['Option 1', 'Option 2', 'Option 3']
        : [],
    };
    setQuestions([...questions, newQ]);
  };

  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    const duplicated: Question = {
      ...target,
      question_text: `${target.question_text} (Copy)`,
      options: target.options ? [...target.options] : [],
      display_order: questions.length + 1,
    };
    const updated = [...questions];
    updated.splice(idx + 1, 0, duplicated);
    setQuestions(updated.map((q, i) => ({ ...q, display_order: i + 1 })));
    onShowToast('Question duplicated.', 'info');
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      onShowToast('A survey must have at least one question.', 'error');
      return;
    }
    const next = questions.filter((_, i) => i !== idx);
    setQuestions(next.map((q, i) => ({ ...q, display_order: i + 1 })));
  };

  const handleMoveQuestion = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === questions.length - 1)) {
      return;
    }
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const next = [...questions];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    setQuestions(next.map((q, i) => ({ ...q, display_order: i + 1 })));
  };

  const handleUpdateQuestion = (idx: number, field: keyof Question, value: any) => {
    const next = [...questions];
    next[idx] = { ...next[idx], [field]: value };

    // If changing type to choice and options empty, initialize with defaults
    if (
      field === 'question_type' &&
      ['multiple_choice', 'single_choice', 'dropdown'].includes(value) &&
      (!next[idx].options || next[idx].options?.length === 0)
    ) {
      next[idx].options = ['Option 1', 'Option 2', 'Option 3'];
    }

    setQuestions(next);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, text: string) => {
    const next = [...questions];
    const opts = [...(next[qIdx].options || [])];
    opts[optIdx] = text;
    next[qIdx].options = opts;
    setQuestions(next);
  };

  const handleAddOption = (qIdx: number) => {
    const next = [...questions];
    const opts = [...(next[qIdx].options || [])];
    opts.push(`Option ${opts.length + 1}`);
    next[qIdx].options = opts;
    setQuestions(next);
  };

  const handleDeleteOption = (qIdx: number, optIdx: number) => {
    const next = [...questions];
    const opts = [...(next[qIdx].options || [])];
    if (opts.length <= 2) {
      onShowToast('Choice questions require at least two options.', 'error');
      return;
    }
    opts.splice(optIdx, 1);
    next[qIdx].options = opts;
    setQuestions(next);
  };

  const applyTemplate = (tmpl: SurveyTemplate) => {
    setTitle(tmpl.title);
    setDescription(tmpl.description);
    setCategory(tmpl.category);
    setQuestions(
      tmpl.questions.map((q, i) => ({
        ...q,
        display_order: i + 1,
        options: q.options ? [...q.options] : [],
      }))
    );
    setShowTemplateModal(false);
    onShowToast(`Applied template: "${tmpl.title}"`, 'success');
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      onShowToast('Please enter a survey title.', 'error');
      return;
    }
    if (questions.length === 0) {
      onShowToast('Please add at least one question.', 'error');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        onShowToast(`Question #${i + 1} is missing question text.`, 'error');
        return;
      }
      if (['multiple_choice', 'single_choice', 'dropdown'].includes(q.question_type)) {
        const cleanOpts = (q.options || []).filter((o) => o && o.trim().length > 0);
        if (cleanOpts.length < 2) {
          onShowToast(`Question #${i + 1} must have at least 2 valid options.`, 'error');
          return;
        }
      }
    }

    setSaving(true);
    try {
      if (surveyId) {
        await api.updateSurvey(surveyId, {
          title: title.trim(),
          description: description.trim(),
          category,
          questions,
        });
        onShowToast('Survey updated successfully!', 'success');
        onNavigate('results', surveyId);
      } else {
        const res = await api.createSurvey({
          title: title.trim(),
          description: description.trim(),
          category,
          questions,
        });
        onShowToast('Survey created successfully!', 'success');
        onNavigate('results', res.surveyId);
      }
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save survey', 'error');
    } finally {
      setSaving(false);
    }
  };

  const questionTypeOptions: { type: QuestionType; label: string; icon: any }[] = [
    { type: 'rating', label: 'Rating (1–5 Stars)', icon: Star },
    { type: 'single_choice', label: 'Single Choice (Radio)', icon: CheckCircle2 },
    { type: 'multiple_choice', label: 'Multiple Choice (Checkboxes)', icon: Layers },
    { type: 'yes_no', label: 'Yes / No Toggle', icon: Check },
    { type: 'dropdown', label: 'Dropdown Menu', icon: ChevronDown },
    { type: 'text', label: 'Open-Ended Text', icon: FileText },
  ];

  if (loadingInitial) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold mt-2">Loading survey details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            {surveyId ? 'Edit Survey Questionnaire' : 'Create New Survey'}
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-0.5">
            {title || 'Untitled Survey'}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Templates</span>
          </button>

          {/* Builder vs Preview Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'builder'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{surveyId ? 'Save Changes' : 'Publish Survey'}</span>
          </button>
        </div>
      </div>

      {/* BUILDER TAB */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* Survey Metadata Card */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Survey Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS301 Student Course & Assignment Feedback"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-800"
                >
                  <option value="Education">Education & Courses</option>
                  <option value="Product">Product Feedback</option>
                  <option value="Customer Experience">Customer Experience (CSAT)</option>
                  <option value="Events">Workshops & Events</option>
                  <option value="Employee Pulse">Employee Pulse</option>
                  <option value="General">General Inquiries</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Welcome Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Give respondents clear context about what this survey is for and how long it takes."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Questions Header */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Questions ({questions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Customize question text, toggle types, and reorder.
              </p>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-blue-100 shadow-xs p-5 transition-all hover:border-blue-300 space-y-4 group"
                >
                  {/* Top Bar for Question Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {/* Question Type Selector */}
                      <select
                        value={q.question_type}
                        onChange={(e) => handleUpdateQuestion(idx, 'question_type', e.target.value as QuestionType)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {questionTypeOptions.map((opt) => (
                          <option key={opt.type} value={opt.type}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      {/* Required Toggle */}
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer ml-2">
                        <input
                          type="checkbox"
                          checked={q.is_required}
                          onChange={(e) => handleUpdateQuestion(idx, 'is_required', e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Required</span>
                      </label>
                    </div>

                    {/* Question Card Actions: Up, Down, Duplicate, Delete */}
                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        disabled={idx === questions.length - 1}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateQuestion(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Duplicate Question"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text & Subtitle Input */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Enter question text here... (e.g. How satisfied are you with this semester's homework format?)"
                      value={q.question_text}
                      onChange={(e) => handleUpdateQuestion(idx, 'question_text', e.target.value)}
                      className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                    />

                    <input
                      type="text"
                      placeholder="Optional help text / instructions for respondent (e.g. 1 = Poor, 5 = Outstanding)"
                      value={q.help_text || ''}
                      onChange={(e) => handleUpdateQuestion(idx, 'help_text', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs text-slate-500 rounded-xl border border-slate-150 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                    />
                  </div>

                  {/* Options Manager for choice types */}
                  {['multiple_choice', 'single_choice', 'dropdown'].includes(q.question_type) && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Answer Options
                      </div>
                      <div className="space-y-2">
                        {(q.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="w-4 text-center text-xs text-slate-400 font-mono">
                              {optIdx + 1}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder={`Option ${optIdx + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(idx, optIdx)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                              title="Remove option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddOption(idx)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Option</span>
                      </button>
                    </div>
                  )}

                  {/* Type preview hints */}
                  {q.question_type === 'rating' && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs text-amber-800">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span>Respondents will rate using 1 to 5 clickable interactive stars.</span>
                    </div>
                  )}

                  {q.question_type === 'yes_no' && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-800">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Renders high-visibility "Yes" and "No" segmented toggle cards.</span>
                    </div>
                  )}

                  {q.question_type === 'text' && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Multi-line text area with live character counter (up to 2,000 characters).</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Question Button Panel */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-200/80 text-center space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Add Another Question</h3>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {questionTypeOptions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleAddQuestion(item.type)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 hover:border-blue-600 shadow-2xs transition-all hover:scale-102"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW TAB */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-3xl border border-blue-100 shadow-md p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
              Respondent Preview Mode
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              {title || 'Untitled Survey'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {description || 'No description provided.'}
            </p>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="font-bold text-sm text-slate-900">
                    <span className="text-blue-600 mr-1.5">Q{idx + 1}.</span>
                    {q.question_text || 'Untitled Question'}
                    {q.is_required && <span className="text-rose-500 ml-1">*</span>}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                    {q.question_type.replace('_', ' ')}
                  </span>
                </div>

                {q.help_text && (
                  <p className="text-xs text-slate-500 italic">{q.help_text}</p>
                )}

                {/* Simulated Preview Inputs */}
                {q.question_type === 'rating' && (
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-6 h-6 text-slate-300 hover:text-amber-400 cursor-pointer" />
                    ))}
                    <span className="text-xs text-slate-400 ml-2">Clickable 1-5 stars</span>
                  </div>
                )}

                {q.question_type === 'single_choice' && (
                  <div className="space-y-1.5 pt-1">
                    {(q.options || []).map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 text-xs text-slate-700 p-2 rounded-lg bg-white border border-slate-200">
                        <input type="radio" name={`preview_${idx}`} className="text-blue-600" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.question_type === 'multiple_choice' && (
                  <div className="space-y-1.5 pt-1">
                    {(q.options || []).map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 text-xs text-slate-700 p-2 rounded-lg bg-white border border-slate-200">
                        <input type="checkbox" className="rounded text-blue-600" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.question_type === 'yes_no' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button type="button" className="py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700">
                      Yes
                    </button>
                    <button type="button" className="py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700">
                      No
                    </button>
                  </div>
                )}

                {q.question_type === 'dropdown' && (
                  <select className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white">
                    <option>Select an option...</option>
                    {(q.options || []).map((opt, i) => (
                      <option key={i}>{opt}</option>
                    ))}
                  </select>
                )}

                {q.question_type === 'text' && (
                  <textarea
                    rows={2}
                    readOnly
                    placeholder="Respondent writes feedback here..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              Return to Editor
            </button>
          </div>
        </div>
      )}

      {/* TEMPLATE PICKER MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Pre-Built Survey Templates
                </h3>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Choose a template to quickly initialize questions. You can edit any questions afterward.
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => applyTemplate(tmpl)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {tmpl.category}
                    </span>
                    <span className="text-xs text-slate-400 group-hover:text-blue-600 font-semibold">
                      Use Template →
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-1.5 group-hover:text-blue-600">
                    {tmpl.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{tmpl.description}</p>
                  <div className="text-[11px] text-slate-400 font-medium mt-2">
                    {tmpl.questions.length} questions included
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
