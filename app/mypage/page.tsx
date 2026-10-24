'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';
import { loadProfile, saveProfile, uploadAvatar } from '@/lib/profile';
import { normalizeSnsUrl } from '@/lib/snsUrl';
import { AGE_GROUP_OPTIONS, INDUSTRY_OPTIONS, JOB_TYPE_OPTIONS } from '@/lib/profileOptions';
import { mergeQualifications } from '@/lib/qualificationMerge';

type RoadmapStep = {
  type?: 'study' | 'exam';
  period: string;
  material?: string;
  point?: string;
  result?: string;
  score?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
};

type Experience = {
  id: string;
  qualification_id: string;
  title?: string;
  user_name?: string;
  passed_date?: string;
  created_at?: string;
  likes_count?: number;
  qualification_name?: string;
  avatar_url?: string;
};

type MyPlan = {
  id: string;
  qualification_id: string;
  source_experience_id?: string;
  title: string;
  roadmap: RoadmapStep[];
  start_date?: string;
  exam_date?: string;
  created_at: string;
  qualification_name?: string;
};

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'myPlans' | 'myPosts' | 'favorites'>('myPlans');
  const [myPlans, setMyPlans] = useState<MyPlan[]>([]);
  const [myPosts, setMyPosts] = useState<Experience[]>([]);
  const [favorites, setFavorites] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [snsUrl, setSnsUrl] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [industry, setIndustry] = useState('');
  const [jobType, setJobType] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  // 日付編集用ステート
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editExamDate, setEditExamDate] = useState('');

  useEffect(() => {
    async function fetchMyData() {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        setUserEmail(user.email || '');
        setCurrentUserId(user.id);

        const profile = await loadProfile(user.id, (user.user_metadata || {}) as Record<string, unknown>);
        setDisplayName(profile.user_name);
        setSnsUrl(profile.sns_url);
        setAgeGroup(profile.age_group);
        setIndustry(profile.industry);
        setJobType(profile.job_type);
        setAvatarUrl(profile.avatar_url);
        setAvatarPreview(profile.avatar_url);

        const { data: qualData } = await supabase.from('qualifications').select('id, name');
        const qualMap = new Map<string, string>();
        mergeQualifications(qualData || []).forEach((group) => {
          group.aliasIds.forEach((id) => qualMap.set(id, group.name));
        });

        // 1. マイロードマップの取得
        const { data: plansData } = await supabase
          .from('my_plans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (plansData) {
          setMyPlans(
            plansData.map((p) => ({
              ...p,
              qualification_name: qualMap.get(p.qualification_id) || '資格',
            }))
          );
        }

        // 2. 投稿したロードマップの取得
        const { data: postsData } = await supabase
          .from('experiences')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (postsData) {
          setMyPosts(
            postsData.map((p) => ({
              ...p,
              qualification_name: qualMap.get(p.qualification_id) || '資格',
            }))
          );
          if (!profile.user_name && postsData[0]?.user_name) {
            setDisplayName(postsData[0].user_name);
          }
          if (!profile.avatar_url && postsData[0]?.avatar_url) {
            setAvatarUrl(postsData[0].avatar_url);
            setAvatarPreview(postsData[0].avatar_url);
          }
        }

        // 3. お気に入り一覧の取得
        const { data: favsData } = await supabase
          .from('favorites')
          .select('experience_id, experiences(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (favsData) {
          const favExperiences: Experience[] = favsData
            .map((item: any) => item.experiences)
            .filter(Boolean)
            .map((p: any) => ({
              ...p,
              qualification_name: qualMap.get(p.qualification_id) || '資格',
            }));

          setFavorites(favExperiences);
        }
      } catch (err) {
        console.error('マイページ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyData();
  }, [router]);

  // ステップ進捗の切り替え
  const handleToggleStepStatus = async (planId: string, stepIndex: number) => {
    const targetPlan = myPlans.find((p) => p.id === planId);
    if (!targetPlan) return;

    const currentRoadmap = [...targetPlan.roadmap];
    const currentStatus = currentRoadmap[stepIndex].status || 'not_started';

    const nextStatusMap: Record<string, 'not_started' | 'in_progress' | 'completed'> = {
      not_started: 'in_progress',
      in_progress: 'completed',
      completed: 'not_started',
    };

    currentRoadmap[stepIndex].status = nextStatusMap[currentStatus];

    setMyPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, roadmap: currentRoadmap } : p))
    );

    await supabase.from('my_plans').update({ roadmap: currentRoadmap }).eq('id', planId);
  };

  // 日程保存処理
  const handleSaveDates = async (planId: string) => {
    setMyPlans((prev) =>
      prev.map((p) =>
        p.id === planId ? { ...p, start_date: editStartDate, exam_date: editExamDate } : p
      )
    );

    await supabase
      .from('my_plans')
      .update({ start_date: editStartDate, exam_date: editExamDate })
      .eq('id', planId);

    setEditingPlanId(null);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(avatarUrl);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setProfileMessage('画像ファイルを選択してください。');
      e.target.value = '';
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setProfileMessage('');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || profileSaving) return;

    try {
      setProfileSaving(true);
      setProfileMessage('');

      let nextAvatarUrl = avatarUrl;
      if (avatarFile) {
        nextAvatarUrl = await uploadAvatar(currentUserId, avatarFile);
        setAvatarUrl(nextAvatarUrl);
        if (avatarPreview.startsWith('blob:')) {
          URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(nextAvatarUrl);
        setAvatarFile(null);
      }

      await saveProfile(currentUserId, {
        user_name: displayName,
        avatar_url: nextAvatarUrl,
        sns_url: normalizeSnsUrl(snsUrl),
        age_group: ageGroup,
        industry,
        job_type: jobType,
      });
      setProfileMessage('プロフィールを保存しました。');
    } catch (err: any) {
      setProfileMessage('保存に失敗しました: ' + (err?.message || '不明なエラー'));
    } finally {
      setProfileSaving(false);
    }
  };

  // マイプラン削除処理
  const handleDeleteMyPlan = async (planId: string, event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (deletingPlanId) return;
    if (!window.confirm('このマイロードマップを削除してもよろしいですか？')) return;

    try {
      setDeletingPlanId(planId);

      let query = supabase.from('my_plans').delete().eq('id', planId);
      if (currentUserId) query = query.eq('user_id', currentUserId);
      const { data, error } = await query.select('id');

      if (error) {
        alert('削除に失敗しました: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        alert('削除できませんでした。権限またはデータが見つかりません。');
        return;
      }

      setMyPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch (err) {
      alert('削除処理中にエラーが発生しました。');
    } finally {
      setDeletingPlanId(null);
    }
  };

  // 受験日までの残り日数計算
  const calculateDaysLeft = (examDateStr?: string) => {
    if (!examDateStr) return null;
    const examDate = new Date(examDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-500">
        マイページを読み込み中...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ヘッダー情報 */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-navy">マイページ</h1>
            <Link
              href="/experiences/new"
              className="bg-navy text-white font-bold text-xs px-3.5 py-2 rounded-lg hover:bg-navy-hover transition"
            >
              ＋ 新規投稿する
            </Link>
          </div>
          <p className="text-xs text-gray-500">ログイン中: {userEmail}</p>
        </div>

        <form onSubmit={handleSaveProfile} className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-extrabold text-navy border-b pb-2">プロフィール設定</h2>
          <div className="flex items-start gap-4">
            <UserAvatar
              avatarUrl={avatarPreview || avatarUrl}
              seed={currentUserId || displayName || userEmail}
              alt={displayName || 'ユーザー'}
              size={64}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ユーザー名</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="表示名"
                  className="w-full border p-2 rounded-md text-sm"
                  disabled={profileSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">アイコン画像</label>
                <label className="inline-flex min-h-10 cursor-pointer items-center rounded-md border border-navy/15 bg-navy-soft px-3 text-xs font-bold text-navy hover:bg-navy-soft">
                  画像を選択
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    disabled={profileSaving}
                    className="sr-only"
                  />
                </label>
                <p className="mt-1 text-[11px] text-gray-500">
                  {avatarFile ? `選択中: ${avatarFile.name}` : '端末から画像を選んで保存するとアイコンに反映されます。'}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                X（旧Twitter）アカウントまたはブログURL（任意）
              </label>
              <input
                type="text"
                inputMode="url"
                value={snsUrl}
                onChange={(e) => setSnsUrl(e.target.value)}
                placeholder="例: @username / https://x.com/username"
                className="w-full border p-2 rounded-md text-sm"
                disabled={profileSaving}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">年代</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full border p-2 rounded-md text-sm bg-white"
                disabled={profileSaving}
              >
                <option value="">未設定</option>
                {ageGroup && !(AGE_GROUP_OPTIONS as readonly string[]).includes(ageGroup) && (
                  <option value={ageGroup}>{ageGroup}</option>
                )}
                {AGE_GROUP_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">業種・業界</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full border p-2 rounded-md text-sm bg-white"
                disabled={profileSaving}
              >
                <option value="">未設定</option>
                {industry && !(INDUSTRY_OPTIONS as readonly string[]).includes(industry) && (
                  <option value={industry}>{industry}</option>
                )}
                {INDUSTRY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">職種・担当業務</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full border p-2 rounded-md text-sm bg-white"
                disabled={profileSaving}
              >
                <option value="">未設定</option>
                {jobType && !(JOB_TYPE_OPTIONS as readonly string[]).includes(jobType) && (
                  <option value={jobType}>{jobType}</option>
                )}
                {JOB_TYPE_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            {profileMessage && <p className="text-xs font-bold text-navy">{profileMessage}</p>}
            <button
              type="submit"
              disabled={profileSaving}
              className="ml-auto bg-navy text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-navy-hover transition disabled:opacity-50"
            >
              {profileSaving ? 'アップロード中...' : 'プロフィールを保存'}
            </button>
          </div>
        </form>

        {/* タブ切り替え（名称変更済み） */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('myPlans')}
            className={`py-3 px-5 font-bold text-sm border-b-2 whitespace-nowrap transition ${
              activeTab === 'myPlans'
                ? 'border-navy text-navy'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            マイロードマップ ({myPlans.length})
          </button>
          <button
            onClick={() => setActiveTab('myPosts')}
            className={`py-3 px-5 font-bold text-sm border-b-2 whitespace-nowrap transition ${
              activeTab === 'myPosts'
                ? 'border-navy text-navy'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            投稿したロードマップ ({myPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`py-3 px-5 font-bold text-sm border-b-2 whitespace-nowrap transition ${
              activeTab === 'favorites'
                ? 'border-navy text-navy'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            お気に入り ({favorites.length})
          </button>
        </div>

        {/* 1. マイロードマップ一覧 */}
        {activeTab === 'myPlans' && (
          <div className="space-y-6">
            {myPlans.length > 0 ? (
              myPlans.map((plan) => {
                const totalSteps = plan.roadmap?.length || 0;
                const completedSteps = (plan.roadmap || []).filter(
                  (s) => s.status === 'completed'
                ).length;
                const progressPercent =
                  totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

                const daysLeft = calculateDaysLeft(plan.exam_date);

                return (
                  <div key={plan.id} className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                    {/* カードヘッダー */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-navy-soft text-navy text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {plan.qualification_name}
                          </span>
                          {/* 🔗 元の投稿へのリンク */}
                          {plan.source_experience_id && (
                            <Link
                              href={`/experiences/${plan.source_experience_id}`}
                              className="text-xs text-navy hover:underline font-bold bg-navy-soft px-2 py-0.5 rounded"
                            >
                              元のロードマップを見る
                            </Link>
                          )}
                        </div>
                        <h3 className="font-extrabold text-lg text-gray-900">{plan.title}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => handleDeleteMyPlan(plan.id, event)}
                        disabled={deletingPlanId === plan.id}
                        className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-100 px-2 py-1 rounded disabled:opacity-50"
                      >
                        {deletingPlanId === plan.id ? '削除中...' : '削除'}
                      </button>
                    </div>

                    {/* 📅 学習日程・カウントダウン表示エリア */}
                    <div className="bg-navy-soft border border-navy/15 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="text-xs space-y-1 text-gray-700">
                          <p>学習開始日: <span className="font-bold">{plan.start_date || '未設定'}</span></p>
                          <p>受験予定日: <span className="font-bold text-navy">{plan.exam_date || '未設定'}</span></p>
                        </div>

                        {daysLeft !== null && (
                          <div className={`px-3 py-1.5 rounded-lg font-extrabold text-xs shadow-sm ${
                            daysLeft < 0 ? 'bg-gray-200 text-gray-600' : daysLeft <= 14 ? 'bg-navy text-white' : 'bg-navy-soft text-navy'
                          }`}>
                            {daysLeft < 0 ? '受験日終了' : daysLeft === 0 ? '本日が受験日です' : `受験まであと ${daysLeft} 日`}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setEditingPlanId(plan.id);
                            setEditStartDate(plan.start_date || '');
                            setEditExamDate(plan.exam_date || '');
                          }}
                          className="text-xs font-bold text-navy hover:underline"
                        >
                          日程を設定・変更
                        </button>
                      </div>

                      {/* 日程編集フォーム */}
                      {editingPlanId === plan.id && (
                        <div className="bg-white p-3 border rounded-lg space-y-3 pt-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">学習開始日</label>
                              <input
                                type="date"
                                value={editStartDate}
                                onChange={(e) => setEditStartDate(e.target.value)}
                                className="w-full border p-2 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">目標受験日</label>
                              <input
                                type="date"
                                value={editExamDate}
                                onChange={(e) => setEditExamDate(e.target.value)}
                                className="w-full border p-2 rounded text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingPlanId(null)}
                              className="text-xs text-gray-500 border px-3 py-1 rounded"
                            >
                              キャンセル
                            </button>
                            <button
                              onClick={() => handleSaveDates(plan.id)}
                              className="text-xs bg-navy text-white font-bold px-3 py-1 rounded"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 進捗バー */}
                    <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>学習進捗度</span>
                        <span>{progressPercent}% ({completedSteps} / {totalSteps} ステップ完了)</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-navy h-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* 各ステップ一覧 */}
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-bold text-gray-500">▼ ステップをタップして進捗を切り替え</p>
                      {plan.roadmap?.map((step, idx) => {
                        const status = step.status || 'not_started';

                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleStepStatus(plan.id, idx)}
                            className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-start gap-3 ${
                              status === 'completed'
                                ? 'bg-navy-soft border-navy/20 text-gray-500 line-through'
                                : status === 'in_progress'
                                ? 'bg-navy-soft border-navy/30 text-gray-900 font-medium'
                                : 'bg-white border-gray-200 text-gray-800'
                            }`}
                          >
                            <span className="text-base select-none">
                              {status === 'completed' ? '完了' : status === 'in_progress' ? '進行中' : '未着手'}
                            </span>
                            <div className="space-y-0.5 flex-1">
                              <div className="font-bold">
                                ステップ {idx + 1}: {step.period}
                                {status === 'in_progress' && (
                                  <span className="ml-2 text-[10px] bg-navy text-white px-1.5 py-0.5 rounded no-underline">
                                    学習中
                                  </span>
                                )}
                              </div>
                              {step.material && <p className="text-gray-600">{step.material}</p>}
                              {step.point && <p className="text-gray-500">{step.point}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border rounded-xl p-8 text-center text-sm text-gray-500 space-y-3">
                <p>保存されているマイロードマップはまだありません。</p>
                <p className="text-xs text-gray-400">
                  体験談詳細ページにある「自分用にこのプランを保存」ボタンを押すと、こちらにマイロードマップとして保存して学習進捗を管理できます。
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. 投稿したロードマップ一覧 */}
        {activeTab === 'myPosts' && (
          <div className="space-y-4">
            {myPosts.length > 0 ? (
              myPosts.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.id}`}
                  className="block bg-white border rounded-xl p-5 hover:border-navy hover:shadow-md transition space-y-2 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="bg-navy-soft text-navy text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {exp.qualification_name}
                    </span>
                    <span className="text-xs text-navy font-bold">参考 {exp.likes_count || 0}</span>
                  </div>
                  <h3 className="font-bold text-base text-gray-900 group-hover:text-navy transition">
                    {exp.title || '無題のロードマップ'}
                  </h3>
                  <div className="text-xs text-gray-400">
                    投稿日: {exp.created_at ? new Date(exp.created_at).toLocaleDateString() : '不明'}
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-white border rounded-xl p-8 text-center text-sm text-gray-500 space-y-3">
                <p>まだ投稿したロードマップはありません。</p>
                <Link
                  href="/experiences/new"
                  className="inline-block bg-navy text-white font-bold text-xs px-4 py-2 rounded-lg"
                >
                  体験談を投稿してみる
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 3. お気に入り一覧 */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {favorites.length > 0 ? (
              favorites.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.id}`}
                  className="block bg-white border rounded-xl p-5 hover:border-navy hover:shadow-md transition space-y-2 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="bg-navy-soft text-navy text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {exp.qualification_name}
                    </span>
                    <span className="text-xs text-navy font-bold">参考 {exp.likes_count || 0}</span>
                  </div>
                  <h3 className="font-bold text-base text-gray-900 group-hover:text-navy transition">
                    {exp.title || '無題のロードマップ'}
                  </h3>
                  <div className="text-xs text-gray-500">
                    投稿者: {exp.user_name || '匿名'}
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-white border rounded-xl p-8 text-center text-sm text-gray-500">
                お気に入り保存したロードマップはまだありません。
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}