'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const redirectTo = `${window.location.origin}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

      if (error) {
        setIsError(true);
        setMessage('送信に失敗しました: ' + error.message);
      } else {
        setMessage('再設定用のメールを送信しました。届いたリンクから新しいパスワードを設定してください。');
      }
    } catch (err) {
      setIsError(true);
      setMessage('予期せぬエラーが発生しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Link href="/login" className="text-xs text-gray-500 hover:underline">
            ← ログイン画面へ戻る
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">パスワード再設定</h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            登録したメールアドレスを入力すると、パスワード再設定用のリンクを送信します。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              required
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-3 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy"
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
            {loading ? '送信中...' : '再設定メールを送る'}
          </button>
        </form>

        <div className="text-center border-t pt-4 space-y-2">
          <Link href="/login" className="inline-block text-xs text-navy font-bold hover:underline">
            ログイン画面へ
          </Link>
        </div>
      </div>
    </main>
  );
}
