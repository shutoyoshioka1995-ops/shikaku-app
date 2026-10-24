'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import HomeExperiences, { type HomeExperience } from '@/components/HomeExperiences';
import {
  rankQualificationMatches,
  type MergedQualification,
} from '@/lib/qualificationMerge';
import type { AppliedHomeSearch, HomeDurationFilter, HomePersonaFilter } from '@/lib/homeSearch';

type Props = {
  qualifications: MergedQualification[];
  experiences: HomeExperience[];
};

const DURATION_OPTIONS: { id: HomeDurationFilter; label: string }[] = [
  { id: '', label: '期間は問わない' },
  { id: 'lte1', label: '1ヶ月以内' },
  { id: 'lte3', label: '3ヶ月以内' },
  { id: 'lte6', label: '半年以内' },
  { id: 'lte12', label: '1年以内' },
  { id: 'gt12', label: '1年以上' },
];

const PERSONA_OPTIONS: { id: HomePersonaFilter; label: string }[] = [
  { id: '', label: '属性は問わない' },
  { id: 'working', label: '社会人' },
  { id: 'student', label: '学生' },
  { id: 'homemaker', label: '主婦・主夫' },
];

export default function HomeBrowse({ qualifications, experiences }: Props) {
  const [query, setQuery] = useState('');
  const [duration, setDuration] = useState<HomeDurationFilter>('');
  const [persona, setPersona] = useState<HomePersonaFilter>('');
  const [applied, setApplied] = useState<AppliedHomeSearch>({
    query: '',
    duration: '',
    persona: '',
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => rankQualificationMatches(qualifications, query).slice(0, 8),
    [qualifications, query]
  );

  const visibleQualifications = useMemo(() => {
    if (!applied.query.trim()) return qualifications;
    const ranked = rankQualificationMatches(qualifications, applied.query);
    return ranked.length > 0 ? ranked : [];
  }, [applied.query, qualifications]);

  const searchActive = Boolean(applied.query.trim() || applied.duration || applied.persona);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const applySearch = (next?: Partial<AppliedHomeSearch>) => {
    const nextApplied: AppliedHomeSearch = {
      query: (next?.query ?? query).trim(),
      duration: next?.duration ?? duration,
      persona: next?.persona ?? persona,
    };
    setQuery(nextApplied.query);
    setDuration(nextApplied.duration);
    setPersona(nextApplied.persona);
    setApplied(nextApplied);
    setDropdownOpen(false);
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const clearSearch = () => {
    setQuery('');
    setDuration('');
    setPersona('');
    setApplied({ query: '', duration: '', persona: '' });
    setDropdownOpen(false);
  };

  const pickQualification = (name: string) => {
    setQuery(name);
    applySearch({ query: name });
  };

  return (
    <>
      <section className="space-y-5 pt-4 text-center">
        <div className="space-y-3">
          <h1 className="text-2xl font-extrabold text-navy sm:text-4xl">
            資格合格ロードマップ検索
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 sm:text-base">
            リアルな合格体験談・学習ロードマップから、あなたに最適な勉強法を見つけよう
          </p>
        </div>

        <form
          className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
          <div className="relative" ref={dropdownRef}>
            <label htmlFor="home-qual-search" className="mb-1 block text-xs font-bold text-gray-700">
              資格名
            </label>
            <input
              id="home-qual-search"
              type="search"
              value={query}
              autoComplete="off"
              placeholder="例: 宅建、簿記2級、基本情報"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy"
              onChange={(event) => {
                setQuery(event.target.value);
                setDropdownOpen(true);
                setHighlightIndex(0);
              }}
              onFocus={() => {
                if (query.trim()) setDropdownOpen(true);
              }}
              onKeyDown={(event) => {
                if (!dropdownOpen || suggestions.length === 0) return;
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setHighlightIndex((index) => (index + 1) % suggestions.length);
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setHighlightIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
                } else if (event.key === 'Enter' && suggestions[highlightIndex] && query.trim()) {
                  event.preventDefault();
                  pickQualification(suggestions[highlightIndex].name);
                } else if (event.key === 'Escape') {
                  setDropdownOpen(false);
                }
              }}
            />
            {dropdownOpen && query.trim() && (
              <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                {suggestions.length > 0 ? (
                  suggestions.map((qual, index) => (
                    <button
                      key={qual.id}
                      type="button"
                      className={`block w-full px-4 py-2.5 text-left text-sm ${
                        highlightIndex === index
                          ? 'bg-navy-soft font-bold text-navy'
                          : 'text-gray-700 hover:bg-navy-soft'
                      }`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        pickQualification(qual.name);
                      }}
                    >
                      <span className="block">{qual.name}</span>
                      {qual.aliasNames.length > 0 && (
                        <span className="mt-0.5 block text-[11px] font-medium text-gray-400">
                          別名: {qual.aliasNames.join(' / ')}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    一致する資格名はありません。このまま検索すると体験談のタイトルからも探します。
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="home-duration" className="mb-1 block text-xs font-bold text-gray-700">
                学習期間
              </label>
              <select
                id="home-duration"
                value={duration}
                onChange={(event) => setDuration(event.target.value as HomeDurationFilter)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.id || 'any'} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="home-persona" className="mb-1 block text-xs font-bold text-gray-700">
                あなたの属性
              </label>
              <select
                id="home-persona"
                value={persona}
                onChange={(event) => setPersona(event.target.value as HomePersonaFilter)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
              >
                {PERSONA_OPTIONS.map((option) => (
                  <option key={option.id || 'any'} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 min-h-12 w-full rounded-xl bg-navy px-6 py-3 text-sm font-extrabold text-white transition hover:bg-navy-hover sm:text-base"
          >
            この条件で探す
          </button>
        </form>

        <p className="text-sm text-gray-600">
          体験談を共有する場合は{' '}
          <Link href="/experiences/new" className="font-bold text-navy hover:underline">
            ロードマップを投稿する
          </Link>
        </p>
      </section>

      <div ref={resultsRef} id="search-results" className="scroll-mt-20">
        <HomeExperiences experiences={experiences} appliedSearch={applied} searchActive={searchActive} />
      </div>

      <section className="space-y-4 pt-2">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-2">
          <h2 className="text-lg font-bold text-navy sm:text-xl">
            {applied.query.trim() ? '条件に合う資格' : '登録されている資格一覧'} ({visibleQualifications.length}件)
          </h2>
          {searchActive && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-xs font-medium text-navy hover:underline"
            >
              検索条件をクリア
            </button>
          )}
        </div>
        {visibleQualifications.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {visibleQualifications.map((qual) => (
              <Link
                key={qual.id}
                href={`/qualifications/${qual.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-navy"
              >
                <h3 className="text-sm font-bold text-gray-800">{qual.name}</h3>
                {qual.aliasNames.length > 0 && (
                  <p className="mt-1 truncate text-[11px] text-gray-400">{qual.aliasNames.join(' / ')}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-white px-4 py-8 text-center text-sm text-gray-500">
            この資格名に一致する登録がありません。体験談の検索結果をご確認ください。
          </p>
        )}
      </section>
    </>
  );
}
