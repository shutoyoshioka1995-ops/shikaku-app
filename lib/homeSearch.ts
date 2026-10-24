import { qualificationKey } from '@/lib/qualificationMerge';
import { parseDurationMonths } from '@/lib/qualificationStats';

export type HomeDurationFilter = '' | 'lte1' | 'lte3' | 'lte6' | 'lte12' | 'gt12';
export type HomePersonaFilter = '' | 'working' | 'student' | 'homemaker';

export type AppliedHomeSearch = {
  query: string;
  duration: HomeDurationFilter;
  persona: HomePersonaFilter;
};

type SearchableExperience = {
  title?: string;
  qualification_name?: string;
  duration_days?: string;
};

export function matchesDurationFilter(durationDays: string | undefined, filter: HomeDurationFilter) {
  if (!filter) return true;
  const months = parseDurationMonths(durationDays);
  if (months == null) return false;
  if (filter === 'gt12') return months >= 12;
  const max = { lte1: 1, lte3: 3, lte6: 6, lte12: 12 }[filter];
  return months <= max;
}

export function matchesSearchQuery(exp: SearchableExperience, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();
  const key = qualificationKey(trimmed);
  const title = (exp.title || '').toLowerCase();
  const qualName = exp.qualification_name || '';
  const qualLower = qualName.toLowerCase();
  const qualKey = qualificationKey(qualName);

  return (
    title.includes(lower) ||
    qualLower.includes(lower) ||
    (key.length > 0 && qualKey.length > 0 && (qualKey.includes(key) || key.includes(qualKey)))
  );
}
