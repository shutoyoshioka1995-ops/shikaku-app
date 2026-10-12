'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false); // ログイン / 新規登録の切替
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        // 新規登録処理
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage('登録エラー: ' + error.message);
        } else {
          setMessage('アカウントを作成しました！メールをご確認いただくか、ログインをお試しください。');
        }
      } else {
        // ログイン処理
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage('ログインエラー: ' + error.message);
        } else {
          alert('ログインしました！');
          router.push('/');
          router.refresh();
        }
      }
    } catch (err: any) {
      setMessage('予期せぬエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="text-xs text-gray-500 hover:underline">
            ← トップページへ戻る
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {isSignUp ? 'アカウント新規登録' : 'ログイン'}
          </h1>
          <p className="text-xs text-gray-500">
            {isSignUp
              ? '投稿の作成・管理のためにアカウントを作成します'
              : '登録したメールアドレスとパスワードでログイン'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              required
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              パスワード（6文字以上）
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {message && (
            <p className="text-xs font-bold text-center p-2.5 rounded bg-blue-50 text-blue-700 border border-blue-200 leading-relaxed">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 text-sm shadow-sm"
          >
            {loading ? '処理中...' : isSignUp ? '新規登録する' : 'ログインする'}
          </button>
        </form>

        <div className="text-center border-t pt-4">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage('');
            }}
            className="text-xs text-blue-600 font-bold hover:underline"
          >
            {isSignUp
              ? 'すでにアカウントをお持ちの方（ログインへ）'
              : 'アカウントをお持ちでない方（新規登録へ）'}
          </button>
        </div>
      </div>
    </main>
  );
}