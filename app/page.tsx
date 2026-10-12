'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Qualification = {
  id: string;
  name: string;
  description?: string;
};

type Experience = {
  id: string;
  qualification_id: string;
  user_name?: string;
  age_group?: string;
  industry?: string;
  job_type?: string;
  passed_date?: string;
  daily_study_hours?: string;
  duration_days?: string;
  title?: string;
  likes_count?: number;
  qualification_name?: string;
  created_at?: string;
};

export default function HomePage() {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [popularExperiences, setPopularExperiences] = useState<Experience[]>([]);
  const [recentExperiences, setRecentExperiences] = useState<Experience[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1. 資格マスター一覧の取得
        const { data: qualData } = await supabase
          .from('qualifications')
          .select('*')
          .order('name');
        
        const qualList = qualData || [];
        setQualifications(qualList);

        // 資格ID -> 資格名のマッピング辞書を作成
        const qualMap = new Map<string, string>();
        qualList.forEach((q) => qualMap.set(q.id, q.name));

        // 2. 体験談データを全件取得（安全な直接取得）
        const { data: expData, error: expError } = await supabase
          .from('experiences')
          .select('*')
          .order('created_at', { ascending: false });

        if (expError) {
          console.error('体験談取得エラー:', expError);
        } else if (expData) {
          // 資格名を補完
          const formattedExps: Experience[] = expData.map((exp: any) => ({
            ...exp,
            qualification_name: qualMap.get(exp.qualification_id) || '資格',
          }));

          // 人気順（いいね数降順）TOP3
          const sortedByLikes = [...formattedExps].sort(
            (a, b) => (b.likes_count || 0) - (a.likes_count || 0)
          );
          setPopularExperiences(sortedByLikes.slice(0, 3));

          // 新着順（最新5件）
          setRecentExperiences(formattedExps.slice(0, 5));
        }

      } catch (err) {
        console.error('予期せぬエラー:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // リアルタイム検索フィルター
  const filteredQualifications = qualifications.filter((q) =>
    q.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* ヒーローセクション */}
        <section className="text-center space-y-6 pt-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            資格合格ロードマップ検索
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            リアルな合格体験談・学習ロードマップから、あなたに最適な勉強法を見つけよう
          </p>

          <div className="max-w-xl mx-auto space-y-3">
            <input
              type="text"
              placeholder="🔍 資格名で検索（例: 基本情報、簿記、AWS など）..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-blue-400 p-3.5 sm:p-4 rounded-xl text-sm sm:text-base bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <Link
              href="/experiences/new"
              className="inline-block w-full sm:w-auto bg-green-600 text-white font-extrabold text-sm sm:text-base px-6 py-3.5 rounded-xl hover:bg-green-700 transition shadow-sm"
            >
              ＋ あなたの合格体験談・ロードマップを投稿する
            </Link>
          </div>
        </section>

        {/* 🔥 人気の合格ロードマップ（いいね数 TOP3） */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
            🔥 人気の合格ロードマップ
          </h2>
          {popularExperiences.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {popularExperiences.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.id}`}
                  className="block bg-white border border-amber-200 rounded-xl p-4 hover:shadow-md transition space-y-2.5 relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full truncate max-w-[170px]">
                      {exp.qualification_name}
                    </span>
                    <span className="text-xs bg-pink-50 text-pink-700 font-bold px-2 py-0.5 rounded-full border border-pink-200 whitespace-nowrap">
                      👍 {exp.likes_count || 0}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition line-clamp-2 leading-snug">
                    {exp.title || '無題のロードマップ'}
                  </h3>

                  <div className="text-xs text-gray-500 space-y-1 pt-1 border-t border-gray-100">
                    <p>👤 {exp.user_name || '匿名'} ({exp.age_group || '未設定'})</p>
                    <p>⏱️ 1日 {exp.daily_study_hours || '未設定'} / ⏳ {exp.duration_days || '未設定'}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white border rounded-xl p-6 text-center text-sm text-gray-500">
              まだ体験談が投稿されていません。「体験談を投稿する」から一番乗りで投稿してみましょう！
            </div>
          )}
        </section>

        {/* 📖 登録されている資格一覧 */}
        <section className="space-y-4 pt-2">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              📊 登録されている資格一覧 ({filteredQualifications.length}件)
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">資格データを読み込み中...</div>
          ) : filteredQualifications.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredQualifications.map((qual) => (
                <Link
                  key={qual.id}
                  href={`/qualifications/${qual.id}`}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition block group"
                >
                  <h3 className="font-bold text-sm text-gray-800 group-hover:text-blue-600 transition">
                    {qual.name}
                  </h3>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">
              一致する資格が見つかりませんでした。
            </p>
          )}
        </section>

        {/* 🆕 最新の合格ロードマップ */}
        {recentExperiences.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              🆕 最新の投稿ロードマップ
            </h2>
            <div className="space-y-3">
              {recentExperiences.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-sm transition space-y-2 group"
                >
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded">
                      {exp.qualification_name}
                    </span>
                    {exp.passed_date && (
                      <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded">
                        {exp.passed_date} 合格
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-blue-600 transition">
                    {exp.title || '無題のロードマップ'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>👤 {exp.user_name || '匿名'}</span>
                    <span>⏱️ {exp.daily_study_hours || '未設定'}</span>
                    <span>⏳ {exp.duration_days || '未設定'}</span>
                    <span className="text-pink-600 font-bold ml-auto">👍 {exp.likes_count || 0}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}