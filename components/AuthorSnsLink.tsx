import { snsLinkLabel } from '@/lib/snsUrl';

export default function AuthorSnsLink({ url }: { url?: string | null }) {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-800 transition hover:bg-sky-100"
    >
      {snsLinkLabel(url)}
    </a>
  );
}
