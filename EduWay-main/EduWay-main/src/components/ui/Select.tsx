import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { SelectOption } from '../../types/auth';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export const Select: React.FC<SelectProps> = ({
  id,
  label,
  options,
  placeholder = 'Select an option',
  error,
  icon,
  hint,
  required,
  value,
  onChange,
  className = '',
  ...props
}) => {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={selectId}
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

        <select
          id={selectId}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          required={required}
          className={`w-full appearance-none bg-white dark:bg-[#0B1019] text-[#0B0F17] dark:text-[#F8FAFC] text-sm rounded-lg border transition-all duration-200 outline-none cursor-pointer ${
            icon ? 'pl-10' : 'pl-3.5'
          } pr-10 py-2.5 ${
            !value ? 'text-[#94A3B8] dark:text-[#475569]' : 'text-[#0B0F17] dark:text-[#F8FAFC]'
          } ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
              : 'border-[#E2E8F0] dark:border-[#1F293D] hover:border-[#CBD5E1] dark:hover:border-[#2D3D58] focus:border-[#DC2626] dark:focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20'
          } ${className}`}
          {...props}
        >
          <option value="" disabled className="bg-white dark:bg-[#0B1019] text-[#94A3B8] dark:text-[#475569]">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-white dark:bg-[#131B28] text-[#0B0F17] dark:text-[#F8FAFC] py-1"
            >
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B] dark:text-[#64748B] group-focus-within:text-[#DC2626] transition-colors">
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>

      {error && (
        <div
          id={errorId}
          className="flex items-center gap-1.5 text-xs text-[#DC2626] pt-0.5 font-medium"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
