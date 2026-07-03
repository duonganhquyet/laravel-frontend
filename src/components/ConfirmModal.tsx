import React from 'react';
import { useConfirmStore } from '../store/confirm.store';

export const ConfirmModal: React.FC = () => {
  const { isOpen, title, message, confirmText, cancelText, confirm, cancel } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 animate-fade-in"
      onClick={cancel}
    >
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon Header */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-4">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Title & Message */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={cancel}
            className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all text-sm font-semibold rounded-2xl"
          >
            {cancelText}
          </button>
          <button
            onClick={confirm}
            className="flex-1 px-4 py-2.5 text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-sm font-semibold rounded-2xl shadow-md shadow-red-500/10"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
