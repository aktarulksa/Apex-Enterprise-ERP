import React from 'react';
import { useERP } from '../../context/ERPContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useERP();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-in slide-in-from-bottom-3 duration-200">
      <div 
        className={`flex items-start gap-3 p-3.5 rounded-lg border shadow-lg ${
          isSuccess 
            ? 'bg-slate-900 border-slate-800 text-white' 
            : isError 
            ? 'bg-red-950 border-red-800 text-red-50' 
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
        {isError && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}

        <div className="flex-1 text-xs leading-relaxed font-medium">
          {toast.message}
        </div>

        <button 
          onClick={hideToast}
          className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
          aria-label="Dismiss toast notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
