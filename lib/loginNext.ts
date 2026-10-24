export function getSafeNextPath(raw: string | null | undefined) {
  if (!raw) return '/';
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return '/';
  }
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('://')) return '/';
  return value;
}

export function loginUrl(next?: string) {
  const path = getSafeNextPath(next);
  if (path === '/') return '/login';
  return `/login?next=${encodeURIComponent(path)}`;
}
