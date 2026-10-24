'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { loadProfile } from '@/lib/profile';
import { normalizeSnsUrl } from '@/lib/snsUrl';
import {
  AGE_GROUP_OPTIONS,
  DEFAULT_AGE_GROUP,
  DEFAULT_INDUSTRY,
  DEFAULT_JOB_TYPE,
  INDUSTRY_OPTIONS,
  JOB_TYPE_OPTIONS,
} from '@/lib/profileOptions';
import {
  findMergedQualification,
  mergeQualifications,
  qualificationKey,
  rankQualificationMatches,
  type MergedQualification,
} from '@/lib/qualificationMerge';
import { EXPERIENCE_TEMPLATES } from '@/lib/experienceTemplates';
import { METHOD_FILTERS, PERSONA_FILTERS } from '@/lib/experienceFilters';

type RoadmapStep = {
  type?: 'study' | 'exam';
  period: string;
  material?: string;
  textbook?: string;
  textbook_url?: string;
  point?: string;
  result?: string;
  score?: string;
};

type Qualification = MergedQualification;

function normalizeTextbookUrl(url?: string) {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

const DAILY_STUDY_HOURS_OPTIONS = [
  '〜30分程度（スキマ時間）', '30分〜1時間程度', '1〜2時間', '2〜3時間',
  '3〜4時間', '4〜5時間', '5〜6時間（休日メイン・専念）', '6時間以上（超集中・受験専念）',
];

const DURATION_DAYS_OPTIONS = [
  '1週間以内（超短期・直前集中）', '2週間以内', '1ヶ月（約30日）', '2ヶ月（約60日）',
  '3ヶ月（約90日）', '4〜5ヶ月', '半年（約180日）', '7〜11ヶ月',
  '1年程度', '1年半（18ヶ月）', '2年〜3年', '3年以上（長期継続）',
];

function NewExperienceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qualificationIdFromUrl = searchParams.get('qualification_id') || '';

  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [selectedQual, setSelectedQual] = useState<Qualification | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState('');
  const [ageGroup, setAgeGroup] = useState<string>(DEFAULT_AGE_GROUP);
  const [industry, setIndustry] = useState<string>(DEFAULT_INDUSTRY);
  const [jobType, setJobType] = useState<string>(DEFAULT_JOB_TYPE);
  const [currentStatus, setCurrentStatus] = useState('初学者（知識ゼロ）');
  const [examAttempts, setExamAttempts] = useState('1回目（一発合格）');
  const [passedDate, setPassedDate] = useState('');
  const [dailyStudyHours, setDailyStudyHours] = useState('1〜2時間');
  const [durationDays, setDurationDays] = useState('2ヶ月（約60日）');
  const [title, setTitle] = useState('');
  const [snsUrl, setSnsUrl] = useState('');

  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([
    { type: 'study', period: '0〜14日目（初期）', material: '', textbook_url: '', point: '' },
  ]);
  const [persona, setPersona] = useState('');
  const [studyMethod, setStudyMethod] = useState('');
  const [formStep, setFormStep] = useState(1);
  const [formError, setFormError] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchQualifications() {
      const { data, error } = await supabase
        .from('qualifications')
        .select('id, name')
        .order('name');

      if (!error && data) {
        const merged = mergeQualifications(data);
        setQualifications(merged);
        if (qualificationIdFromUrl) {
          const found = findMergedQualification(merged, qualificationIdFromUrl);
          if (found) {
            setSelectedQual(found);
            setSearchQuery(found.name);
          }
        }
      }
    }
    fetchQualifications();
  }, [qualificationIdFromUrl]);

  useEffect(() => {
    async function fillProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const profile = await loadProfile(user.id, (user.user_metadata || {}) as Record<string, unknown>);
      if (profile.user_name) setUserName(profile.user_name);
      if (profile.sns_url) setSnsUrl(profile.sns_url);
      if (profile.age_group) setAgeGroup(profile.age_group);
      if (profile.industry) setIndustry(profile.industry);
      if (profile.job_type) setJobType(profile.job_type);
    }

    fillProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredQualifications = rankQualificationMatches(qualifications, searchQuery);
  const similarExisting = searchQuery.trim()
    ? qualifications.find((q) => qualificationKey(q.name) === qualificationKey(searchQuery))
    : null;
  const canAddNewQualification = Boolean(searchQuery.trim()) && !similarExisting;

  const handleSelectQualification = (qual: Qualification) => {
    setSelectedQual(qual);
    setSearchQuery(qual.name);
    setIsDropdownOpen(false);
  };

  const handleAddNewQualification = async () => {
    const trimmedName = searchQuery.trim();
    if (!trimmedName) return;

    if (similarExisting) {
      handleSelectQualification(similarExisting);
      return;
    }

    setIsAddingNew(true);
    try {
      const { data, error } = await supabase
        .from('qualifications')
        .insert([{ name: trimmedName }])
        .select('id, name')
        .single();

      if (error) {
        alert('資格の登録に失敗しました: ' + error.message);
      } else if (data) {
        const merged = mergeQualifications([...qualifications, data]);
        const selected = findMergedQualification(merged, data.id) || {
          ...data,
          aliasIds: [data.id],
          aliasNames: [],
        };
        setQualifications(merged);
        setSelectedQual(selected);
        setSearchQuery(selected.name);
        setIsDropdownOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingNew(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = EXPERIENCE_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    if (!window.confirm('現在の入力内容が上書きされますがよろしいですか？')) return;

    setTitle(template.title);
    setDailyStudyHours(template.dailyStudyHours);
    setDurationDays(template.durationDays);
    if (template.examAttempts) setExamAttempts(template.examAttempts);
    if (template.currentStatus) setCurrentStatus(template.currentStatus);
    setRoadmapSteps(
      template.roadmapSteps.map((step) => ({
        ...step,
        textbook_url: step.textbook_url || '',
      }))
    );
    if (template.id === 'intensive') setStudyMethod('独学');
    if (template.id === 'working') {
      setPersona('社会人');
      setStudyMethod('独学');
    }
  };

  const addStudyStep = () => {
    setRoadmapSteps([
      ...roadmapSteps,
      { type: 'study', period: '', material: '', textbook_url: '', point: '' },
    ]);
  };

  const addExamStep = () => {
    setRoadmapSteps([...roadmapSteps, { type: 'exam', period: '', result: '不合格', score: '', point: '' }]);
  };

  const removeRoadmapStep = (index: number) => {
    if (roadmapSteps.length === 1) return;
    setRoadmapSteps(roadmapSteps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, field: keyof RoadmapStep, value: string) => {
    const newSteps = [...roadmapSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setRoadmapSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedQual) {
      setFormError('対象の資格を選択または追加してください。');
      setFormStep(1);
      return;
    }
    if (!persona || !studyMethod) {
      setFormError('学習者の属性と学習方法を選択してください。');
      setFormStep(2);
      return;
    }

    setLoading(true);

    // ログインユーザー情報の取得
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      qualification_id: selectedQual.id,
      user_id: user?.id || null, // ログイン中ならuser_idを保存
      user_name: userName || '匿名',
      age_group: ageGroup,
      industry: industry,
      job_type: jobType,
      occupation: [persona, industry, jobType].filter(Boolean).join(' / '),
      current_status: currentStatus,
      study_method: studyMethod,
      learning_style: persona,
      exam_attempts: examAttempts,
      passed_date: passedDate,
      daily_study_hours: dailyStudyHours,
      duration_days: durationDays,
      title: title,
      sns_url: normalizeSnsUrl(snsUrl) || null,
      roadmap: roadmapSteps.map((step) => ({
        ...step,
        textbook: step.textbook || step.material || '',
        textbook_url: normalizeTextbookUrl(step.textbook_url),
      })),
    };

    let insertedId: string | null = null;
    let { data, error } = await supabase.from('experiences').insert([payload]).select('id').maybeSingle();
    if (error && /sns_url|study_method|learning_style|column|schema cache/i.test(error.message)) {
      const { sns_url: _unused, study_method: _method, learning_style: _style, ...fallback } = payload;
      ({ data, error } = await supabase.from('experiences').insert([fallback]).select('id').maybeSingle());
    }

    insertedId = data?.id || null;
    if (!insertedId && user?.id && !error) {
      const { data: latest } = await supabase
        .from('experiences')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      insertedId = latest?.id || null;
    }

    setLoading(false);

    if (error) {
      alert('保存に失敗しました: ' + error.message);
    } else if (insertedId) {
      router.push(`/experiences/${insertedId}?posted=1`);
    } else {
      alert('合格体験談を投稿しました！');
      router.push(`/qualifications/${selectedQual.id}`);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 text-sm">
        <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium hover:underline">
          トップページへ
        </Link>
        {selectedQual && (
          <>
            <span className="text-gray-300">|</span>
            <Link href={`/qualifications/${selectedQual.id}`} className="text-navy hover:underline font-medium">
              ← 資格詳細へ戻る
            </Link>
          </>
        )}
      </div>

      <h1 className="text-2xl font-bold">合格体験談の新規投稿</h1>
      <p className="text-xs font-bold text-gray-500">
        {formStep}/3　{formStep === 1 ? '資格とテンプレート' : formStep === 2 ? 'プロフィール' : 'ロードマップ'}
      </p>
      {formError && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{formError}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {formStep === 1 && (
        <>
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-lg border-b pb-2">0. 対象の資格</h2>
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium mb-1">
              対象資格 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoComplete="off"
              placeholder="資格名を入力して候補から選択（例: 簿記、宅建、ITパスポート）"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedQual(null);
                setIsDropdownOpen(true);
                setHighlightIndex(0);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={(e) => {
                if (!isDropdownOpen) return;
                const extra = canAddNewQualification ? 1 : 0;
                const maxIndex = Math.max(filteredQualifications.length + extra - 1, 0);
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightIndex((prev) => Math.min(prev + 1, maxIndex));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightIndex((prev) => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  const picked = filteredQualifications[highlightIndex];
                  if (picked) handleSelectQualification(picked);
                  else if (canAddNewQualification) handleAddNewQualification();
                } else if (e.key === 'Escape') {
                  setIsDropdownOpen(false);
                }
              }}
              className="w-full border p-2.5 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy"
              required
            />
            <p className="mt-1.5 text-[11px] text-gray-500">
              表記ゆれを防ぐため、できるだけ候補一覧から既存の資格名を選んでください。
            </p>

            {selectedQual && (
              <p className="mt-1.5 text-xs text-navy font-bold flex items-center gap-1">
                ✓ 選択中: {selectedQual.name}
                {selectedQual.aliasNames.length > 0 && (
                  <span className="font-medium text-gray-500">（{selectedQual.aliasNames.join(' / ')} を含む）</span>
                )}
              </p>
            )}

            {!selectedQual && similarExisting && (
              <p className="mt-1.5 text-xs font-bold text-navy">
                「{similarExisting.name}」として登録済みです。候補から選択してください。
              </p>
            )}

            {isDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
                {filteredQualifications.length > 0 ? (
                  filteredQualifications.map((qual, index) => (
                    <div
                      key={qual.id}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSelectQualification(qual);
                      }}
                      className={`px-4 py-2.5 text-sm cursor-pointer ${
                        highlightIndex === index || selectedQual?.id === qual.id
                          ? 'bg-navy-soft font-bold text-navy'
                          : 'text-gray-700 hover:bg-navy-soft'
                      }`}
                    >
                      <p>{qual.name}</p>
                      {qual.aliasNames.length > 0 && (
                        <p className="text-[11px] font-medium text-gray-400">別名: {qual.aliasNames.join(' / ')}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">一致する資格が見つかりません。</div>
                )}

                {canAddNewQualification && (
                  <div
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleAddNewQualification();
                    }}
                    className={`px-4 py-2.5 text-sm cursor-pointer bg-navy-soft hover:bg-navy-soft text-navy font-bold border-t border-gray-100 flex items-center justify-between ${
                      highlightIndex === filteredQualifications.length ? 'ring-2 ring-navy' : ''
                    }`}
                  >
                    <span>＋ 「{searchQuery.trim()}」を新しい資格として追加</span>
                    {isAddingNew && <span className="text-xs text-gray-500">追加中...</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-navy/15 rounded-xl p-6 space-y-4 bg-navy-soft/50">
          <div className="border-b border-navy/15 pb-2">
            <h2 className="font-bold text-lg text-navy">テンプレートを使って自動入力</h2>
            <p className="mt-1 text-xs text-gray-600">
              よくある学習パターンをタイトル・1日の平均勉強時間・学習期間・ロードマップにセットします。プロフィール項目は上書きしません。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {EXPERIENCE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template.id)}
                className="w-full min-h-12 text-left rounded-xl border border-navy/20 bg-white px-4 py-3 hover:border-navy transition"
              >
                <p className="text-sm font-extrabold text-gray-900">{template.label}</p>
                <p className="mt-0.5 text-[11px] text-gray-500">{template.description}</p>
              </button>
            ))}
          </div>
        </div>
        </>
        )}

        {formStep === 2 && (
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-lg border-b pb-2">1. あなたのプロフィール & 受験情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ニックネーム</label>
              <input
                type="text"
                placeholder="例: Aさん"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full border p-2 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                X（旧Twitter）アカウントまたはブログURL（任意）
              </label>
              <input
                type="text"
                inputMode="url"
                placeholder="例: @username / https://x.com/username / https://example.com"
                value={snsUrl}
                onChange={(e) => setSnsUrl(e.target.value)}
                className="w-full border p-2 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">年代</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full border p-2 rounded-md text-sm bg-white"
              >
                {AGE_GROUP_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">業種・業界</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full border p-2 rounded-md text-sm bg-white"
              >
                {INDUSTRY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                学習者の属性 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="w-full border p-2 rounded-md text-sm bg-white"
              >
                <option value="">選択してください</option>
                {PERSONA_FILTERS.map((item) => (
                  <option key={item.id} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                学習方法 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={studyMethod}
                onChange={(e) => setStudyMethod(e.target.value)}
                className="w-full border p-2 rounded-md text-sm bg-white"
              >
                <option value="">選択してください</option>
                {METHOD_FILTERS.map((item) => (
                  <option key={item.id} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">職種・担当業務</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full border p-2 rounded-md text-sm bg-white"
              >
                {JOB_TYPE_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">受験回数</label>
              <select
                value={examAttempts}
                onChange={(e) => setExamAttempts(e.target.value)}
                className="w-full border p-2 rounded-md text-sm bg-white"
              >
                <option value="1回目（一発合格）">1回目（一発合格）</option>
                <option value="2回目">2回目（リベンジ合格）</option>
                <option value="3回目">3回目</option>
                <option value="4回以上">4回以上</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">最終合格日 / 合格時期</label>
              <input
                type="text"
                placeholder="例: 2026年6月21日"
                value={passedDate}
                onChange={(e) => setPassedDate(e.target.value)}
                className="w-full border p-2 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">学習開始時の状況</label>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="w-full border p-2 rounded-md text-sm bg-white"
              >
                <option value="初学者（知識ゼロ）">初学者（知識ゼロ）</option>
                <option value="関連資格を保持">関連資格を保持（例: 下位級など）</option>
                <option value="実務経験あり">実務経験あり</option>
                <option value="再受験（独学経験あり）">再受験（独学経験あり）</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">1日の平均勉強時間</label>
              <select
                value={dailyStudyHours}
                onChange={(e) => setDailyStudyHours(e.target.value)}
                className="w-full border p-2 rounded-md text-sm bg-white"
              >
                {DAILY_STUDY_HOURS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">合格までにかかった総期間</label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full border p-2 rounded-md text-sm bg-white"
              >
                {DURATION_DAYS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        )}

        {formStep === 3 && (
        <>
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-lg border-b pb-2">2. 体験談のタイトル</h2>
          <input
            type="text"
            required
            placeholder="例: 【2回目で合格】仕事終わり1時間のスキマ時間で掴んだ合格ロードマップ"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2.5 rounded-md text-sm"
          />
        </div>

        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="font-bold text-lg">3. 学習ロードマップ & 受験履歴</h2>
            <p className="text-xs text-gray-500">時系列順に学習フェーズや受験結果を追加できます</p>
          </div>

          <div className="space-y-6">
            {roadmapSteps.map((step, index) => {
              const isExam = step.type === 'exam';
              const youtubeId = step.material ? extractYouTubeId(step.material) : null;

              return (
                <div
                  key={index}
                  className={`border p-4 rounded-lg space-y-3 ${
                    isExam ? 'bg-navy-soft/80 border-navy/20' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-bold text-xs px-2.5 py-1 rounded flex items-center gap-1 ${
                        isExam
                          ? 'bg-navy text-white'
                          : 'bg-navy-soft text-navy'
                      }`}
                    >
                      {isExam ? '受験・本番イベント' : `ステップ ${index + 1}（学習期間）`}
                    </span>
                    {roadmapSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRoadmapStep(index)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        削除
                      </button>
                    )}
                  </div>

                  {!isExam && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          期間（例: 0〜14日目 / 1回目不合格後の直前期など）
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="例: 0〜14日目"
                          value={step.period}
                          onChange={(e) => handleStepChange(index, 'period', e.target.value)}
                          className="w-full border p-2 rounded-md text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          使用した教材・動画（YouTubeのURLを貼るとプレビューが表示されます）
                        </label>
                        <input
                          type="text"
                          placeholder="例: スッキリわかる合格テキスト / https://www.youtube.com/watch?v=..."
                          value={step.material || ''}
                          onChange={(e) => handleStepChange(index, 'material', e.target.value)}
                          className="w-full border p-2 rounded-md text-sm bg-white"
                        />

                        {youtubeId && (
                          <div className="mt-3 space-y-1">
                            <span className="text-xs font-bold text-navy flex items-center gap-1">
                              ✓ YouTube動画を検出しました（プレビュー）
                            </span>
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm bg-black">
                              <iframe
                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                title="YouTube preview"
                                className="absolute top-0 left-0 w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          教材の購入・参照URL（任意）
                        </label>
                        <input
                          type="text"
                          inputMode="url"
                          placeholder="例: https://www.amazon.co.jp/... （アフィリエイトリンク可）"
                          value={step.textbook_url || ''}
                          onChange={(e) => handleStepChange(index, 'textbook_url', e.target.value)}
                          className="w-full border p-2 rounded-md text-sm bg-white"
                        />
                        <p className="mt-1 text-[11px] text-gray-500">
                          入力すると詳細ページに「教材の購入・詳細ページへ」ボタンが表示されます。空欄の場合は教材名からAmazon検索リンクを自動生成します。
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          学習のポイント・工夫
                        </label>
                        <textarea
                          rows={3}
                          placeholder="例: 仕訳問題のスピードを意識して演習した。"
                          value={step.point || ''}
                          onChange={(e) => handleStepChange(index, 'point', e.target.value)}
                          className="w-full border p-2 rounded-md text-sm bg-white"
                        />
                      </div>
                    </>
                  )}

                  {isExam && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-navy mb-1">
                            受験時期・日付
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="例: 2026年3月15日 (1回目)"
                            value={step.period}
                            onChange={(e) => handleStepChange(index, 'period', e.target.value)}
                            className="w-full border border-navy/20 p-2 rounded-md text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-navy mb-1">
                            結果・合否
                          </label>
                          <select
                            value={step.result || '不合格'}
                            onChange={(e) => handleStepChange(index, 'result', e.target.value)}
                            className="w-full border border-navy/20 p-2 rounded-md text-sm bg-white"
                          >
                            <option value="不合格">不合格（リベンジへ）</option>
                            <option value="合格">合格！</option>
                            <option value="結果待ち・手応えあり">結果待ち・手応えあり</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-navy mb-1">
                            得点・スコア（任意）
                          </label>
                          <input
                            type="text"
                            placeholder="例: 58点 / C判定"
                            value={step.score || ''}
                            onChange={(e) => handleStepChange(index, 'score', e.target.value)}
                            className="w-full border border-navy/20 p-2 rounded-md text-sm bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-navy mb-1">
                          受験後の振り返り・次への反省点
                        </label>
                        <textarea
                          rows={2}
                          placeholder="例: 第3問の商業簿記で時間を使いすぎて最後まで解ききれなかった。"
                          value={step.point || ''}
                          onChange={(e) => handleStepChange(index, 'point', e.target.value)}
                          className="w-full border border-navy/20 p-2 rounded-md text-sm bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={addStudyStep}
              className="border-2 border-dashed border-navy text-navy py-2.5 rounded-lg font-bold text-sm hover:bg-navy-soft transition"
            >
              ＋ 学習フェーズを追加
            </button>

            <button
              type="button"
              onClick={addExamStep}
              className="border-2 border-dashed border-navy/40 text-navy bg-navy-soft/50 py-2.5 rounded-lg font-bold text-sm hover:bg-navy-soft transition"
            >
              ＋ 受験・合否イベントを追加
            </button>
          </div>
        </div>
        </>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          {formStep > 1 && (
            <button
              type="button"
              onClick={() => {
                setFormError('');
                setFormStep((step) => step - 1);
              }}
              className="min-h-12 w-full rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              戻る
            </button>
          )}
          {formStep < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (formStep === 1 && !selectedQual) {
                  setFormError('対象の資格を選択してください。');
                  return;
                }
                if (formStep === 2 && (!persona || !studyMethod)) {
                  setFormError('学習者の属性と学習方法を選択してください。');
                  return;
                }
                setFormError('');
                setFormStep((step) => step + 1);
              }}
              className="min-h-12 w-full rounded-xl bg-navy text-sm font-extrabold text-white hover:bg-navy-hover"
            >
              次へ
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="min-h-12 w-full rounded-xl bg-navy text-base font-bold text-white shadow-sm transition hover:bg-navy-hover disabled:opacity-50"
            >
              {loading ? '送信中...' : 'この内容で合格体験談を投稿する'}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

export default function NewExperiencePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">読み込み中...</div>}>
      <NewExperienceForm />
    </Suspense>
  );
}