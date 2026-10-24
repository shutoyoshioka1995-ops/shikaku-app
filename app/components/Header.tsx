'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { loginUrl } from '@/lib/loginNext';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const loginHref = pathname && pathname !== '/login' ? loginUrl(pathname) : '/login';

  return (
    <header className="sticky top-0 z-50 bg-navy text-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
        <Link
          href="/"
          className="min-w-0 truncate text-sm font-extrabold tracking-wide text-white hover:opacity-90 sm:text-lg"
        >
          合格ロードマップ
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Link
                href="/mypage"
                className="inline-flex min-h-10 items-center rounded-lg px-2 text-xs font-bold text-white/90 hover:bg-white/10 sm:px-3 sm:text-sm"
              >
                マイページ
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-10 items-center rounded-lg px-2 text-xs font-medium text-white/75 hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              href={loginHref}
              className="inline-flex min-h-10 items-center rounded-lg bg-white px-3 text-xs font-bold text-navy hover:bg-navy-soft sm:text-sm"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
