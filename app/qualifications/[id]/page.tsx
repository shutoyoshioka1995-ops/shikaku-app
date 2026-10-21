'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import LikeButton from '@/components/LikeButton';
import { incrementExperienceLike } from '@/lib/incrementLike';

type Experience = {
  id: string;
  qualification_id: string;
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
  likes_count?: number;
  created_at?: string;
};

type Qualification = {
  id: string;
  name: string;
  description?: string;
};

export default function QualificationDetailPage() {
  const params = useParams();
  const qualId = params?.id as string;

  const [qualification, setQualification] = useState<Qualification | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [selectedAttempts, setSelectedAttempts] = useState('すべて');
  const [selectedStatus, setSelectedStatus] = useState('すべて');
  const [selectedAge, setSelectedAge] = useState('すべて');
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likingId, setLikingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!qualId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage('');

        const { data: qualData, error: qualError } = await supabase
          .from('qualifications')
          .select('*')
          .eq('id', qualId)
          .maybeSingle();

        if (qualError) {
          console.error('資格情報取得エラー:', qualError);
          setErrorMessage('資格情報の取得に失敗しました。');
          return;
        }

        if (!qualData) {
          setErrorMessage('指定された資格が見つかりませんでした。');
          return;
        }

        setQualification(qualData);

        const { data: expData, error: expError } = await supabase
          .from('experiences')
          .select('*')
          .eq('qualification_id', qualId)
          .order('created_at', { ascending: false });

        if (expError) {
          console.error('体験談一覧取得エラー:', expError);
        } else {
          setExperiences(expData || []);
        }
      } catch (err: any) {
        console.error('予期せぬエラー:', err);
        setErrorMessage('予期せぬエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [qualId]);

  const filteredExperiences = experiences.filter((exp) => {
    if (selectedAttempts !== 'すべて') {
      if (selectedAttempts === '一発合格' && !exp.exam_attempts?.includes('1回目')) {
        return false;
      }
      if (selectedAttempts === '複数回受験' && exp.exam_attempts?.includes('1回目')) {
        return false;
      }
    }

    if (selectedStatus !== 'すべて') {
      if (exp.current_status !== selectedStatus) {
        return false;
      }
    }

    if (selectedAge !== 'すべて') {
      if (exp.age_group !== selectedAge) {
        return false;
      }
    }

    return true;
  });

  const likeCountOf = (exp: Experience) => likeCounts[exp.id] ?? exp.likes_count ?? 0;

  const handleLike = async (exp: Experience) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-500">
        データを読み込み中...
      </div>
    );
  }

  if (errorMessage || !qualification) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-800">
          {errorMessage || '資格が見つかりませんでした。'}
        </h2>
        <Link href="/" className="text-blue-600 hover:underline text-sm font-medium">
          ← トップページに戻る
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
            🏠 トップページへ戻る
          </Link>
        </div>

        <div className="bg-white border rounded-xl p-6 sm:p-8 shadow-sm space-y-3">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
            資格詳細
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {qualification.name}
          </h1>
          {qualification.description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {qualification.description}
            </p>
          )}
          <div className="pt-2 flex justify-between items-center text-xs text-gray-500 border-t">
            <span>全 {experiences.length} 件の体験談</span>
            <Link
              href={`/experiences/new?qualification_id=${qualification.id}`}
              className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm"
            >
              ＋ この資格の体験談を投稿する
            </Link>
          </div>
        </div>

        {/* 🔍 条件絞り込みパネル */}
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
              🔍 条件で絞り込む
            </h3>
            {(selectedAttempts !== 'すべて' || selectedStatus !== 'すべて' || selectedAge !== 'すべて') && (
              <button
                onClick={() => {
                  setSelectedAttempts('すべて');
                  setSelectedStatus('すべて');
                  setSelectedAge('すべて');
                }}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                フィルターをリセット
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-gray-600 font-bold mb-1">受験回数</label>
              <select
                value={selectedAttempts}
                onChange={(e) => setSelectedAttempts(e.target.value)}
                className="w-full border p-2 rounded-md bg-gray-50 focus:bg-white"
              >
                <option value="すべて">すべて</option>
                <option value="一発合格">1回目（一発合格のみ）</option>
                <option value="複数回受験">複数回受験（リベンジ組）</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1">スタート時の状況</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border p-2 rounded-md bg-gray-50 focus:bg-white"
              >
                <option value="すべて">すべて</option>
                <option value="初学者（知識ゼロ）">初学者（知識ゼロ）</option>
                <option value="関連資格を保持">関連資格を保持</option>
                <option value="実務経験あり">実務経験あり</option>
                <option value="再受験（独学経験あり）">再受験（独学経験あり）</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-600 font-bold mb-1">年代</label>
              <select
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                className="w-full border p-2 rounded-md bg-gray-50 focus:bg-white"
              >
                <option value="すべて">すべて</option>
                <option value="10代">10代</option>
                <option value="20代">20代</option>
                <option value="30代">30代</option>
                <option value="40代">40代</option>
                <option value="50代〜">50代〜</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">
              📖 合格ロードマップ一覧 ({filteredExperiences.length}件)
            </h2>
          </div>

          {filteredExperiences.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredExperiences.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition space-y-3 group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-extrabold text-base sm:text-lg text-gray-900 group-hover:text-blue-600 transition leading-snug">
                      {exp.title || '無題のロードマップ'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <LikeButton
                        count={likeCountOf(exp)}
                        liked={likedIds.has(exp.id)}
                        loading={likingId === exp.id}
                        onLike={() => handleLike(exp)}
                      />
                      {exp.passed_date && (
                        <span className="text-xs bg-green-100 text-green-800 font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                          {exp.passed_date} 合格
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="bg-gray-100 px-2.5 py-1 rounded">
                      👤 {exp.user_name || '匿名'} ({exp.age_group || '未設定'})
                    </span>
                    {exp.industry && (
                      <span className="bg-gray-100 px-2.5 py-1 rounded">
                        🏢 {exp.industry}
                      </span>
                    )}
                    {exp.job_type && (
                      <span className="bg-gray-100 px-2.5 py-1 rounded">
                        💼 {exp.job_type}
                      </span>
                    )}
                    {exp.exam_attempts && (
                      <span className="bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded border border-purple-100">
                        🎯 {exp.exam_attempts}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1 border-t border-gray-100">
                    <span>⏱️ 1日: <strong className="text-gray-800">{exp.daily_study_hours || '未設定'}</strong></span>
                    <span>⏳ 期間: <strong className="text-blue-600">{exp.duration_days || '未設定'}</strong></span>
                    <span>🔰 開始時: <strong className="text-gray-800">{exp.current_status || '未設定'}</strong></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white border rounded-xl p-8 text-center space-y-3">
              <p className="text-gray-500 text-sm">
                選択した条件に該当する体験談はありません。
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}