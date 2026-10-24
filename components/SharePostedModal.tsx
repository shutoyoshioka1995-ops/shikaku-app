'use client';

import { buildShareTweetUrl } from '@/lib/shareExperience';

export default function SharePostedModal({
  open,
  qualificationName,
  durationDays,
  dailyStudyHours,
  pageUrl,
  onClose,
}: {
  open: boolean;
  qualificationName?: string;
  durationDays?: string;
  dailyStudyHours?: string;
  pageUrl: string;
  onClose: () => void;
}) {
  if (!open) return null;

  const shareUrl = buildShareTweetUrl({
    qualificationName,
    durationDays,
    dailyStudyHours,
    pageUrl,
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl space-y-4">
        <div className="space-y-1 text-center">
          <h2 className="text-lg font-extrabold text-navy">ロードマップを投稿しました</h2>
          <p className="text-xs text-gray-500">Xでシェアすると、同じ資格を目指す人の参考になります。</p>
        </div>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-xl bg-navy px-4 py-3 text-sm font-extrabold text-white transition hover:bg-navy-hover"
        >
          X（旧Twitter）で合格体験談をシェアする
        </a>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
