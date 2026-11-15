import React from 'react';

interface EducationalIllustrationProps {
  className?: string;
}

export const EducationalIllustration: React.FC<EducationalIllustrationProps> = ({
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
          <linearGradient id="bookCoverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          <linearGradient id="bookSpineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>

          <linearGradient id="bulbGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#DCE8FD" stopOpacity="0.45" />
          </linearGradient>

          <linearGradient id="bulbGlowGrad" x1="50%" y1="50%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#0B0F17" />
          </linearGradient>

          <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="cardGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0B0F17" />
          </linearGradient>

          <linearGradient id="beamGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
          </linearGradient>

          {/* Filters */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Orbiting Ring in Light Blue */}
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

        {/* Ground Soft Pedestal Shadow */}
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

        {/* --- CENTRAL OPEN BOOK --- */}
        <g id="open-book" className="transition-transform duration-500">
          {/* Knowledge Light Beam Rising From Book Pages */}
          <polygon
            points="220,270 320,270 360,150 180,150"
            fill="url(#beamGrad)"
          />

          {/* Book Bottom Cover */}
          <path
            d="M 140 310 C 200 310 250 322 270 332 C 290 322 340 310 400 310 C 405 310 408 314 406 319 L 398 332 C 342 332 292 344 270 354 C 248 344 198 332 142 332 L 134 319 C 132 314 135 310 140 310 Z"
            fill="#0B0F17"
            stroke="#DC2626"
            strokeWidth="2"
          />

          {/* Book Spine Center Pivot */}
          <ellipse cx="270" cy="340" rx="9" ry="14" fill="url(#bookSpineGrad)" />

          {/* Left Book Pages Block */}
          <path
            d="M 142 305 C 190 305 240 318 268 330 L 268 250 C 240 238 190 225 142 225 C 137 225 133 229 133 234 L 133 296 C 133 301 137 305 142 305 Z"
            fill="#F8FAFC"
            stroke="#E2E8F0"
            strokeWidth="1.5"
          />
          {/* Left Page Layering Detail */}
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
          {/* Right Page Layering Detail */}
          <path
            d="M 394 302 C 348 302 300 315 272 327 L 272 254 C 300 242 348 229 394 229 Z"
            fill="#FFFFFF"
          />

          {/* Stylized Code / Diagram Lines on Left Page in Red & Light Blue */}
          <line x1="158" y1="248" x2="242" y2="258" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="158" y1="262" x2="228" y2="272" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="172" y1="276" x2="246" y2="286" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="172" y1="290" x2="218" y2="298" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

          {/* Stylized Circuit & Knowledge Nodes on Right Page */}
          <line x1="292" y1="258" x2="382" y2="248" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="292" y1="272" x2="368" y2="262" stroke="#93C5FD" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="310" y1="286" x2="382" y2="276" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="348" cy="264" r="3.5" fill="#DC2626" />
          <circle cx="320" cy="285" r="3" fill="#93C5FD" />
          <line x1="348" y1="264" x2="320" y2="285" stroke="#DCE8FD" strokeWidth="1" strokeDasharray="2 2" />

          {/* Center Bookmark Ribbon in School Red */}
          <path
            d="M 270 252 L 270 338 L 275 333 L 280 338 L 280 252 Z"
            fill="#DC2626"
          />
        </g>

        {/* --- FLOATING GRADUATION CAP --- */}
        <g id="graduation-cap" className="animate-float-slow">
          {/* Shadow below cap */}
          <ellipse cx="225" cy="195" rx="36" ry="9" fill="#0B0F17" fillOpacity="0.3" />

          {/* Under cap skullcap / base */}
          <path
            d="M 205 158 Q 225 174 245 158 L 243 172 Q 225 186 207 172 Z"
            fill="#0B0F17"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Diamond Rhombus Board */}
          <polygon
            points="225,124 278,144 225,164 172,144"
            fill="url(#capGrad)"
            stroke="#DC2626"
            strokeWidth="2"
          />
          {/* Inner Accent Facet */}
          <polygon
            points="225,129 270,144 225,159 180,144"
            fill="#1E293B"
            fillOpacity="0.8"
          />

          {/* Center Button in Red */}
          <circle cx="225" cy="144" r="4" fill="#DC2626" />

          {/* Cap Tassel in Subtle Light Blue */}
          <path
            d="M 225 144 Q 248 148 252 168 Q 254 182 250 196"
            fill="none"
            stroke="#DCE8FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Tassel End Fringe */}
          <polygon
            points="248,194 254,194 256,204 246,204"
            fill="#DCE8FD"
          />
        </g>

        {/* --- GLOWING IDEA LIGHT BULB --- */}
        <g id="light-bulb" className="animate-float-reverse">
          {/* Ambient Glow Aura */}
          <circle cx="370" cy="130" r="44" fill="url(#bulbGlowGrad)" />

          {/* Radial Light Rays */}
          <line x1="370" y1="74" x2="370" y2="64" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="412" y1="92" x2="420" y2="84" stroke="#DCE8FD" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="428" y1="130" x2="438" y2="130" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="328" y1="92" x2="320" y2="84" stroke="#DCE8FD" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="312" y1="130" x2="302" y2="130" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />

          {/* Glass Bulb Body in Red & Light Blue */}
          <path
            d="M 352 152 C 344 144 340 134 340 122 C 340 105 353 92 370 92 C 387 92 400 105 400 122 C 400 134 396 144 388 152 L 388 158 C 388 160 386 162 384 162 L 356 162 C 354 162 352 160 352 158 Z"
            fill="url(#bulbGlassGrad)"
            stroke="#DC2626"
            strokeWidth="2"
          />

          {/* Metallic Screw Base */}
          <rect x="356" y="163" width="28" height="4" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <rect x="358" y="168" width="24" height="4" rx="2" fill="#0F172A" stroke="#475569" strokeWidth="1" />
          <path d="M 364 173 Q 370 178 376 173" fill="none" stroke="#DCE8FD" strokeWidth="2" strokeLinecap="round" />

          {/* Glowing Filament Loop */}
          <path
            d="M 362 144 L 362 126 Q 370 114 378 126 L 378 144"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="370" cy="120" r="3.5" fill="#DC2626" filter="url(#softGlow)" />
        </g>

        {/* --- FLOATING EDUCATIONAL CARD 1: CODE & TECH --- */}
        <g id="card-code" className="animate-float-slow">
          <g transform="translate(60, 150) rotate(-6)">
            {/* Card Shadow */}
            <rect x="3" y="5" width="86" height="66" rx="10" fill="#0B0F17" fillOpacity="0.3" />
            {/* Card Body */}
            <rect
              x="0"
              y="0"
              width="86"
              height="66"
              rx="10"
              fill="url(#cardGrad1)"
              stroke="#DC2626"
              strokeWidth="1.5"
            />
            {/* Window Dots */}
            <circle cx="12" cy="12" r="2.5" fill="#DC2626" />
            <circle cx="20" cy="12" r="2.5" fill="#DCE8FD" />
            <circle cx="28" cy="12" r="2.5" fill="#64748B" />
            {/* Code Symbol: < / > */}
            <path
              d="M 28 32 L 20 40 L 28 48"
              fill="none"
              stroke="#DCE8FD"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 46 29 L 38 51"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 56 32 L 64 40 L 56 48"
              fill="none"
              stroke="#DCE8FD"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* --- FLOATING EDUCATIONAL CARD 2: MATH & ALGORITHMS --- */}
        <g id="card-math" className="animate-float-reverse">
          <g transform="translate(400, 240) rotate(8)">
            {/* Card Shadow */}
            <rect x="3" y="5" width="88" height="68" rx="10" fill="#0B0F17" fillOpacity="0.3" />
            {/* Card Body */}
            <rect
              x="0"
              y="0"
              width="88"
              height="68"
              rx="10"
              fill="url(#cardGrad2)"
              stroke="#DCE8FD"
              strokeWidth="1.5"
            />
            {/* Card Header Bar */}
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
            {/* Mini Trend Line */}
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

        {/* --- FLOATING EDUCATIONAL CARD 3: LOGIC & SCIENCE --- */}
        <g id="card-science" className="animate-float-slow">
          <g transform="translate(75, 275) rotate(4)">
            {/* Card Shadow */}
            <rect x="3" y="4" width="76" height="58" rx="10" fill="#0B0F17" fillOpacity="0.25" />
            {/* Card Body */}
            <rect
              x="0"
              y="0"
              width="76"
              height="58"
              rx="10"
              fill="url(#cardGrad1)"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Atomic Orbital Rings */}
            <ellipse cx="38" cy="29" rx="22" ry="8" fill="none" stroke="#DC2626" strokeWidth="1.5" />
            <ellipse cx="38" cy="29" rx="22" ry="8" transform="rotate(60 38 29)" fill="none" stroke="#DCE8FD" strokeWidth="1.5" />
            <circle cx="38" cy="29" r="4" fill="#FFFFFF" />
            <circle cx="56" cy="26" r="2" fill="#DC2626" />
          </g>
        </g>

        {/* --- GEOMETRIC ACCENTS & ABSTRACT LEARNING SYMBOLS --- */}
        {/* Isometric Cube 1 */}
        <g transform="translate(130, 80) scale(0.85)" className="animate-pulse-subtle">
          <polygon points="20,5 35,14 20,23 5,14" fill="#DC2626" />
          <polygon points="5,14 20,23 20,38 5,29" fill="#B91C1C" />
          <polygon points="35,14 20,23 20,38 35,29" fill="#7F1D1D" />
        </g>

        {/* Isometric Cube 2 */}
        <g transform="translate(450, 150) scale(0.7)" className="animate-pulse-subtle">
          <polygon points="20,5 35,14 20,23 5,14" fill="#DCE8FD" />
          <polygon points="5,14 20,23 20,38 5,29" fill="#BFDBFE" />
          <polygon points="35,14 20,23 20,38 35,29" fill="#93C5FD" />
        </g>

        {/* Geometric Plus / Spark Crosses */}
        <g stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
          <line x1="285" y1="80" x2="285" y2="92" />
          <line x1="279" y1="86" x2="291" y2="86" />
        </g>
        <g stroke="#DCE8FD" strokeWidth="2" strokeLinecap="round">
          <line x1="450" y1="330" x2="450" y2="340" />
          <line x1="445" y1="335" x2="455" y2="335" />
        </g>
        <g stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8">
          <line x1="90" y1="110" x2="90" y2="118" />
          <line x1="86" y1="114" x2="94" y2="114" />
        </g>

        {/* Floating Geometric Dots / Particles in Red & Subtle Light Blue */}
        <circle cx="170" cy="100" r="3" fill="#DC2626" fillOpacity="0.8" />
        <circle cx="340" cy="70" r="2.5" fill="#DCE8FD" fillOpacity="0.9" />
        <circle cx="480" cy="210" r="3" fill="#DC2626" fillOpacity="0.7" />
        <circle cx="160" cy="360" r="2.5" fill="#DCE8FD" fillOpacity="0.7" />
        <circle cx="320" cy="370" r="3" fill="#DC2626" fillOpacity="0.6" />
      </svg>
    </div>
  );
};
