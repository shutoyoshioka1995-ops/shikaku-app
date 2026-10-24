'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ContactPage() {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setMessage('');
    setIsError(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const payload = {
        type: 'お問い合わせ',
        content: trimmed,
        user_id: user?.id || null,
      };
      const { error } = await supabase.from('feedbacks').insert([payload]);
      if (error) {
        setIsError(true);
        setMessage('送信に失敗しました: ' + error.message);
        return;
      }
      setContent('');
      setMessage('送信しました。ご連絡ありがとうございます。');
    } catch {
      setIsError(true);
      setMessage('送信中にエラーが発生しました。');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg space-y-5 rounded-2xl border bg-white p-6 sm:p-8">
        <Link href="/" className="text-xs text-navy hover:underline">
          ← トップへ
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">お問い合わせ</h1>
        <p className="text-sm text-gray-600">
          不具合・ご要望・個人情報に関するご連絡を受け付けます。画面右下の「ご意見」からも送れます。
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            required
            rows={6}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="内容をご記入ください"
            className="w-full rounded-xl border bg-gray-50 p-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy"
          />
          {message && (
            <p
              className={`rounded-xl border p-3 text-xs font-bold ${
                isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-navy/20 bg-navy-soft text-navy'
              }`}
            >
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="min-h-12 w-full rounded-xl bg-navy text-sm font-extrabold text-white hover:bg-navy-hover disabled:opacity-50"
          >
            {sending ? '送信中...' : '送信する'}
          </button>
        </form>
      </div>
    </main>
  );
}
