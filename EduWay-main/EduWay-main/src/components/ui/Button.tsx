import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-semibold text-sm rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0B0F17] disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const variants = {
    primary:
      'w-full py-3 px-5 text-white bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] border border-[#DC2626] shadow-sm shadow-[#DC2626]/20 hover:shadow-md hover:shadow-[#DC2626]/30 focus-visible:ring-[#DC2626]',
    secondary:
      'w-full py-2.5 px-4 text-[#0B0F17] dark:text-[#F8FAFC] bg-white dark:bg-[#131B28] hover:bg-[#F8FAFC] dark:hover:bg-[#1A2536] border border-[#E2E8F0] dark:border-[#1F293D] focus-visible:ring-[#DC2626]',
    ghost:
      'py-2 px-3 text-[#475569] dark:text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#131B28] focus-visible:ring-[#DC2626]',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Creating Account...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
