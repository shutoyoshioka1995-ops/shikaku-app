'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getSafeNextPath } from '@/lib/loginNext';
import { isDuplicateUserError, isExistingSignupUser } from '@/lib/authMessages';
import { saveProfile } from '@/lib/profile';
import { normalizeSnsUrl } from '@/lib/snsUrl';
import {
  AGE_GROUP_OPTIONS,
  DEFAULT_AGE_GROUP,
  DEFAULT_INDUSTRY,
  DEFAULT_JOB_TYPE,
  INDUSTRY_OPTIONS,
  JOB_TYPE_OPTIONS,
} from '@/lib/profileOptions';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [snsUrl, setSnsUrl] = useState('');
  const [ageGroup, setAgeGroup] = useState<string>(DEFAULT_AGE_GROUP);
  const [industry, setIndustry] = useState<string>(DEFAULT_INDUSTRY);
  const [jobType, setJobType] = useState<string>(DEFAULT_JOB_TYPE);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [nextPath, setNextPath] = useState('/');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signup') setIsSignUp(true);
    setNextPath(getSafeNextPath(params.get('next')));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      if (isSignUp) {
        const normalizedSns = normalizeSnsUrl(snsUrl);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_name: userName.trim(),
              display_name: userName.trim(),
              sns_url: normalizedSns,
              age_group: ageGroup,
              industry,
              job_type: jobType,
            },
          },
        });

        if (error || isExistingSignupUser(data.user)) {
          if (isDuplicateUserError(error) || isExistingSignupUser(data.user)) {
            setIsError(true);
            setMessage('このメールアドレスは既に登録されています。ログイン画面からログインしてください。');
          } else {
            setIsError(true);
            setMessage('登録エラー: ' + (error?.message || '登録に失敗しました。'));
          }
        } else {
          if (data.user) {
            try {
              await saveProfile(data.user.id, {
                user_name: userName,
                avatar_url: '',
                sns_url: normalizedSns,
                age_group: ageGroup,
                industry,
                job_type: jobType,
              });
            } catch (profileError: any) {
              console.error('プロフィール保存エラー:', profileError);
            }
          }

          setMessage('アカウントを作成しました！メールをご確認いただくか、ログインをお試しください。');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setIsError(true);
          setMessage('ログインエラー: ' + error.message);
        } else {
          setMessage('ログインしました。');
          router.push(nextPath || '/');
          router.refresh();
        }
      }
    } catch (err: any) {
      setIsError(true);
      setMessage('予期せぬエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full border p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy';

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div
        className={`w-full bg-white border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 ${
          isSignUp ? 'max-w-xl' : 'max-w-md'
        }`}
      >
        <div className="text-center space-y-2">
          <Link href="/" className="text-xs text-gray-500 hover:underline">
            ← トップページへ戻る
          </Link>
          <h1 className="text-2xl font-extrabold text-navy">
            {isSignUp ? 'アカウント新規登録' : 'ログイン'}
          </h1>
          <p className="text-xs text-gray-500">
            {isSignUp
              ? '投稿の作成・管理のためにアカウントとプロフィールを作成します'
              : '登録したメールアドレスとパスワードでログイン'}
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
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">パスワード（6文字以上）</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
            {!isSignUp && (
              <div className="mt-2 text-right">
                <Link
                  href="/auth/forgot-password"
                  className="inline-flex items-center min-h-10 text-xs font-extrabold text-navy hover:text-navy hover:underline"
                >
                  パスワードをお忘れの方はこちら
                </Link>
              </div>
            )}
          </div>

          {isSignUp && (
            <div className="space-y-4 rounded-xl border border-navy/15 bg-navy-soft p-4">
              <p className="text-xs font-extrabold text-navy">プロフィール情報</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">ユーザー名（ニックネーム）</label>
                  <input
                    type="text"
                    required
                    placeholder="例: Aさん"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    X（旧Twitter）アカウントまたはブログURL（任意）
                  </label>
                  <input
                    type="text"
                    inputMode="url"
                    placeholder="例: @username / https://x.com/username / https://example.com"
                    value={snsUrl}
                    onChange={(e) => setSnsUrl(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">年代</label>
                  <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className={fieldClass}>
                    {AGE_GROUP_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">業種・業界</label>
                  <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={fieldClass}>
                    {INDUSTRY_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">職種・担当業務</label>
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={fieldClass}>
                    {JOB_TYPE_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`text-xs font-bold text-center p-3 rounded-xl leading-relaxed ${
                isError
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-navy-soft text-navy border border-navy/20'
              }`}
            >
              <p>{message}</p>
              {isSignUp && isError && message.includes('既に登録されています') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setMessage('');
                    setIsError(false);
                  }}
                  className="mt-2 inline-flex min-h-10 items-center justify-center px-3 rounded-lg bg-white border border-red-200 text-red-700 font-extrabold hover:bg-red-100 transition"
                >
                  ログイン画面へ切り替える
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-12 bg-navy text-white font-extrabold py-3 rounded-xl hover:bg-navy-hover transition disabled:opacity-50 text-sm shadow-sm"
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
              setIsError(false);
            }}
            className="text-xs text-navy font-bold hover:underline"
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
