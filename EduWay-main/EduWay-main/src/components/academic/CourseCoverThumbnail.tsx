import React, { useEffect, useId, useRef, useState } from 'react';
import { BookOpen, Cpu, Image as ImageIcon } from 'lucide-react';
import { HubType } from '../../types/academic';

interface CourseCoverThumbnailProps {
  coverImageUrl?: string;
  title: string;
  hub?: HubType;
  subtitle?: string;
}

function isRenderableHttpUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export const CourseCoverThumbnail: React.FC<CourseCoverThumbnailProps> = ({
  coverImageUrl,
  title,
  hub = 'general',
  subtitle,
}) => {
  const validUrl = isRenderableHttpUrl(coverImageUrl);
  const patternId = useId();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<'empty' | 'loading' | 'loaded' | 'error'>(
    validUrl ? 'loading' : 'empty'
  );

  useEffect(() => {
    if (!validUrl) {
      setStatus('empty');
      return;
    }

    setStatus('loading');

    const img = imgRef.current;
    if (img && img.complete) {
      setStatus(img.naturalWidth > 0 ? 'loaded' : 'error');
    }
  }, [validUrl]);

  const showFallback = !validUrl || status === 'error';

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-[#F1F5F9] dark:bg-[#0B1019] border-b border-[#E2E8F0] dark:border-[#1F293D]">
      {/* Loading Shimmer State */}
      {validUrl && status === 'loading' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-[#F1F5F9] dark:bg-[#0B1019] animate-pulse"
        >
          <ImageIcon className="w-7 h-7 text-[#94A3B8] dark:text-[#475569]" />
        </div>
      )}

      {/* Actual External Course Cover Image */}
      {validUrl && status !== 'error' && (
        <img
          ref={imgRef}
          src={validUrl}
          alt={title}
          referrerPolicy="no-referrer"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Fallback Placeholder (missing URL or failed image load) */}
      {showFallback && (
        <div
          className={`w-full h-full relative flex flex-col items-center justify-center px-5 text-center select-none ${
            hub === 'specialized'
              ? 'bg-[#0B0F17] text-[#F8FAFC]'
              : 'bg-[#EEF4FE] dark:bg-[#101A2C] text-[#0B0F17] dark:text-[#F8FAFC]'
          }`}
        >
          {/* Subtle Architectural Grid Pattern */}
          <svg
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full ${
              hub === 'specialized'
                ? 'text-[#DC2626]/15'
                : 'text-[#0B0F17]/[0.06] dark:text-[#DCE8FD]/10'
            }`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id={patternId}
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
          </svg>

          <div className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                hub === 'specialized'
                  ? 'bg-[#DC2626]/15 border-[#DC2626]/35 text-[#DC2626]'
                  : 'bg-white/85 dark:bg-[#131B28] border-[#DCE8FD] dark:border-[#1E2D48] text-[#DC2626]'
              }`}
            >
              {hub === 'specialized' ? (
                <Cpu className="w-5 h-5" aria-hidden="true" />
              ) : (
                <BookOpen className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                hub === 'specialized'
                  ? 'text-[#94A3B8]'
                  : 'text-[#475569] dark:text-[#94A3B8]'
              }`}
            >
              {subtitle || (hub === 'specialized' ? 'Specialized Hub · Computer Science' : 'General Hub')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
