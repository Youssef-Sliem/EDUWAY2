import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Geometric School Brand Icon */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-[#0B0F17] border border-[#DC2626]/30 dark:border-[#DC2626]/40 flex items-center justify-center p-1.5 shadow-sm shadow-[#DC2626]/10 shrink-0`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          {/* Stylized Academy Hex Prism / Mortarboard in Red & Light Blue */}
          <path
            d="M 16 4 L 28 10 L 16 16 L 4 10 Z"
            fill="#DC2626"
            fillOpacity="0.95"
          />
          <path
            d="M 4 13 L 16 19 L 28 13"
            stroke="#DCE8FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M 8 16 L 8 22 C 8 25 16 28 16 28 C 16 28 24 25 24 22 L 24 16"
            stroke="#DC2626"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="28" cy="14" r="1.5" fill="#DCE8FD" />
        </svg>
      </div>

      <div className="flex flex-col">
        <span
          className={`font-bold tracking-tight text-[#0B0F17] dark:text-[#F8FAFC] ${textSizes[size]} leading-none transition-colors duration-200`}
        >
          Edu<span className="text-[#DC2626]">way</span>
        </span>
      </div>
    </div>
  );
};
