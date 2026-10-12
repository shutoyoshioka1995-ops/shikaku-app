import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// キャッシュを無効化して最新データを常に取得
export const revalidate = 0;

export default async function HomePage() {
  // 1. 人気の合格ロードマップ（いいね数順）
  const { data: popularExperiences } = await supabase
    .from('experiences')
    .select('*, qualifications(name)')
    .order('likes_count', { ascending: false })
    .limit(6);

  // 2. 最新の投稿ロードマップ（作成日時順）
  const { data: latestExperiences } = await supabase
    .from('experiences')
    .select('*, qualifications(name)')
    .order('created_at', { ascending: false })
    .limit(6);

  // 3. 登録されている資格一覧
  const { data: qualifications } = await supabase
    .from('qualifications')
    .select('*')
    .order('name', { ascending: true });

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* ヘッダーセクション */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            資格合格ロードマップ検索
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            リアルな合格体験談・学習ロードマップから、あなたに最適な勉強法を見つけよう
          </p>
          <div className="pt-2">
            <Link
              href="/experiences/new"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition duration-200"
            >
              ＋ あなたのロードマップを投稿する
            </Link>
          </div>
        </div>

        {/* 1. 🔥 人気の合格ロードマップ */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>🔥</span> 人気の合格ロードマップ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularExperiences && popularExperiences.length > 0 ? (
              popularExperiences.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.id}`}
                  className="block p-5 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded">
                      {exp.qualifications?.name || '資格名未設定'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      👍 {exp.likes_count || 0}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-1">{exp.title}</h3>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>👤 {exp.user_name || '匿名'} ({exp.age_group || '未設定'})</p>
                    <p>⏱️ {exp.daily_study_hours} / ⏳ {exp.study_period}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-sm col-span-full">現在投稿はありません。</p>
            )}
          </div>
        </section>

        {/* 2. 🆕 最新のロードマップ */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>🆕</span> 最新のロードマップ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestExperiences && latestExperiences.length > 0 ? (
              latestExperiences.map((exp) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.id}`}
                  className="block p-5 bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 transition space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded">
                      {exp.qualifications?.name || '資格名未設定'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      👍 {exp.likes_count || 0}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-1">{exp.title}</h3>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>👤 {exp.user_name || '匿名'} ({exp.age_group || '未設定'})</p>
                    <p>⏱️ {exp.daily_study_hours} / ⏳ {exp.study_period}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-sm col-span-full">現在投稿はありません。</p>
            )}
          </div>
        </section>

        {/* 3. 📊 登録されている資格一覧 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>📊</span> 登録されている資格一覧 ({qualifications?.length || 0} 件)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {qualifications && qualifications.length > 0 ? (
              qualifications.map((q) => (
                <Link
                  key={q.id}
                  href={`/qualifications/${q.id}`}
                  className="p-3 bg-white hover:bg-blue-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 hover:text-blue-600 hover:border-blue-300 transition text-center line-clamp-1"
                >
                  {q.name}
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-sm col-span-full">資格データがありません。</p>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}