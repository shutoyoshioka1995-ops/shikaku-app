import { supabase } from '@/lib/supabase';
import { pickSnsUrl } from '@/lib/snsUrl';

export type ProfileDraft = {
  user_name: string;
  avatar_url: string;
  sns_url: string;
  age_group: string;
  industry: string;
  job_type: string;
};

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function missingColumnName(message: string) {
  const match = message.match(/'([^']+)' column|column "?([a-zA-Z0-9_]+)"?/i);
  return match?.[1] || match?.[2] || '';
}

function splitOccupation(value: string) {
  if (!value.includes(' / ')) return { industry: '', job_type: '' };
  const [industry, ...rest] = value.split(' / ');
  return { industry: industry.trim(), job_type: rest.join(' / ').trim() };
}

export async function loadProfile(userId: string, metadata?: Record<string, unknown> | null): Promise<ProfileDraft> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  const row = (data || {}) as Record<string, unknown>;
  const meta = (metadata || {}) as Record<string, unknown>;

  const userName =
    asText(row.user_name) ||
    asText(row.display_name) ||
    asText(meta.user_name) ||
    asText(meta.display_name) ||
    asText(meta.full_name);

  const avatarUrl = asText(row.avatar_url) || asText(meta.avatar_url);
  const snsUrl = pickSnsUrl({
    sns_url: asText(row.sns_url) || asText(meta.sns_url) || null,
    twitter_url: asText(row.twitter_url) || asText(meta.twitter_url) || null,
    blog_url: asText(row.blog_url) || asText(meta.blog_url) || null,
  });

  const occupationParts = splitOccupation(asText(row.occupation) || asText(meta.occupation));

  return {
    user_name: userName,
    avatar_url: avatarUrl,
    sns_url: snsUrl,
    age_group: asText(row.age_group) || asText(meta.age_group),
    industry: asText(row.industry) || asText(meta.industry) || occupationParts.industry,
    job_type: asText(row.job_type) || asText(meta.job_type) || occupationParts.job_type,
  };
}

export async function uploadAvatar(userId: string, file: File) {
  const rawExt = (file.name.split('.').pop() || '').toLowerCase();
  const ext = /^[a-z0-9]+$/.test(rawExt) ? rawExt : file.type === 'image/png' ? 'png' : 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'image/jpeg',
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error('公開URLの取得に失敗しました。');
  }

  return data.publicUrl;
}

async function upsertProfile(payload: Record<string, unknown>) {
  let current = { ...payload };
  let lastError = '';

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { error } = await supabase.from('profiles').upsert(current, { onConflict: 'id' });
    if (!error) return;

    lastError = error.message;
    const missing = missingColumnName(error.message);
    if (missing && missing in current && missing !== 'id') {
      const { [missing]: _removed, ...rest } = current;
      current = rest;
      continue;
    }

    throw new Error(error.message);
  }

  throw new Error(lastError || 'プロフィールの保存に失敗しました。');
}

export async function saveProfile(userId: string, draft: ProfileDraft) {
  const user_name = draft.user_name.trim();
  const avatar_url = draft.avatar_url.trim();
  const sns_url = draft.sns_url.trim();
  const age_group = draft.age_group.trim();
  const industry = draft.industry.trim();
  const job_type = draft.job_type.trim();
  const occupation = [industry, job_type].filter(Boolean).join(' / ');

  await upsertProfile({
    id: userId,
    user_name,
    display_name: user_name,
    avatar_url: avatar_url || null,
    sns_url: sns_url || null,
    age_group: age_group || null,
    industry: industry || null,
    job_type: job_type || null,
    occupation: occupation || null,
    updated_at: new Date().toISOString(),
  });

  await supabase.auth.updateUser({
    data: {
      user_name,
      display_name: user_name,
      avatar_url,
      sns_url,
      age_group,
      industry,
      job_type,
    },
  });

  const experienceUpdate: Record<string, string | null> = { user_name: user_name || '匿名' };
  if (avatar_url) experienceUpdate.avatar_url = avatar_url;

  let experienceError = (
    await supabase.from('experiences').update(experienceUpdate).eq('user_id', userId)
  ).error;

  if (experienceError && /avatar_url|column|schema cache/i.test(experienceError.message)) {
    experienceError = (
      await supabase.from('experiences').update({ user_name: user_name || '匿名' }).eq('user_id', userId)
    ).error;
  }
}
