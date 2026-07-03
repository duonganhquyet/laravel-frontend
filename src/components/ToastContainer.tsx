import React from 'react';
import { useToastStore } from '../store/toast.store';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full sm:w-auto">
      {toasts.map((toast) => {
        let bgColor = 'bg-white border-slate-200';
        let iconColor = 'text-blue-500 bg-blue-50';
        let iconSvg = (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        );

        if (toast.type === 'success') {
          bgColor = 'bg-emerald-50/95 border-emerald-200/60 shadow-emerald-100/30';
          iconColor = 'text-emerald-600 bg-emerald-100/60';
          iconSvg = (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          );
        } else if (toast.type === 'error') {
          bgColor = 'bg-rose-50/95 border-rose-200/60 shadow-rose-100/30';
          iconColor = 'text-rose-600 bg-rose-100/60';
          iconSvg = (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          );
        } else if (toast.type === 'warning') {
          bgColor = 'bg-amber-50/95 border-amber-200/60 shadow-amber-100/30';
          iconColor = 'text-amber-600 bg-amber-100/60';
          iconSvg = (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          );
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border ${bgColor} shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-in-right max-w-sm`}
          >
            <div className={`p-1.5 rounded-xl shrink-0 ${iconColor}`}>
              {iconSvg}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[14px] font-semibold text-slate-800 leading-snug break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};
