"use client";

import React from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { useToastStore, ToastType } from '@/stores/useToastStore';

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success': return <CheckCircle size={18} className="text-[#8DA399]" />;
    case 'error': return <AlertCircle size={18} className="text-[#A62121]" />;
    case 'warning': return <AlertTriangle size={18} className="text-[#B37D56]" />;
    default: return <Info size={18} className="text-[#2F2F2F]/60" />;
  }
};

export const ToastContainer: React.FC = () => {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto min-w-[300px] bg-white border border-[#B37D56]/20 shadow-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-4 fade-in duration-300 rounded-none"
        >
          <div className="flex items-center gap-3">
            <ToastIcon type={toast.type} />
            <p className="text-sm font-bold text-[#2F2F2F] chinese-font tracking-wider">
              {toast.message}
            </p>
          </div>
          <button 
            onClick={() => remove(toast.id)}
            className="text-[#2F2F2F]/20 hover:text-[#2F2F2F] transition-colors ml-4"
          >
            <X size={14} />
          </button>
          <div className={`absolute bottom-0 left-0 h-[2px] bg-current opacity-20 animate-[shrink_3s_linear_forwards] ${
            toast.type === 'success' ? 'text-[#8DA399]' : toast.type === 'error' ? 'text-[#A62121]' : 'text-[#B37D56]'
          }`} style={{ width: '100%' }} />
        </div>
      ))}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
