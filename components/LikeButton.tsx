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
        className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold shadow-md transition ${
          liked
            ? 'cursor-default bg-pink-100 text-pink-700'
            : 'bg-pink-500 text-white hover:bg-pink-600 active:scale-95'
        }`}
      >
        <span>{liked ? '❤️' : '👍'}</span>
        <span>{liked ? '「参考になった！」を送信しました' : '参考になった！'}</span>
        <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs">{count}</span>
      </button>
    );
  }

  if (variant === 'header') {
    return (
      <button
        type="button"
        onClick={onLike}
        disabled={liked || loading}
        className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-sm transition ${
          liked
            ? 'cursor-default border-pink-300 bg-pink-50 text-pink-600'
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:scale-95'
        }`}
      >
        <span>{liked ? '❤️' : '👍'}</span>
        <span>{liked ? '参考になった！' : '参考になった'}</span>
        <span className="ml-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-800">
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
          ? 'cursor-default border-pink-300 bg-pink-50 text-pink-700'
          : 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100'
      }`}
      aria-label="参考になった"
    >
      {liked ? '❤️' : '👍'} {count}
    </button>
  );
}
