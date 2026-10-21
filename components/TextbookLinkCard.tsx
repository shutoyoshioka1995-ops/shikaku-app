function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

const buttonClass =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-extrabold shadow-sm transition break-words active:scale-[0.99] sm:w-auto';

export default function TextbookLinkCard({
  material,
  textbook,
  textbookUrl,
}: {
  material?: string;
  textbook?: string;
  textbookUrl?: string;
}) {
  const rawName = (textbook || material || '').trim();
  const affiliateUrl = (textbookUrl || '').trim();
  const youtubeId = extractYouTubeId(rawName);
  const bookTitle = textbook?.trim() || (!youtubeId && !isHttpUrl(rawName) ? rawName : '');

  if (!rawName && !affiliateUrl) return null;

  return (
    <div>
      <span className="mb-1 block text-xs font-bold text-gray-500">📚 使用した教材・動画</span>
      <div className="space-y-3 rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
        {youtubeId ? (
          <div className="space-y-2">
            <p className="break-all text-xs text-gray-500">
              🔗{' '}
              <a
                href={rawName}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {rawName}
              </a>
            </p>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black shadow-sm">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="YouTube video player"
                className="absolute top-0 left-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : bookTitle ? (
          <p className="whitespace-pre-wrap text-sm font-medium text-gray-800">{bookTitle}</p>
        ) : isHttpUrl(rawName) ? (
          <p className="break-all text-sm font-medium text-gray-800">
            🔗{' '}
            <a
              href={rawName}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {rawName}
            </a>
          </p>
        ) : null}

        {affiliateUrl ? (
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonClass} bg-emerald-600 text-white hover:bg-emerald-700`}
          >
            🛒 教材の購入・詳細ページへ
          </a>
        ) : bookTitle ? (
          <a
            href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(bookTitle)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonClass} bg-amber-500 text-white hover:bg-amber-600`}
          >
            🔍 Amazonで「{bookTitle}」を検索する
          </a>
        ) : null}
      </div>
    </div>
  );
}
