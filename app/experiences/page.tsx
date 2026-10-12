'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// 型定義（プロジェクトの環境に合わせて適宜修正してください）
type Experience = {
  id: string;
  qualification_name?: string;
  study_period?: string;
  score?: string;
  summary?: string;
  content?: string;
  created_at?: string;
};

export default function ExperienceListPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // データ取得処理の例（SupabaseやAPIからのフェッチ処理を記述）
    async function fetchExperiences() {
      try {
        // 例: const response = await fetch('/api/experiences');
        // const data = await response.json();
        // setExperiences(data);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchExperiences();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>合格体験談・ロードマップ一覧</h1>
        <Link
          href="/experiences/new"
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          ✏️ 体験談を投稿する
        </Link>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : experiences.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <p style={{ color: '#6b7280' }}>まだ投稿されたロードマップがありません。</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {experiences.map((item) => (
            <Link
              key={item.id}
              href={`/experiences/${item.id}`}
              style={{
                display: 'block',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                textDecoration: 'none',
                color: 'inherit',
                backgroundColor: '#ffffff',
                transition: 'border-color 0.2s'
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#1d4ed8' }}>
                {item.qualification_name || '資格ロードマップ'}
              </h2>
              <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>
                <span>⏱️ 勉強期間: {item.study_period || '未設定'}</span>
                {item.score && <span>🎯 スコア/結果: {item.score}</span>}
              </div>
              <p style={{ fontSize: '14px', color: '#374151', lineClamp: 2, overflow: 'hidden' }}>
                {item.summary || item.content || '概要はありません。'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}