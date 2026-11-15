import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  id,
  label,
  error,
  icon,
  isPassword = false,
  type = 'text',
  hint,
  required,
  value,
  onChange,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold tracking-wide uppercase text-[#475569] dark:text-[#94A3B8]"
        >
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </label>
        {hint && !error && (
          <span id={hintId} className="text-[11px] text-[#64748B] dark:text-[#64748B]">
            {hint}
          </span>
        )}
      </div>

      <div className="relative group">
        {icon && (
          <div
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
              error
                ? 'text-[#DC2626]'
                : 'text-[#64748B] dark:text-[#64748B] group-focus-within:text-[#DC2626]'
            }`}
          >
            {icon}
          </div>
        )}

        <input
          id={inputId}
          type={inputType}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          required={required}
          className={`w-full bg-white dark:bg-[#0B1019] text-[#0B0F17] dark:text-[#F8FAFC] placeholder-[#94A3B8] dark:placeholder-[#475569] text-sm rounded-lg border transition-all duration-200 outline-none ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${isPassword ? 'pr-11' : 'pr-3.5'} py-2.5 ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
              : 'border-[#E2E8F0] dark:border-[#1F293D] hover:border-[#CBD5E1] dark:hover:border-[#2D3D58] focus:border-[#DC2626] dark:focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
          } ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? `Hide ${label}` : `Show ${label}`}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0B0F17] dark:hover:text-[#F8FAFC] focus:text-[#DC2626] focus:outline-none p-1 rounded transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {error && (
        <div
          id={errorId}
          className="flex items-center gap-1.5 text-xs text-[#DC2626] pt-0.5 animate-fadeIn font-medium"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
