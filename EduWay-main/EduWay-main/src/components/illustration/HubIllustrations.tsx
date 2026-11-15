import React from 'react';

export const GeneralHubIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-auto ${className}`}
    aria-hidden="true"
  >
    {/* Subtle light blue geometric blueprint grid */}
    <rect
      x="16"
      y="16"
      width="248"
      height="148"
      rx="14"
      className="fill-[#EEF4FE] dark:fill-[#101A2C] stroke-[#DCE8FD] dark:stroke-[#1E2D48]"
      strokeWidth="1.5"
    />
    <path
      d="M40 50 H240 M40 90 H240 M40 130 H240 M90 30 V150 M190 30 V150"
      className="stroke-[#DCE8FD] dark:stroke-[#1E2D48]"
      strokeWidth="1"
      strokeDasharray="4 4"
    />

    {/* Open academic textbook */}
    <path
      d="M68 122 C88 114 114 114 140 124 C166 114 192 114 212 122 V64 C192 56 166 56 140 66 C114 56 88 56 68 64 Z"
      className="fill-white dark:fill-[#131B28] stroke-[#0B0F17] dark:stroke-[#DCE8FD]"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <line
      x1="140"
      y1="66"
      x2="140"
      y2="124"
      className="stroke-[#0B0F17] dark:stroke-[#DCE8FD]"
      strokeWidth="2"
    />

    {/* Textbook page content lines */}
    <path d="M84 78 H122 M84 90 H116 M84 102 H120" className="stroke-[#64748B]" strokeWidth="2" strokeLinecap="round" />
    <path d="M158 78 H196 M158 90 H190 M158 102 H184" className="stroke-[#64748B]" strokeWidth="2" strokeLinecap="round" />

    {/* Floating geometry compass & prism */}
    <circle cx="216" cy="52" r="14" className="fill-[#DCE8FD] dark:fill-[#1E2D48] stroke-[#DC2626]" strokeWidth="1.75" />
    <path d="M216 42 L222 58 L210 58 Z" className="fill-[#DC2626]" />
    <circle cx="66" cy="48" r="10" className="fill-white dark:fill-[#131B28] stroke-[#0B0F17] dark:stroke-[#DCE8FD]" strokeWidth="1.5" />
    <path d="M62 48 H70 M66 44 V52" className="stroke-[#DC2626]" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

export const SpecializedHubIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-auto ${className}`}
    aria-hidden="true"
  >
    {/* Dark technical precision frame */}
    <rect
      x="16"
      y="16"
      width="248"
      height="148"
      rx="14"
      className="fill-[#0B0F17] dark:fill-[#090D14] stroke-[#DC2626]/40"
      strokeWidth="1.5"
    />

    {/* Circuit trace pathways */}
    <path
      d="M36 90 H86 M194 90 H244 M140 30 V54 M140 126 V150"
      stroke="#DC2626"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M52 54 H74 L92 72 M228 54 H206 L188 72 M52 126 H74 L92 108 M228 126 H206 L188 108"
      stroke="#DCE8FD"
      strokeOpacity="0.45"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    {/* Central processor / technical core */}
    <rect
      x="92"
      y="54"
      width="96"
      height="72"
      rx="10"
      fill="#131B28"
      stroke="#DCE8FD"
      strokeWidth="2"
    />
    <rect
      x="110"
      y="70"
      width="60"
      height="40"
      rx="6"
      fill="#DC2626"
      fillOpacity="0.16"
      stroke="#DC2626"
      strokeWidth="1.75"
    />

    {/* Inner geometric wave / code node */}
    <path
      d="M122 90 L132 82 L144 98 L158 84"
      stroke="#DCE8FD"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Terminal nodes */}
    <circle cx="52" cy="54" r="3.5" fill="#DC2626" />
    <circle cx="228" cy="54" r="3.5" fill="#DCE8FD" />
    <circle cx="52" cy="126" r="3.5" fill="#DCE8FD" />
    <circle cx="228" cy="126" r="3.5" fill="#DC2626" />
  </svg>
);
