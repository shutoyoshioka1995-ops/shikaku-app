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

export default function TextbookLinkCard({ material }: { material: string }) {
  const youtubeId = extractYouTubeId(material);

  if (youtubeId) {
    return (
      <div>
        <span className="mb-1 block text-xs font-bold text-gray-500">📚 使用した教材・動画</span>
        <div className="mt-1 space-y-2">
          <p className="break-all rounded border bg-white p-2 text-xs text-gray-500">
            🔗{' '}
            <a
              href={material}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {material}
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
      </div>
    );
  }

  const keyword = material.trim();
  const amazonUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
  const rakutenUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`;

  return (
    <div>
      <span className="mb-1 block text-xs font-bold text-gray-500">📚 使用した教材・動画</span>
      <div className="space-y-3 rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
        {isHttpUrl(keyword) ? (
          <p className="break-all text-sm font-medium text-gray-800">
            🔗{' '}
            <a
              href={keyword}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {keyword}
            </a>
          </p>
        ) : (
          <p className="whitespace-pre-wrap text-sm font-medium text-gray-800">{keyword}</p>
        )}

        <div className="space-y-2 border-t border-gray-100 pt-2">
          <p className="text-xs font-bold text-gray-600">📚 この教材を検索・購入する</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
            >
              Amazonで探す
            </a>
            <a
              href={rakutenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
            >
              楽天で探す
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
