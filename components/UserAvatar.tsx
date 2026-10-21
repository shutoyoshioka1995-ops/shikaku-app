'use client';

import { useMemo, useState } from 'react';

type UserAvatarProps = {
  avatarUrl?: string | null;
  seed?: string | null;
  alt?: string;
  size?: number;
  className?: string;
};

function dicebearUrl(seed?: string | null) {
  const safeSeed = encodeURIComponent((seed || 'anonymous').trim() || 'anonymous');
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${safeSeed}`;
}

export default function UserAvatar({
  avatarUrl,
  seed,
  alt = 'ユーザーアバター',
  size = 40,
  className = '',
}: UserAvatarProps) {
  const fallbackSrc = useMemo(() => dicebearUrl(seed), [seed]);
  const providedSrc = avatarUrl?.trim() || '';
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);

  const src = providedSrc && brokenUrl !== providedSrc ? providedSrc : fallbackSrc;

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`inline-block shrink-0 rounded-full bg-gray-100 object-cover ring-1 ring-gray-200 ${className}`}
      style={{ width: size, height: size }}
      onError={() => {
        if (providedSrc) setBrokenUrl(providedSrc);
      }}
    />
  );
}
