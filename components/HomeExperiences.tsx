'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';
import LikeButton from '@/components/LikeButton';
import { incrementExperienceLike } from '@/lib/incrementLike';

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

const PERSONA_FILTERS = [
  { id: 'working', label: '社会人' },
  { id: 'student', label: '学生' },
  { id: 'homemaker', label: '主婦・主夫' },
] as const;

const METHOD_FILTERS = [
  { id: 'self', label: '独学' },
  { id: 'online', label: '通信講座' },
  { id: 'school', label: '通学スクール' },
] as const;

const ALL_FILTERS = [...PERSONA_FILTERS, ...METHOD_FILTERS];

type FilterId = (typeof ALL_FILTERS)[number]['id'];

function experienceText(exp: HomeExperience) {
  const roadmapText = Array.isArray(exp.roadmap)
    ? exp.roadmap
        .map((step) => [step.period, step.material, step.textbook, step.point].filter(Boolean).join(' '))
        .join(' ')
    : '';

  return [
    exp.industry,
    exp.job_type,
    exp.occupation,
    exp.current_status,
    exp.title,
    exp.study_method,
    exp.learning_style,
    roadmapText,
  ]
    .filter(Boolean)
    .join(' ');
}

function personaLabel(exp: HomeExperience) {
  const source = `${exp.industry || ''} ${exp.job_type || ''} ${exp.occupation || ''}`;
  if (/主婦|主夫/.test(source)) return 'homemaker';
  if (/学生/.test(source)) return 'student';
  return 'working';
}

function matchesMethod(exp: HomeExperience, id: FilterId) {
  const text = experienceText(exp);
  if (id === 'self') return /独学/.test(text);
  if (id === 'online') return /通信講座|通信教育|通信|オンライン講座/.test(text);
  if (id === 'school') return /通学|スクール|予備校/.test(text);
  return false;
}

function matchesFilters(exp: HomeExperience, selected: FilterId[]) {
  if (selected.length === 0) return true;

  const selectedPersonas = selected.filter((id) =>
    PERSONA_FILTERS.some((filter) => filter.id === id)
  );
  const selectedMethods = selected.filter((id) =>
    METHOD_FILTERS.some((filter) => filter.id === id)
  );

  if (selectedPersonas.length > 0 && !selectedPersonas.includes(personaLabel(exp))) {
    return false;
  }

  if (selectedMethods.length > 0 && !selectedMethods.some((id) => matchesMethod(exp, id))) {
    return false;
  }

  return true;
}

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
        className="block space-y-2.5 rounded-xl border border-amber-200 bg-white p-4 transition hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="truncate rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
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
            ⏱️ {exp.daily_study_hours || '未設定'} / ⏳ {exp.duration_days || '未設定'}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/experiences/${exp.id}`}
      className="block space-y-2 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-400"
    >
      <div className="flex items-center justify-between">
        <span className="rounded bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
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

export default function HomeExperiences({ experiences }: { experiences: HomeExperience[] }) {
  const [selected, setSelected] = useState<FilterId[]>([]);
  const [sort, setSort] = useState<'popular' | 'latest'>('popular');
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likingId, setLikingId] = useState<string | null>(null);

  const toggleFilter = (id: FilterId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const likeCountOf = (exp: HomeExperience) => likeCounts[exp.id] ?? exp.likes_count ?? 0;

  const handleLike = async (exp: HomeExperience) => {
    if (likedIds.has(exp.id) || likingId) return;

    const previous = likeCountOf(exp);
    setLikingId(exp.id);
    setLikeCounts((prev) => ({ ...prev, [exp.id]: previous + 1 }));
    setLikedIds((prev) => new Set(prev).add(exp.id));

    try {
      const next = await incrementExperienceLike(exp.id, previous);
      setLikeCounts((prev) => ({ ...prev, [exp.id]: next }));
    } catch (err) {
      setLikeCounts((prev) => ({ ...prev, [exp.id]: previous }));
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.delete(exp.id);
        return next;
      });
    } finally {
      setLikingId(null);
    }
  };

  const filtered = useMemo(
    () => experiences.filter((exp) => matchesFilters(exp, selected)),
    [experiences, selected]
  );

  const featuredExperiences = [...filtered]
    .sort((a, b) => {
      if (sort === 'popular') return likeCountOf(b) - likeCountOf(a);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    })
    .slice(0, 3);

  const recentExperiences = filtered.slice(0, 5);

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-800 sm:text-xl">🔍 条件で絞り込む</h2>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-xs font-medium text-blue-600 hover:underline"
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
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <p className="text-xs text-gray-500">{filtered.length}件の体験談が見つかりました</p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-800 sm:text-xl">🔥 人気の合格ロードマップ</h2>
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setSort('popular')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition sm:text-sm ${
                sort === 'popular'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🔥 人気順
            </button>
            <button
              type="button"
              onClick={() => setSort('latest')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition sm:text-sm ${
                sort === 'latest'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🆕 最新順
            </button>
          </div>
        </div>
        {featuredExperiences.length > 0 ? (
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
        ) : (
          <p className="py-4 text-center text-sm text-gray-500">
            {selected.length > 0
              ? 'この条件に合う投稿はまだありません。'
              : '投稿がまだありません。'}
          </p>
        )}
      </section>

      {recentExperiences.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 sm:text-xl">🆕 最新の投稿ロードマップ</h2>
          <div className="space-y-3">
            {recentExperiences.map((exp) => (
              <ExperienceCard
                key={exp.id}
                exp={exp}
                variant="recent"
                likeCount={likeCountOf(exp)}
                liked={likedIds.has(exp.id)}
                liking={likingId === exp.id}
                onLike={() => handleLike(exp)}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
