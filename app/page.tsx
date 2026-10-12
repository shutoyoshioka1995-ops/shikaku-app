import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export default async function HomePage() {
  // 資格一覧
  const { data: qualData } = await supabase
    .from('qualifications')
    .select('*')
    .order('name', { ascending: true });

  const qualifications = qualData || [];
  const qualMap = new Map<string, string>();
  qualifications.forEach((q) => qualMap.set(q.id, q.name));

  // 体験談
  const { data: expData } = await supabase
    .from('experiences')
    .select('*')
    .order('created_at', { ascending: false });

  const formattedExps = (expData || []).map((exp: any) => ({
    ...exp,
    qualification_name: qualMap.get(exp.qualification_id) || '資格',
  }));

  const popularExperiences = [...formattedExps]
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 3);

  const recentExperiences = formattedExps.slice(0, 5);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* ヒーロー */}
        <section className="text-center space-y-6 pt-4">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
            資格合格ロードマップ検索
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            リアルな合格体験談・学習ロードマップから、あなたに最適な勉強法を見つけよう
          </p>
          <div className="max-w-xl mx-auto">
            <Link
              href="/experiences/new"
              className="inline-block w-full sm:w-auto bg-green-600 text-white font-extrabold text-sm sm:text-base px-6 py-3.5 rounded-xl hover:bg-green-700 transition shadow-sm"
            >
              ＋ あなたのロードマップを投稿する
            </Link>
          </div>
        </section>

        {/* 1. 🔥 人気の合格ロードマップ */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            🔥 人気の合格ロードマップ
          </h2>
          {popularExperiences.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {popularExperiences.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.id}`}
                  className="block bg-white border border-amber-200 rounded-xl p-4 hover:shadow-md transition space-y-2.5"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full truncate">
                      {exp.qualification_name}
                    </span>
                    <span className="text-xs bg-pink-50 text-pink-700 font-bold px-2 py-0.5 rounded-full border border-pink-200">
                      👍 {exp.likes_count || 0}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-2">
                    {exp.title || '無題のロードマップ'}
                  </h3>
                  <div className="text-xs text-gray-500 space-y-1 pt-1 border-t border-gray-100">
                    <p>👤 {exp.user_name || '匿名'}</p>
                    <p>⏱️ {exp.daily_study_hours || '未設定'} / ⏳ {exp.duration_days || '未設定'}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">投稿がまだありません。</p>
          )}
        </section>

        {/* 2. 🆕 最新の投稿ロードマップ */}
        {recentExperiences.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              🆕 最新の投稿ロードマップ
            </h2>
            <div className="space-y-3">
              {recentExperiences.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 transition space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded">
                      {exp.qualification_name}
                    </span>
                    <span className="text-pink-600 font-bold text-xs">👍 {exp.likes_count || 0}</span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900">
                    {exp.title || '無題のロードマップ'}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 3. 📊 登録されている資格一覧 */}
        <section className="space-y-4 pt-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-b pb-2">
            📊 登録されている資格一覧 ({qualifications.length}件)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {qualifications.map((qual) => (
              <Link
                key={qual.id}
                href={`/qualifications/${qual.id}`}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition block"
              >
                <h3 className="font-bold text-sm text-gray-800">
                  {qual.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}