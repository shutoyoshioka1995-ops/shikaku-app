'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { normalizeSnsUrl } from '@/lib/snsUrl';

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

type Qualification = {
  id: string;
  name: string;
};

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

const INDUSTRY_OPTIONS = [
  '情報・通信業（IT・Web）', '製造業（メーカー）', '金融・保険業', '不動産業・建設業',
  '卸売・小売業', 'サービス業', '運輸・物流業', '電気・ガス・水道業',
  '医療・福祉・介護', '教育・学習支援', '公務・団体職員', '学生（高校・専門・大学）',
  '主婦・主夫', 'フリーランス・個人事業主', 'その他',
];

const JOB_TYPE_OPTIONS = [
  'インサイドセールス系', '外勤営業・フィールドセールス系', '内勤営業・内勤コンサル系',
  '事務・管理部門系（総務・人事・経理など）', 'マーケティング・企画・広報系',
  'エンジニア・IT技術職系', 'クリエイター・デザイナー系', '専門職（士業・コンサルタントなど）',
  '接客・販売・店舗サービス系', '医療・福祉専門職系', '研究・開発・製造系', '学生・無職・その他',
];

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState('');
  const [ageGroup, setAgeGroup] = useState('20代');
  const [industry, setIndustry] = useState('情報・通信業（IT・Web）');
  const [jobType, setJobType] = useState('インサイドセールス系');
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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchQualifications() {
      const { data, error } = await supabase
        .from('qualifications')
        .select('id, name')
        .order('name');

      if (!error && data) {
        setQualifications(data);
        if (qualificationIdFromUrl) {
          const found = data.find((q) => q.id === qualificationIdFromUrl);
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
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredQualifications = qualifications.filter((q) =>
    q.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasExactMatch = qualifications.some(
    (q) => q.name.trim().toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const handleSelectQualification = (qual: Qualification) => {
    setSelectedQual(qual);
    setSearchQuery(qual.name);
    setIsDropdownOpen(false);
  };

  const handleAddNewQualification = async () => {
    const trimmedName = searchQuery.trim();
    if (!trimmedName) return;

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
        setQualifications((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedQual(data);
        setSearchQuery(data.name);
        setIsDropdownOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingNew(false);
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
      alert('対象の資格を選択または追加してください。');
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
      occupation: `${industry} / ${jobType}`,
      current_status: currentStatus,
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

    let { error } = await supabase.from('experiences').insert([payload]);
    if (error && /sns_url|column|schema cache/i.test(error.message)) {
      const { sns_url: _unused, ...payloadWithoutSns } = payload;
      ({ error } = await supabase.from('experiences').insert([payloadWithoutSns]));
    }

    setLoading(false);

    if (error) {
      alert('保存に失敗しました: ' + error.message);
    } else {
      alert('合格体験談を投稿しました！');
      router.push(`/qualifications/${selectedQual.id}`);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 text-sm">
        <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium hover:underline">
          🏠 トップページへ
        </Link>
        {selectedQual && (
          <>
            <span className="text-gray-300">|</span>
            <Link href={`/qualifications/${selectedQual.id}`} className="text-blue-600 hover:underline font-medium">
              ← 資格詳細へ戻る
            </Link>
          </>
        )}
      </div>

      <h1 className="text-2xl font-bold">合格体験談の新規投稿</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-lg border-b pb-2">0. 対象の資格</h2>
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium mb-1">
              対象資格 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="例: 基本情報技術者、AWS、簿記 など入力..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedQual(null);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full border p-2.5 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            {selectedQual && (
              <p className="mt-1.5 text-xs text-green-600 font-bold flex items-center gap-1">
                ✓ 選択中: {selectedQual.name}
              </p>
            )}

            {isDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredQualifications.length > 0 ? (
                  filteredQualifications.map((qual) => (
                    <div
                      key={qual.id}
                      onClick={() => handleSelectQualification(qual)}
                      className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                        selectedQual?.id === qual.id ? 'bg-blue-100 font-bold text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {qual.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">一致する資格が見つかりません。</div>
                )}

                {!hasExactMatch && searchQuery.trim().length > 0 && (
                  <div
                    onClick={handleAddNewQualification}
                    className="px-4 py-2.5 text-sm cursor-pointer bg-green-50 hover:bg-green-100 text-green-700 font-bold border-t border-gray-100 flex items-center justify-between"
                  >
                    <span>＋ 「{searchQuery.trim()}」を新しい資格として追加</span>
                    {isAddingNew && <span className="text-xs text-gray-500">追加中...</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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
                <option value="10代">10代</option>
                <option value="20代">20代</option>
                <option value="30代">30代</option>
                <option value="40代">40代</option>
                <option value="50代〜">50代〜</option>
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
                    isExam ? 'bg-amber-50/60 border-amber-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-bold text-xs px-2.5 py-1 rounded flex items-center gap-1 ${
                        isExam
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      {isExam ? '📝 受験・本番イベント' : `📘 ステップ ${index + 1} (学習期間)`}
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
                            <span className="text-xs font-bold text-green-600 flex items-center gap-1">
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
                          <label className="block text-xs font-bold text-amber-900 mb-1">
                            受験時期・日付
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="例: 2026年3月15日 (1回目)"
                            value={step.period}
                            onChange={(e) => handleStepChange(index, 'period', e.target.value)}
                            className="w-full border border-amber-300 p-2 rounded-md text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-amber-900 mb-1">
                            結果・合否
                          </label>
                          <select
                            value={step.result || '不合格'}
                            onChange={(e) => handleStepChange(index, 'result', e.target.value)}
                            className="w-full border border-amber-300 p-2 rounded-md text-sm bg-white"
                          >
                            <option value="不合格">不合格（リベンジへ）</option>
                            <option value="合格">合格！</option>
                            <option value="結果待ち・手応えあり">結果待ち・手応えあり</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-amber-900 mb-1">
                            得点・スコア（任意）
                          </label>
                          <input
                            type="text"
                            placeholder="例: 58点 / C判定"
                            value={step.score || ''}
                            onChange={(e) => handleStepChange(index, 'score', e.target.value)}
                            className="w-full border border-amber-300 p-2 rounded-md text-sm bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          受験後の振り返り・次への反省点
                        </label>
                        <textarea
                          rows={2}
                          placeholder="例: 第3問の商業簿記で時間を使いすぎて最後まで解ききれなかった。"
                          value={step.point || ''}
                          onChange={(e) => handleStepChange(index, 'point', e.target.value)}
                          className="w-full border border-amber-300 p-2 rounded-md text-sm bg-white"
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
              className="border-2 border-dashed border-blue-400 text-blue-600 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-50 transition"
            >
              ＋ 学習フェーズを追加
            </button>

            <button
              type="button"
              onClick={addExamStep}
              className="border-2 border-dashed border-amber-500 text-amber-800 bg-amber-50/50 py-2.5 rounded-lg font-bold text-sm hover:bg-amber-100/70 transition"
            >
              ＋ 受験・合否イベントを追加
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 text-base shadow-sm"
        >
          {loading ? '送信中...' : 'この内容で合格体験談を投稿する'}
        </button>
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