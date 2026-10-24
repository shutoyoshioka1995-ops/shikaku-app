'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';
import LikeButton from '@/components/LikeButton';
import { addUniqueLike, loadLikedExperienceIds } from '@/lib/likes';
import { loginUrl } from '@/lib/loginNext';
import { ALL_FILTERS, matchesFilters, type FilterId } from '@/lib/experienceFilters';
import {
  matchesDurationFilter,
  matchesSearchQuery,
  type AppliedHomeSearch,
  type HomeDurationFilter,
  type HomePersonaFilter,
} from '@/lib/homeSearch';

const PAGE_SIZE = 6;

export type HomeExperience = {
  id: string;
  title?: string;
  user_name?: string;
  user_id?: string;
  avatar_url?: string | null;
  qualification_name?: string;
  likes_count?: number;
  created_at?: string;
  daily_study_hours?: string;
  duration_days?: string;
  industry?: string;
  job_type?: string;
  occupation?: string;
  current_status?: string;
  study_method?: string;
  learning_style?: string;
  roadmap?: Array<{
    period?: string;
    material?: string;
    textbook?: string;
    point?: string;
  }>;
};

function ExperienceCard({
  exp,
  variant,
  likeCount,
  liked,
  liking,
  onLike,
}: {
  exp: HomeExperience;
  variant: 'popular' | 'recent';
  likeCount: number;
  liked: boolean;
  liking: boolean;
  onLike: () => void;
}) {
  const displayName = exp.user_name || '匿名';

  if (variant === 'popular') {
    return (
      <Link
        href={`/experiences/${exp.id}`}
        className="block space-y-2.5 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-navy"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="truncate rounded-full bg-navy-soft px-2.5 py-0.5 text-[11px] font-bold text-navy">
            {exp.qualification_name}
          </span>
          <LikeButton count={likeCount} liked={liked} loading={liking} onLike={onLike} />
        </div>
        <h3 className="line-clamp-2 text-sm font-bold text-gray-900">
          {exp.title || '無題のロードマップ'}
        </h3>
        <div className="space-y-1 border-t border-gray-100 pt-2 text-xs text-gray-500">
          <p className="flex items-center gap-2">
            <UserAvatar
              avatarUrl={exp.avatar_url}
              seed={exp.user_id || exp.user_name || exp.id}
              alt={displayName}
              size={28}
            />
            <span className="truncate">{displayName}</span>
          </p>
          <p>
            {exp.daily_study_hours || '未設定'} / {exp.duration_days || '未設定'}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/experiences/${exp.id}`}
        className="block space-y-2 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-navy"
    >
      <div className="flex items-center justify-between">
        <span className="rounded bg-navy-soft px-2.5 py-0.5 text-xs font-bold text-navy">
          {exp.qualification_name}
        </span>
        <LikeButton count={likeCount} liked={liked} loading={liking} onLike={onLike} />
      </div>
      <h3 className="text-sm font-bold text-gray-900">{exp.title || '無題のロードマップ'}</h3>
      <p className="flex items-center gap-2 text-xs text-gray-500">
        <UserAvatar
          avatarUrl={exp.avatar_url}
          seed={exp.user_id || exp.user_name || exp.id}
          alt={displayName}
          size={24}
        />
        <span className="truncate">{displayName}</span>
      </p>
    </Link>
  );
}

export default function HomeExperiences({
  experiences,
  appliedSearch = { query: '', duration: '' as HomeDurationFilter, persona: '' as HomePersonaFilter },
  searchActive = false,
}: {
  experiences: HomeExperience[];
  appliedSearch?: AppliedHomeSearch;
  searchActive?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<FilterId[]>([]);
  const [sort, setSort] = useState<'popular' | 'latest'>('popular');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likingId, setLikingId] = useState<string | null>(null);

  useEffect(() => {
    const ids = experiences.map((exp) => exp.id);
    loadLikedExperienceIds(ids).then(setLikedIds);
  }, [experiences]);

  const toggleFilter = (id: FilterId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const likeCountOf = (exp: HomeExperience) => likeCounts[exp.id] ?? exp.likes_count ?? 0;

  const handleLike = async (exp: HomeExperience) => {
    if (likedIds.has(exp.id) || likingId) return;

    const previous = likeCountOf(exp);
    setLikingId(exp.id);

    try {
      const result = await addUniqueLike(exp.id, previous);
      if (result.needsLogin) {
        router.push(loginUrl(pathname || '/'));
        return;
      }
      setLikedIds((prev) => new Set(prev).add(exp.id));
      if (!result.already) {
        setLikeCounts((prev) => ({ ...prev, [exp.id]: result.next }));
      }
    } catch (err) {
      // keep previous count
    } finally {
      setLikingId(null);
    }
  };

  const filtered = useMemo(() => {
    const heroPersona = appliedSearch.persona
      ? ([appliedSearch.persona] as FilterId[])
      : [];

    return experiences.filter((exp) => {
      if (!matchesSearchQuery(exp, appliedSearch.query)) return false;
      if (!matchesDurationFilter(exp.duration_days, appliedSearch.duration)) return false;
      if (heroPersona.length > 0 && !matchesFilters(exp, heroPersona)) return false;
      if (!matchesFilters(exp, selected)) return false;
      return true;
    });
  }, [experiences, selected, appliedSearch]);

  const sortedExperiences = [...filtered].sort((a, b) => {
    if (sort === 'popular') return likeCountOf(b) - likeCountOf(a);
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const featuredExperiences = sortedExperiences.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selected, sort, appliedSearch, searchActive]);

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy sm:text-xl">条件で絞り込む</h2>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-xs font-medium text-navy hover:underline"
            >
              リセット
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_FILTERS.map((filter) => {
            const isActive = selected.includes(filter.id);
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => toggleFilter(filter.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition sm:text-sm ${
                  isActive
                    ? 'border-navy bg-navy text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-navy hover:bg-navy-soft'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        {(selected.length > 0 || searchActive) && (
          <p className="text-xs text-gray-500">{filtered.length}件の体験談が見つかりました</p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy sm:text-xl">
            {searchActive
              ? '検索結果のロードマップ'
              : sort === 'latest'
                ? '最新の合格ロードマップ'
                : '人気の合格ロードマップ'}
          </h2>
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setSort('popular')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition sm:text-sm ${
                sort === 'popular'
                  ? 'bg-navy text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              人気順
            </button>
            <button
              type="button"
              onClick={() => setSort('latest')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition sm:text-sm ${
                sort === 'latest'
                  ? 'bg-navy text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              最新順
            </button>
          </div>
        </div>
        {featuredExperiences.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {featuredExperiences.map((exp) => (
                <ExperienceCard
                  key={exp.id}
                  exp={exp}
                  variant="popular"
                  likeCount={likeCountOf(exp)}
                  liked={likedIds.has(exp.id)}
                  liking={likingId === exp.id}
                  onLike={() => handleLike(exp)}
                />
              ))}
            </div>
            {visibleCount < sortedExperiences.length && (
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="min-h-11 w-full rounded-xl border border-navy/20 bg-white text-sm font-bold text-navy hover:bg-navy-soft"
              >
                もっと見る（残り{sortedExperiences.length - visibleCount}件）
              </button>
            )}
          </>
        ) : (
          <p className="py-4 text-center text-sm text-gray-500">
            {selected.length > 0 || searchActive
              ? 'この条件に合う投稿はまだありません。条件を変えるか、資格一覧から探してみてください。'
              : '投稿がまだありません。'}
          </p>
        )}
      </section>
    </>
  );
}
