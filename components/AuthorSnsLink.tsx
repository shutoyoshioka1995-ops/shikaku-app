import { snsLinkLabel } from '@/lib/snsUrl';

export default function AuthorSnsLink({ url }: { url?: string | null }) {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-full border border-navy/20 bg-navy-soft px-2.5 py-1 text-[11px] font-bold text-navy transition hover:bg-white"
    >
      {snsLinkLabel(url)}
    </a>
  );
}
