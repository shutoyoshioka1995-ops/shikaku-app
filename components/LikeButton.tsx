'use client';

type LikeButtonProps = {
  count: number;
  liked: boolean;
  loading?: boolean;
  onLike: () => void;
  variant?: 'compact' | 'header' | 'cta';
};

export default function LikeButton({
  count,
  liked,
  loading = false,
  onLike,
  variant = 'compact',
}: LikeButtonProps) {
  if (variant === 'cta') {
    return (
      <button
        type="button"
        onClick={onLike}
        disabled={liked || loading}
        className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold transition ${
          liked
            ? 'cursor-default bg-navy-soft text-navy'
            : 'bg-navy text-white hover:bg-navy-hover'
        }`}
      >
        <span>{liked ? '参考になった（送信済み）' : '参考になった'}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${liked ? 'bg-white' : 'bg-white/20'}`}>
          {count}
        </span>
      </button>
    );
  }

  if (variant === 'header') {
    return (
      <button
        type="button"
        onClick={onLike}
        disabled={liked || loading}
        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
          liked
            ? 'cursor-default border-navy bg-navy-soft text-navy'
            : 'border-gray-300 bg-white text-gray-700 hover:border-navy hover:text-navy'
        }`}
      >
        <span>{liked ? '参考になった' : '参考になった'}</span>
        <span className="ml-0.5 rounded-full bg-white px-1.5 py-0.5 text-[11px] text-navy">
          {count}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onLike();
      }}
      disabled={liked || loading}
      className={`rounded-full border px-2 py-0.5 text-xs font-bold transition ${
        liked
          ? 'cursor-default border-navy bg-navy text-white'
          : 'border-navy/30 bg-white text-navy hover:bg-navy-soft'
      }`}
      aria-label="参考になった"
    >
      {count}
    </button>
  );
}
