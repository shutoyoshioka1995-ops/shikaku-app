'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type RoadmapStep = {
  type?: 'study' | 'exam';
  period: string;
  material?: string;
  point?: string;
  result?: string;
  score?: string;
  status?: 'not_started' | 'in_progress' | 'completed'; // 進捗用
};

type ExperienceDetail = {
  id: string;
  qualification_id: string;
  user_id?: string;
  user_name?: string;
  age_group?: string;
  industry?: string;
  job_type?: string;
  current_status?: string;
  exam_attempts?: string;
  passed_date?: string;
  daily_study_hours?: string;
  duration_days?: string;
  title?: string;
  roadmap?: RoadmapStep[];
  likes_count?: number;
  created_at?: string;
};

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

export default function ExperienceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const expId = params?.expId as string;

  const [experience, setExperience] = useState<ExperienceDetail | null>(null);
  const [qualificationName, setQualificationName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [likes, setLikes] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [favLoading, setFavLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState<boolean>(false);

  useEffect(() => {
    async function fetchExperienceDetail() {
      if (!expId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage('');

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);

          const { data: favData } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('experience_id', expId)
            .maybeSingle();

          if (favData) setIsFavorite(true);
        }

        const { data: expData, error: expError } = await supabase
          .from('experiences')
          .select('*')
          .eq('id', expId)
          .maybeSingle();

        if (expError) {
          setErrorMessage('データの取得に失敗しました: ' + expError.message);
          return;
        }

        if (!expData) {
          setErrorMessage('指定されたロードマップが存在しません。');
          return;
        }

        setExperience(expData);
        setLikes(expData.likes_count || 0);

        if (expData.qualification_id) {
          const { data: qualData } = await supabase
            .from('qualifications')
            .select('name')
            .eq('id', expData.qualification_id)
            .maybeSingle();

          if (qualData) setQualificationName(qualData.name);
        }
      } catch (err: any) {
        setErrorMessage('予期せぬエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    }

    fetchExperienceDetail();
  }, [expId]);

  // 📋 マイプランへコピーして保存
  const handleCopyToMyPlan = async () => {
    if (!currentUserId) {
      alert('マイプランを作成するにはログインが必要です。');
      router.push('/login');
      return;
    }

    if (!experience || isCopying) return;

    try {
      setIsCopying(true);

      // 各ステップに初期ステータス（not_started）を付与
      const initialRoadmap = (experience.roadmap || []).map((step) => ({
        ...step,
        status: 'not_started',
      }));

      const { error } = await supabase.from('my_plans').insert([
        {
          user_id: currentUserId,
          source_experience_id: experience.id,
          qualification_id: experience.qualification_id,
          title: `【マイプラン】${experience.title || '合格ロードマップ'}`,
          roadmap: initialRoadmap,
        },
      ]);

      if (error) {
        alert('マイプランの作成に失敗しました: ' + error.message);
      } else {
        alert('マイプランに登録しました！マイページから進捗を管理できます。');
        router.push('/mypage');
      }
    } catch (err) {
      alert('エラーが発生しました。');
    } finally {
      setIsCopying(false);
    }
  };

  const toggleFavorite = async () => {
    if (!currentUserId) {
      alert('お気に入り機能を使用するにはログインが必要です。');
      router.push('/login');
      return;
    }

    if (favLoading || !experience) return;
    setFavLoading(true);

    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUserId)
        .eq('experience_id', experience.id);

      if (!error) setIsFavorite(false);
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: currentUserId, experience_id: experience.id }]);

      if (!error) setIsFavorite(true);
    }

    setFavLoading(false);
  };

  const handleLike = async () => {
    if (!experience || hasLiked || isLiking) return;

    setIsLiking(true);
    const newLikes = likes + 1;

    setLikes(newLikes);
    setHasLiked(true);

    const { error } = await supabase
      .from('experiences')
      .update({ likes_count: newLikes })
      .eq('id', experience.id);

    if (error) {
      setLikes(likes);
      setHasLiked(false);
    }

    setIsLiking(false);
  };

  const handleDelete = async () => {
    if (!experience) return;

    const confirmed = window.confirm(
      `「${experience.title || 'このロードマップ'}」を削除してもよろしいですか？`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', experience.id);

      if (error) {
        alert('削除に失敗しました: ' + error.message);
      } else {
        alert('体験談を削除しました。');
        router.push('/mypage');
      }
    } catch (err) {
      alert('削除処理中にエラーが発生しました。');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-500">
        ロードマップを読み込み中...
      </div>
    );
  }

  if (errorMessage || !experience) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-800">
          {errorMessage || '体験談が見つかりませんでした。'}
        </h2>
        <Link href="/" className="text-blue-600 hover:underline text-sm font-medium">
          ← トップページに戻る
        </Link>
      </div>
    );
  }

  const isOwner = currentUserId && experience.user_id && currentUserId === experience.user_id;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-2 text-sm">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-600 hover:text-gray-900 hover:underline">
              🏠 トップページへ
            </Link>
            {experience.qualification_id && (
              <>
                <span className="text-gray-300">|</span>
                <Link
                  href={`/qualifications/${experience.qualification_id}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  ← {qualificationName || '資格詳細'}に戻る
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 📋 マイプランにコピーボタン */}
            <button
              onClick={handleCopyToMyPlan}
              disabled={isCopying}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
            >
              <span>📋</span>
              <span>{isCopying ? 'コピー中...' : '自分用にこのプランを保存'}</span>
            </button>

            {/* ⭐ お気に入りボタン */}
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition border flex items-center gap-1 ${
                isFavorite
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{isFavorite ? '★' : '☆'}</span>
              <span>{isFavorite ? 'お気に入り済み' : 'お気に入り'}</span>
            </button>

            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition"
              >
                {isDeleting ? '削除中...' : '🗑️ 削除'}
              </button>
            )}
          </div>
        </div>

        {/* 1. タイトル & 資格バッジ & いいね */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-start gap-4">
            {qualificationName && (
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                {qualificationName}
              </span>
            )}
            
            <button
              onClick={handleLike}
              disabled={hasLiked || isLiking}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-sm border ${
                hasLiked
                  ? 'bg-pink-50 text-pink-600 border-pink-300 cursor-default'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:scale-95'
              }`}
            >
              <span>{hasLiked ? '❤️' : '👍'}</span>
              <span>{hasLiked ? '参考になった！' : '参考になった'}</span>
              <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-full text-[11px] ml-0.5">
                {likes}
              </span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug">
            {experience.title || '無題のロードマップ'}
          </h1>
          <p className="text-xs text-gray-400">
            投稿者: {experience.user_name || '匿名'}
          </p>
        </div>

        {/* 2. プロフィール & 受験条件 */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-gray-800 border-b pb-2 flex items-center gap-2">
            👤 合格者のプロフィール & 受験データ
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-xs text-gray-500 mb-0.5">年代</span>
              <span className="font-semibold text-gray-800">{experience.age_group || '未設定'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-xs text-gray-500 mb-0.5">業界・業種</span>
              <span className="font-semibold text-gray-800">{experience.industry || '未設定'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-xs text-gray-500 mb-0.5">職種・担当業務</span>
              <span className="font-semibold text-gray-800">{experience.job_type || '未設定'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-xs text-gray-500 mb-0.5">受験回数</span>
              <span className="font-semibold text-purple-700">{experience.exam_attempts || '未設定'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-xs text-gray-500 mb-0.5">最終合格日 / 時期</span>
              <span className="font-semibold text-green-700">{experience.passed_date || '未設定'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-xs text-gray-500 mb-0.5">スタート時の状況</span>
              <span className="font-semibold text-gray-800">{experience.current_status || '未設定'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="block text-xs text-gray-500 mb-0.5">1日の平均勉強時間</span>
              <span className="font-semibold text-gray-800">{experience.daily_study_hours || '未設定'}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 col-span-2 sm:col-span-1">
              <span className="block text-xs text-gray-500 mb-0.5">合格までの総期間</span>
              <span className="font-semibold text-blue-600">{experience.duration_days || '未設定'}</span>
            </div>
          </div>
        </div>

        {/* 3. 学習ロードマップ */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="font-bold text-lg text-gray-800 border-b pb-2 flex items-center gap-2">
            🗺️ 合格までの学習ロードマップ & 受験履歴
          </h2>

          {Array.isArray(experience.roadmap) && experience.roadmap.length > 0 ? (
            <div className="relative border-l-2 border-blue-500 ml-3 pl-6 space-y-8">
              {experience.roadmap.map((step, idx) => {
                const isExam = step.type === 'exam';
                const youtubeId = step.material ? extractYouTubeId(step.material) : null;

                return (
                  <div key={idx} className="relative group">
                    <div
                      className={`absolute -left-[35px] top-0 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${
                        isExam ? 'bg-amber-600' : 'bg-blue-600'
                      }`}
                    >
                      {isExam ? '📝' : idx + 1}
                    </div>

                    {!isExam && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
                        <div className="font-bold text-blue-700 text-sm bg-blue-50 px-2.5 py-1 rounded inline-block">
                          ⏱️ 期間: {step.period || '未設定'}
                        </div>

                        {step.material && (
                          <div>
                            <span className="block text-xs font-bold text-gray-500 mb-1">📚 使用した教材・動画</span>
                            {youtubeId ? (
                              <div className="space-y-2 mt-1">
                                <p className="text-xs text-gray-500 break-all bg-white p-2 border rounded">
                                  🔗 <a href={step.material} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{step.material}</a>
                                </p>
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm bg-black">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${youtubeId}`}
                                    title="YouTube video player"
                                    className="absolute top-0 left-0 w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-800 font-medium bg-white p-2.5 border rounded-md whitespace-pre-wrap">
                                {step.material}
                              </p>
                            )}
                          </div>
                        )}

                        {step.point && (
                          <div>
                            <span className="block text-xs font-bold text-gray-500 mb-1">💡 学習のポイント・工夫</span>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-white p-2.5 border rounded-md">
                              {step.point}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {isExam && (
                      <div className="bg-amber-50/80 border-2 border-amber-300 rounded-lg p-4 space-y-3 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2">
                          <span className="font-extrabold text-amber-900 text-sm">
                            📝 本番受験: {step.period || '時期未設定'}
                          </span>
                          <div className="flex items-center gap-2">
                            {step.score && (
                              <span className="text-xs bg-white text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-200">
                                得点: {step.score}
                              </span>
                            )}
                            <span
                              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                                step.result === '合格'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {step.result || '結果未設定'}
                            </span>
                          </div>
                        </div>

                        {step.point && (
                          <div>
                            <span className="block text-xs font-bold text-amber-800 mb-1">
                              🔍 受験後の振り返り・次への反省点
                            </span>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed bg-white p-2.5 border border-amber-200 rounded-md">
                              {step.point}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="relative pt-2">
                <div className="absolute -left-[37px] top-4 bg-yellow-500 text-white text-sm w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-white shadow">
                  🏆
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl p-5 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-yellow-800 tracking-wider uppercase block">
                    GOAL / 合格達成
                  </span>
                  <div className="text-lg sm:text-xl font-extrabold text-amber-900">
                    {experience.passed_date ? `${experience.passed_date} ` : ''}
                    {qualificationName || '資格'} 合格！
                  </div>
                  {experience.exam_attempts && (
                    <p className="text-xs text-amber-700 font-medium">
                      受験回数: {experience.exam_attempts}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">ロードマップの詳細ステップはありません。</p>
          )}
        </div>

        <div className="bg-white border rounded-xl p-6 text-center shadow-sm space-y-3">
          <p className="text-sm font-bold text-gray-700">このロードマップは役に立ちましたか？</p>
          <button
            onClick={handleLike}
            disabled={hasLiked || isLiking}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-extrabold transition shadow-md ${
              hasLiked
                ? 'bg-pink-100 text-pink-700 cursor-default'
                : 'bg-pink-500 text-white hover:bg-pink-600 active:scale-95'
            }`}
          >
            <span>{hasLiked ? '❤️' : '👍'}</span>
            <span>{hasLiked ? '「参考になった！」を送信しました' : '参考になった！'}</span>
            <span className="bg-white/30 text-white px-2 py-0.5 rounded-full text-xs">
              {likes}
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}