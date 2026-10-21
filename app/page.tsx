import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import HomeExperiences from '@/components/HomeExperiences';

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

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* ヒーロー */}
        <section className="space-y-6 pt-4 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900 sm:text-4xl">
            資格合格ロードマップ検索
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 sm:text-base">
            リアルな合格体験談・学習ロードマップから、あなたに最適な勉強法を見つけよう
          </p>
          <div className="mx-auto max-w-xl">
            <Link
              href="/experiences/new"
              className="inline-block w-full rounded-xl bg-green-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-green-700 sm:w-auto sm:text-base"
            >
              ＋ あなたのロードマップを投稿する
            </Link>
          </div>
        </section>

        <HomeExperiences experiences={formattedExps} />

        {/* 登録されている資格一覧 */}
        <section className="space-y-4 pt-2">
          <h2 className="border-b pb-2 text-lg font-bold text-gray-800 sm:text-xl">
            📊 登録されている資格一覧 ({qualifications.length}件)
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {qualifications.map((qual) => (
              <Link
                key={qual.id}
                href={`/qualifications/${qual.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:border-blue-400 hover:shadow-md"
              >
                <h3 className="text-sm font-bold text-gray-800">{qual.name}</h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
