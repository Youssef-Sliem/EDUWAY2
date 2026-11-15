import React, { useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  subMessage?: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  subMessage,
  isOpen,
  onClose,
  duration = 4500,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isOpen, onClose, duration]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-[#131B28] border border-[#E2E8F0] dark:border-[#1F293D] text-[#0B0F17] dark:text-[#F8FAFC] rounded-xl p-3.5 shadow-xl flex items-start gap-3 animate-slideUp transition-colors duration-200"
      role="status"
      aria-live="polite"
    >
      <div className="w-7 h-7 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center shrink-0 text-[#DC2626] mt-0.5">
        <Info className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#0B0F17] dark:text-[#F8FAFC]">{message}</p>
        {subMessage && (
          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-0.5 leading-snug">
            {subMessage}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC] p-1 rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
