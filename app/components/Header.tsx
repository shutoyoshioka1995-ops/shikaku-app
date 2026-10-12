'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert('ログアウトしました');
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-extrabold text-base sm:text-lg text-gray-900 hover:opacity-80">
          🗺️ 合格ロードマップ
        </Link>

        <div className="flex items-center gap-3 text-xs sm:text-sm">
          {user ? (
            <>
              <Link
                href="/mypage"
                className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                👤 マイページ
              </Link>
              <span className="text-gray-300">|</span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 font-medium hover:underline"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 text-white font-bold px-3.5 py-1.5 rounded-lg hover:bg-blue-700 transition"
            >
              ログイン / 新規登録
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}