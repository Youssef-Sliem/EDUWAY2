import React from 'react';

interface SignInIllustrationProps {
  className?: string;
}

export const SignInIllustration: React.FC<SignInIllustrationProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`relative w-full max-w-[480px] aspect-[4/3] flex items-center justify-center select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#DC2626]/12 via-[#DCE8FD]/20 to-transparent rounded-3xl blur-3xl" />

      {/* Main SVG Vector Composition */}
      <svg
        viewBox="0 0 540 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-lg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="siBookCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          <linearGradient id="siBookSpineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>

          <linearGradient id="siBulbGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#DCE8FD" stopOpacity="0.45" />
          </linearGradient>

          <linearGradient id="siBulbGlowGrad" x1="50%" y1="50%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="siCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#0B0F17" />
          </linearGradient>

          <linearGradient id="siCardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="siBeamGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
          </linearGradient>

          {/* Soft Glow Filter */}
          <filter id="siSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Orbiting Ring */}
        <ellipse
          cx="270"
          cy="230"
          rx="210"
          ry="90"
          stroke="#DCE8FD"
          strokeWidth="1.5"
          strokeDasharray="6 8"
          strokeOpacity="0.75"
          className="animate-orbit-slow origin-center"
        />

        {/* Ground Pedestal Shadow */}
        <ellipse
          cx="270"
          cy="345"
          rx="170"
          ry="28"
          fill="#0B0F17"
          fillOpacity="0.2"
        />
        <ellipse
          cx="270"
          cy="345"
          rx="120"
          ry="18"
          fill="#0B0F17"
          fillOpacity="0.1"
        />

        {/* --- CENTRAL OPEN PORTAL BOOK --- */}
        <g id="si-open-book" className="transition-transform duration-500">
          {/* Welcome Light Beam */}
          <polygon
            points="220,270 320,270 360,150 180,150"
            fill="url(#siBeamGrad)"
          />

          {/* Book Bottom Cover */}
          <path
            d="M 140 310 C 200 310 250 322 270 332 C 290 322 340 310 400 310 C 405 310 408 314 406 319 L 398 332 C 342 332 292 344 270 354 C 248 344 198 332 142 332 L 134 319 C 132 314 135 310 140 310 Z"
            fill="#0B0F17"
            stroke="#DC2626"
            strokeWidth="2"
          />

          {/* Book Spine Center */}
          <ellipse cx="270" cy="340" rx="9" ry="14" fill="url(#siBookSpineGrad)" />

          {/* Left Book Pages Block */}
          <path
            d="M 142 305 C 190 305 240 318 268 330 L 268 250 C 240 238 190 225 142 225 C 137 225 133 229 133 234 L 133 296 C 133 301 137 305 142 305 Z"
            fill="#F8FAFC"
            stroke="#E2E8F0"
            strokeWidth="1.5"
          />
          <path
            d="M 146 302 C 192 302 240 315 268 327 L 268 254 C 240 242 192 229 146 229 Z"
            fill="#FFFFFF"
          />

          {/* Right Book Pages Block */}
          <path
            d="M 398 305 C 350 305 300 318 272 330 L 272 250 C 300 238 350 225 398 225 C 403 225 407 229 407 234 L 407 296 C 407 301 403 305 398 305 Z"
            fill="#F8FAFC"
            stroke="#E2E8F0"
            strokeWidth="1.5"
          />
          <path
            d="M 394 302 C 348 302 300 315 272 327 L 272 254 C 300 242 348 229 394 229 Z"
            fill="#FFFFFF"
          />

          {/* Left Page: Security & Knowledge Key Silhouette */}
          <path
            d="M 180 255 C 180 248 186 242 194 242 C 202 242 208 248 208 255 C 208 259 206 263 203 266 L 203 286 L 199 286 L 199 280 L 194 280 L 194 286 L 189 286 L 189 266 C 184 263 180 259 180 255 Z"
            fill="#DC2626"
            stroke="#991B1B"
            strokeWidth="1"
          />
          <circle cx="194" cy="254" r="3.5" fill="#FFFFFF" />

          {/* Left Page Code Lines */}
          <line x1="216" y1="248" x2="246" y2="252" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="216" y1="262" x2="242" y2="266" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="160" y1="295" x2="246" y2="299" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />

          {/* Right Page: Technology Nodes & Return Pathway */}
          <line x1="292" y1="258" x2="382" y2="248" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="292" y1="272" x2="368" y2="262" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="310" y1="286" x2="382" y2="276" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="348" cy="264" r="3.5" fill="#DC2626" />
          <circle cx="320" cy="285" r="3" fill="#93C5FD" />
          <line x1="348" y1="264" x2="320" y2="285" stroke="#DCE8FD" strokeWidth="1" strokeDasharray="2 2" />

          {/* Center Bookmark Ribbon */}
          <path
            d="M 270 252 L 270 338 L 275 333 L 280 338 L 280 252 Z"
            fill="#DC2626"
          />
        </g>

        {/* --- FLOATING GRADUATION CAP --- */}
        <g id="si-graduation-cap" className="animate-float-slow">
          <ellipse cx="225" cy="195" rx="36" ry="9" fill="#0B0F17" fillOpacity="0.3" />

          <path
            d="M 205 158 Q 225 174 245 158 L 243 172 Q 225 186 207 172 Z"
            fill="#0B0F17"
            stroke="#334155"
            strokeWidth="1.5"
          />

          <polygon
            points="225,124 278,144 225,164 172,144"
            fill="url(#siCapGrad)"
            stroke="#DC2626"
            strokeWidth="2"
          />
          <polygon
            points="225,129 270,144 225,159 180,144"
            fill="#1E293B"
            fillOpacity="0.8"
          />

          <circle cx="225" cy="144" r="4" fill="#DC2626" />

          <path
            d="M 225 144 Q 248 148 252 168 Q 254 182 250 196"
            fill="none"
            stroke="#DCE8FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <polygon
            points="248,194 254,194 256,204 246,204"
            fill="#DCE8FD"
          />
        </g>

        {/* --- GLOWING IDEA LIGHT BULB --- */}
        <g id="si-light-bulb" className="animate-float-reverse">
          <circle cx="370" cy="130" r="44" fill="url(#siBulbGlowGrad)" />

          <line x1="370" y1="74" x2="370" y2="64" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="412" y1="92" x2="420" y2="84" stroke="#DCE8FD" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="428" y1="130" x2="438" y2="130" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="328" y1="92" x2="320" y2="84" stroke="#DCE8FD" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="312" y1="130" x2="302" y2="130" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />

          <path
            d="M 352 152 C 344 144 340 134 340 122 C 340 105 353 92 370 92 C 387 92 400 105 400 122 C 400 134 396 144 388 152 L 388 158 C 388 160 386 162 384 162 L 356 162 C 354 162 352 160 352 158 Z"
            fill="url(#siBulbGlassGrad)"
            stroke="#DC2626"
            strokeWidth="2"
          />

          <rect x="356" y="163" width="28" height="4" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <rect x="358" y="168" width="24" height="4" rx="2" fill="#0F172A" stroke="#475569" strokeWidth="1" />
          <path d="M 364 173 Q 370 178 376 173" fill="none" stroke="#DCE8FD" strokeWidth="2" strokeLinecap="round" />

          <path
            d="M 362 144 L 362 126 Q 370 114 378 126 L 378 144"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="370" cy="120" r="3.5" fill="#DC2626" filter="url(#siSoftGlow)" />
        </g>

        {/* --- FLOATING EDUCATIONAL CARD 1: ID & ACCESS --- */}
        <g id="si-card-access" className="animate-float-slow">
          <g transform="translate(60, 150) rotate(-6)">
            <rect x="3" y="5" width="86" height="66" rx="10" fill="#0B0F17" fillOpacity="0.3" />
            <rect
              x="0"
              y="0"
              width="86"
              height="66"
              rx="10"
              fill="url(#siCardGrad1)"
              stroke="#DC2626"
              strokeWidth="1.5"
            />
            {/* Window Dots */}
            <circle cx="12" cy="12" r="2.5" fill="#DC2626" />
            <circle cx="20" cy="12" r="2.5" fill="#DCE8FD" />
            <circle cx="28" cy="12" r="2.5" fill="#64748B" />
            {/* Lock outline symbol */}
            <rect x="34" y="32" width="20" height="16" rx="3" fill="#DC2626" fillOpacity="0.9" />
            <path
              d="M 39 32 L 39 26 C 39 23 49 23 49 26 L 49 32"
              fill="none"
              stroke="#DCE8FD"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="44" cy="40" r="2" fill="#FFFFFF" />
          </g>
        </g>

        {/* --- FLOATING EDUCATIONAL CARD 2: ALGORITHMS --- */}
        <g id="si-card-algo" className="animate-float-reverse">
          <g transform="translate(400, 240) rotate(8)">
            <rect x="3" y="5" width="88" height="68" rx="10" fill="#0B0F17" fillOpacity="0.3" />
            <rect
              x="0"
              y="0"
              width="88"
              height="68"
              rx="10"
              fill="url(#siCardGrad1)"
              stroke="#DCE8FD"
              strokeWidth="1.5"
            />
            <line x1="12" y1="14" x2="76" y2="14" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
            {/* Sigma Symbol ∑ */}
            <path
              d="M 38 27 L 22 27 L 30 38 L 22 49 L 38 49"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 48 45 L 56 38 L 64 42 L 74 30"
              fill="none"
              stroke="#DCE8FD"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="74" cy="30" r="2.5" fill="#DC2626" />
          </g>
        </g>

        {/* Floating Geometric Particles */}
        <circle cx="170" cy="100" r="3" fill="#DC2626" fillOpacity="0.8" />
        <circle cx="340" cy="70" r="2.5" fill="#DCE8FD" fillOpacity="0.9" />
        <circle cx="480" cy="210" r="3" fill="#DC2626" fillOpacity="0.7" />
        <circle cx="160" cy="360" r="2.5" fill="#DCE8FD" fillOpacity="0.7" />
        <circle cx="320" cy="370" r="3" fill="#DC2626" fillOpacity="0.6" />
      </svg>
    </div>
  );
};
