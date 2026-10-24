import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgStyles = {
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    error: 'bg-rose-50 text-rose-900 border-rose-200',
    info: 'bg-blue-50 text-blue-900 border-blue-200',
  }[toast.type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[toast.type];

  const iconColors = {
    success: 'text-emerald-600',
    error: 'text-rose-600',
    info: 'text-blue-600',
  }[toast.type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${bgStyles}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors}`} />
      <div className="text-sm font-medium flex-1 leading-snug">{toast.text}</div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
