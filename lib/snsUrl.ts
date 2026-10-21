export function normalizeSnsUrl(value?: string) {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('@')) return `https://x.com/${trimmed.slice(1)}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(x\.com|twitter\.com|www\.)/i.test(trimmed)) return `https://${trimmed}`;
  return `https://${trimmed}`;
}

export function pickSnsUrl(record: {
  sns_url?: string | null;
  twitter_url?: string | null;
  blog_url?: string | null;
}) {
  return normalizeSnsUrl(record.sns_url || record.twitter_url || record.blog_url || '');
}

export function snsLinkLabel(url: string) {
  if (/x\.com|twitter\.com/i.test(url)) return '🔗 X (Twitter)';
  return '🔗 ブログ';
}
