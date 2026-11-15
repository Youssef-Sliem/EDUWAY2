import React, { useEffect, useRef, useState } from 'react';

interface ProfileAvatarProps {
  photoUrl?: string;
  username: string;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

function getValidHttpImageUrl(rawUrl?: string): string | null {
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

const DefaultPersonSilhouette: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="w-full h-full text-[#64748B] dark:text-[#94A3B8]"
  >
    <circle cx="12" cy="8.5" r="4.1" />
    <path d="M4 22.5c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5v1.5H4v-1.5z" />
  </svg>
);

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  photoUrl,
  username,
  size = 'lg',
  className = '',
}) => {
  const validUrl = getValidHttpImageUrl(photoUrl);
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

  const sizeClasses: Record<'md' | 'lg' | 'xl', string> = {
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-28 h-28 sm:w-32 sm:h-32',
  };

  const showFallback = !validUrl || status === 'error';

  return (
    <div
      role={!validUrl || status === 'error' ? 'img' : undefined}
      aria-label={!validUrl || status === 'error' ? `${username}'s default profile avatar` : undefined}
      className={`relative rounded-full overflow-hidden shrink-0 border-2 border-[#CBD5E1] dark:border-[#24324A] bg-[#EEF4FE] dark:bg-[#101A2C] flex items-center justify-center select-none ${sizeClasses[size]} ${className}`}
    >
      {validUrl && status === 'loading' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#EEF4FE] dark:bg-[#101A2C] animate-pulse flex items-center justify-center"
        >
          <DefaultPersonSilhouette />
        </div>
      )}

      {validUrl && status !== 'error' && (
        <img
          ref={imgRef}
          src={validUrl}
          alt={`${username}'s profile picture`}
          referrerPolicy="no-referrer"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {showFallback && (
        <div className="w-full h-full flex items-end justify-center bg-[#EEF4FE] dark:bg-[#101A2C]">
          <DefaultPersonSilhouette />
        </div>
      )}
    </div>
  );
};
