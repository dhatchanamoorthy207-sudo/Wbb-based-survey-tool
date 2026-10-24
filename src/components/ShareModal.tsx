import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, QrCode, Share2 } from 'lucide-react';
import { Survey } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  survey: Survey | null;
  onClose: () => void;
  onTakeSurvey: (id: number) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, survey, onClose, onTakeSurvey }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !survey) return null;

  // Compute public share URL
  const publicUrl = `${window.location.origin}/?view=survey&id=${survey.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-b from-blue-50/70 to-white border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Share2 className="w-4 h-4" />
              <span>Share Questionnaire</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-2 truncate">
            {survey.title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Send this public link to students, customers, or team members to collect feedback.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Share URL input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Public Respondent Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-700 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all shadow-xs ${
                  copied
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onTakeSurvey(survey.id);
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Fill Survey Now</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: survey.title,
                    text: survey.description,
                    url: publicUrl,
                  }).catch(() => {});
                } else {
                  handleCopy();
                }
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>System Share</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
            <QrCode className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Anyone with this link can answer questions. Submissions are securely validated against the database schema with parameterized queries.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
