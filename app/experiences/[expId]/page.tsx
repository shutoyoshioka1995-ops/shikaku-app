'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';
import RoadmapTimeline from '@/components/RoadmapTimeline';
import LikeButton from '@/components/LikeButton';
import AuthorSnsLink from '@/components/AuthorSnsLink';
import SharePostedModal from '@/components/SharePostedModal';
import { addUniqueLike, loadLikedExperienceIds } from '@/lib/likes';
import { loginUrl } from '@/lib/loginNext';
import { pickSnsUrl } from '@/lib/snsUrl';
import { canonicalNameForId } from '@/lib/qualificationMerge';

type RoadmapStep = {
  type?: 'study' | 'exam';
  period: string;
  material?: string;
  textbook?: string;
  textbook_url?: string;
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
  sns_url?: string;
  twitter_url?: string;
  blog_url?: string;
};

export default function ExperienceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const expId = (params?.expId || params?.id) as string;

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePageUrl, setSharePageUrl] = useState('');

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
        if (user) {
          const liked = await loadLikedExperienceIds([expId]);
          setHasLiked(liked.has(expId));
        }

        if (expData.qualification_id) {
          const { data: allQuals } = await supabase.from('qualifications').select('id, name');
          if (allQuals) {
            setQualificationName(canonicalNameForId(allQuals, expData.qualification_id, '資格'));
          }
        }
      } catch (err: any) {
        setErrorMessage('予期せぬエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    }

    fetchExperienceDetail();
  }, [expId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSharePageUrl(window.location.origin + `/experiences/${expId}`);
    const params = new URLSearchParams(window.location.search);
    if (params.get('posted') === '1') {
      setShowShareModal(true);
    }
  }, [expId]);

  const closeShareModal = () => {
    setShowShareModal(false);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('posted');
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  // 📋 マイプランへコピーして保存
  const handleCopyToMyPlan = async () => {
    if (!currentUserId) {
      router.push(loginUrl(`/experiences/${expId}`));
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
      router.push(loginUrl(`/experiences/${expId}`));
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
    const previousLikes = likes;

    try {
      const result = await addUniqueLike(experience.id, previousLikes);
      if (result.needsLogin) {
        router.push(loginUrl(`/experiences/${expId}`));
        return;
      }
      setHasLiked(true);
      if (!result.already) setLikes(result.next);
    } catch (err) {
      setHasLiked(false);
      setLikes(previousLikes);
    } finally {
      setIsLiking(false);
    }
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
        <Link href="/" className="text-navy hover:underline text-sm font-medium">
          ← トップページに戻る
        </Link>
      </div>
    );
  }

  const isOwner = currentUserId && experience.user_id && currentUserId === experience.user_id;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <SharePostedModal
        open={showShareModal}
        qualificationName={qualificationName}
        durationDays={experience.duration_days}
        dailyStudyHours={experience.daily_study_hours}
        pageUrl={sharePageUrl}
        onClose={closeShareModal}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="text-gray-600 hover:text-gray-900 hover:underline">
              トップページへ
            </Link>
            {experience.qualification_id && (
              <>
                <span className="text-gray-300">|</span>
                <Link
                  href={`/qualifications/${experience.qualification_id}`}
                  className="font-medium text-navy hover:underline"
                >
                  ← {qualificationName || '資格詳細'}に戻る
                </Link>
              </>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              onClick={handleCopyToMyPlan}
              disabled={isCopying}
              className="flex min-h-11 w-full items-center justify-center gap-1 rounded-lg bg-navy px-3 text-xs font-bold text-white transition hover:bg-navy-hover sm:w-auto"
            >
              <span>{isCopying ? 'コピー中...' : '自分用にこのプランを保存'}</span>
            </button>

            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className={`flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border px-3 text-xs font-bold transition sm:w-auto ${
                isFavorite
                  ? 'border-navy bg-navy-soft text-navy'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{isFavorite ? 'お気に入り済み' : 'お気に入り'}</span>
            </button>

            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex min-h-11 w-full items-center justify-center rounded-lg border border-red-200 px-3 text-xs font-bold text-red-500 hover:bg-red-50 sm:w-auto"
              >
                {isDeleting ? '削除中...' : '削除'}
              </button>
            )}
          </div>
        </div>

        {/* 1. タイトル & 資格バッジ & いいね */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-start gap-4">
            {qualificationName && (
              <span className="inline-block bg-navy-soft text-navy text-xs font-bold px-3 py-1 rounded-full">
                {qualificationName}
              </span>
            )}
            
            <LikeButton
              variant="header"
              count={likes}
              liked={hasLiked}
              loading={isLiking}
              onLike={handleLike}
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug">
            {experience.title || '無題のロードマップ'}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <UserAvatar
              seed={experience.user_id || experience.user_name || experience.id}
              alt={experience.user_name || '匿名'}
              size={28}
            />
            <span>投稿者: {experience.user_name || '匿名'}</span>
            <AuthorSnsLink url={pickSnsUrl(experience)} />
          </p>
        </div>

        {/* 2. プロフィール & 受験条件 */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-gray-800 border-b pb-2 flex items-center gap-2">
            合格者のプロフィール・受験データ
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
              <span className="font-semibold text-navy">{experience.passed_date || '未設定'}</span>
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
              <span className="font-semibold text-navy">{experience.duration_days || '未設定'}</span>
            </div>
          </div>
        </div>

        {/* 3. 学習ロードマップ */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
          <h2 className="font-bold text-lg text-gray-800 border-b pb-2 flex items-center gap-2">
            合格までの学習ロードマップ・受験履歴
          </h2>

          <RoadmapTimeline
            steps={experience.roadmap || []}
            qualificationName={qualificationName}
            passedDate={experience.passed_date}
            examAttempts={experience.exam_attempts}
          />
        </div>

        <div className="bg-white border rounded-xl p-6 text-center shadow-sm space-y-3">
          <p className="text-sm font-bold text-gray-700">このロードマップは役に立ちましたか？</p>
          <LikeButton
            variant="cta"
            count={likes}
            liked={hasLiked}
            loading={isLiking}
            onLike={handleLike}
          />
        </div>
      </div>
    </main>
  );
}