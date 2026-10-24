import { supabase } from '@/lib/supabase';
import { incrementExperienceLike } from '@/lib/incrementLike';

const localKey = (userId: string) => `liked-experiences:${userId}`;

function readLocalLiked(userId: string) {
  if (typeof window === 'undefined') return [] as string[];
  try {
    const raw = window.localStorage.getItem(localKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeLocalLiked(userId: string, ids: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(localKey(userId), JSON.stringify(ids));
}

export async function loadLikedExperienceIds(experienceIds: string[]) {
  const liked = new Set<string>();
  if (experienceIds.length === 0) return liked;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return liked;

  readLocalLiked(user.id).forEach((id) => {
    if (experienceIds.includes(id)) liked.add(id);
  });

  const { data, error } = await supabase
    .from('experience_likes')
    .select('experience_id')
    .eq('user_id', user.id)
    .in('experience_id', experienceIds);

  if (!error && data) {
    data.forEach((row) => {
      if (row.experience_id) liked.add(row.experience_id);
    });
  }

  return liked;
}

export async function addUniqueLike(experienceId: string, currentCount: number) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, needsLogin: true as const, next: currentCount, already: false };
  }

  const localIds = readLocalLiked(user.id);
  if (localIds.includes(experienceId)) {
    return { ok: true as const, needsLogin: false as const, next: currentCount, already: true };
  }

  const { error } = await supabase.from('experience_likes').insert([
    { user_id: user.id, experience_id: experienceId },
  ]);

  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      writeLocalLiked(user.id, [...localIds, experienceId]);
      return { ok: true as const, needsLogin: false as const, next: currentCount, already: true };
    }

    const tableMissing = /schema cache|does not exist|experience_likes/i.test(error.message);
    if (!tableMissing) throw error;
  }

  writeLocalLiked(user.id, [...localIds, experienceId]);
  const next = await incrementExperienceLike(experienceId, currentCount);
  return { ok: true as const, needsLogin: false as const, next, already: false };
}
