export type QualificationLike = {
  id: string;
  name: string;
};

export type MergedQualification<T extends QualificationLike = QualificationLike> = T & {
  aliasIds: string[];
  aliasNames: string[];
};

const PREFERRED_DISPLAY_NAMES: Record<string, string> = {
  itパスポート: 'ITパスポート',
  基本情報技術者: '基本情報技術者',
  応用情報技術者: '応用情報技術者',
  宅地建物取引士: '宅地建物取引士',
  日商簿記1級: '日商簿記1級',
  日商簿記2級: '日商簿記2級',
  日商簿記3級: '日商簿記3級',
};

const KEY_ALIASES: Record<string, string> = {
  iパス: 'itパスポート',
  ipass: 'itパスポート',
  ip: 'itパスポート',
  宅建: '宅地建物取引士',
  宅建士: '宅地建物取引士',
  簿記1級: '日商簿記1級',
  簿記2級: '日商簿記2級',
  簿記3級: '日商簿記3級',
  日商簿記検定1級: '日商簿記1級',
  日商簿記検定2級: '日商簿記2級',
  日商簿記検定3級: '日商簿記3級',
};

function stripKeepLevelParentheticals(name: string) {
  return name.replace(/[（(]([^）)]*)[）)]/g, (_, inner: string) => {
    if (/(級|点|レベル|種|類|級)/.test(inner)) return `（${inner}）`;
    return '';
  });
}

export function qualificationKey(name: string) {
  let value = (name || '').normalize('NFKC').trim();
  value = stripKeepLevelParentheticals(value);
  value = value.replace(/試験/g, '').replace(/検定/g, '');
  value = value.replace(/[\s　・./／_-]/g, '').toLowerCase();
  return KEY_ALIASES[value] || value;
}

function scoreDisplayName(name: string) {
  let score = name.length;
  if (/試験$/.test(name)) score += 8;
  if (/検定/.test(name)) score += 6;
  if (/[（(]/.test(name)) score += 4;
  return score;
}

function pickDisplayName(names: string[], key: string) {
  const preferred = PREFERRED_DISPLAY_NAMES[key];
  if (preferred && names.some((name) => qualificationKey(name) === key)) {
    return preferred;
  }

  return [...names].sort((a, b) => scoreDisplayName(a) - scoreDisplayName(b) || a.localeCompare(b, 'ja'))[0];
}

export function mergeQualifications<T extends QualificationLike>(list: T[]): MergedQualification<T>[] {
  const groups = new Map<string, T[]>();

  list.forEach((item) => {
    const key = qualificationKey(item.name) || item.id;
    const current = groups.get(key) || [];
    current.push(item);
    groups.set(key, current);
  });

  return Array.from(groups.entries())
    .map(([, items]) => {
      const names = items.map((item) => item.name);
      const key = qualificationKey(items[0].name);
      const displayName = pickDisplayName(names, key);
      const canonical =
        items.find((item) => item.name === displayName) ||
        [...items].sort((a, b) => scoreDisplayName(a.name) - scoreDisplayName(b.name))[0];

      return {
        ...canonical,
        name: displayName,
        aliasIds: items.map((item) => item.id),
        aliasNames: Array.from(new Set(names.filter((name) => name !== displayName))),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

export function findMergedQualification<T extends QualificationLike>(
  merged: MergedQualification<T>[],
  id: string
) {
  return merged.find((item) => item.id === id || item.aliasIds.includes(id)) || null;
}

export function canonicalNameForId(list: QualificationLike[], id: string, fallback = '資格') {
  const merged = mergeQualifications(list);
  return findMergedQualification(merged, id)?.name || list.find((item) => item.id === id)?.name || fallback;
}

export function rankQualificationMatches<T extends QualificationLike>(
  list: MergedQualification<T>[],
  query: string
) {
  const trimmed = query.trim();
  if (!trimmed) return list;

  const lower = trimmed.toLowerCase();
  const key = qualificationKey(trimmed);

  const scored = list
    .map((item) => {
      const names = [item.name, ...item.aliasNames];
      const keys = names.map((name) => qualificationKey(name));
      const lowerNames = names.map((name) => name.toLowerCase());

      let score = 0;
      if (keys.includes(key)) score += 100;
      if (lowerNames.includes(lower)) score += 80;
      if (lowerNames.some((name) => name.startsWith(lower))) score += 40;
      if (keys.some((itemKey) => itemKey.startsWith(key) || key.startsWith(itemKey))) score += 20;
      if (lowerNames.some((name) => name.includes(lower)) || keys.some((itemKey) => itemKey.includes(key))) {
        score += 10;
      }

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name, 'ja'));

  return scored.map((entry) => entry.item);
}
