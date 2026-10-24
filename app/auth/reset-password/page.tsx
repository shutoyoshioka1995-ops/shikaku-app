'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let active = true;

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        setChecking(false);
      }
    });

    const timer = window.setTimeout(() => {
      if (!active) return;
      setChecking(false);
    }, 1500);

    return () => {
      active = false;
      window.clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || loading) return;

    if (newPassword.length < 6) {
      setIsError(true);
      setMessage('パスワードは6文字以上で入力してください。');
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage('確認用パスワードが一致しません。');
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setIsError(true);
        setMessage('更新に失敗しました: ' + error.message);
        return;
      }

      setMessage('パスワードを更新しました。ログイン画面へ移動します。');
      setTimeout(() => {
        router.push('/login');
        router.refresh();
      }, 1200);
    } catch (err) {
      setIsError(true);
      setMessage('予期せぬエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full border p-3 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy';

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Link href="/login" className="text-xs text-gray-500 hover:underline">
            ← ログイン画面へ戻る
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">新しいパスワードを設定</h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            メールのリンクから開いたこの画面で、新しいパスワードを登録します。
          </p>
        </div>

        {checking ? (
          <p className="text-sm text-center text-gray-500 py-6">リンクを確認しています...</p>
        ) : !ready ? (
          <div className="space-y-4 text-center">
            <p className="text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 leading-relaxed">
              リンクが無効、または有効期限が切れています。もう一度メールを送信してください。
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-flex min-h-12 items-center justify-center w-full bg-navy text-white font-extrabold rounded-xl hover:bg-navy-hover transition text-sm"
            >
              再設定メールを送り直す
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">新しいパスワード（6文字以上）</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">新しいパスワード（確認）</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldClass}
              />
            </div>

            {message && (
              <p
                className={`text-xs font-bold text-center p-3 rounded-xl leading-relaxed ${
                  isError
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-navy-soft text-navy border border-navy/20'
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-12 bg-navy text-white font-extrabold py-3 rounded-xl hover:bg-navy-hover transition disabled:opacity-50 text-sm shadow-sm"
            >
              {loading ? '更新中...' : 'パスワードを更新する'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
