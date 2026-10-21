import { supabase } from '@/lib/supabase';

export async function incrementExperienceLike(experienceId: string, currentCount: number) {
  const { data } = await supabase
    .from('experiences')
    .select('likes_count')
    .eq('id', experienceId)
    .maybeSingle();

  const next = (typeof data?.likes_count === 'number' ? data.likes_count : currentCount) + 1;

  const { error } = await supabase
    .from('experiences')
    .update({ likes_count: next })
    .eq('id', experienceId);

  if (error) throw error;
  return next;
}
