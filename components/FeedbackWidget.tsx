'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const FEEDBACK_TYPES = [
  { id: 'feature', label: '機能の要望' },
  { id: 'bug', label: 'バグの報告' },
  { id: 'other', label: 'その他' },
] as const;

type FeedbackType = (typeof FEEDBACK_TYPES)[number]['id'];

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('feature');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !sending) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, sending]);

  const resetForm = () => {
    setType('feature');
    setContent('');
    setErrorMessage('');
  };

  const closeModal = () => {
    if (sending) return;
    setOpen(false);
    setErrorMessage('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setErrorMessage('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const selected = FEEDBACK_TYPES.find((item) => item.id === type);
      const payload = {
        type: selected?.label.replace(/^[^\s]+\s/, '') || type,
        content: trimmed,
        user_id: user?.id || null,
        created_at: new Date().toISOString(),
      };

      let { error } = await supabase.from('feedbacks').insert([payload]);
      if (error && /created_at|column|schema cache/i.test(error.message)) {
        const { created_at: _createdAt, ...withoutTimestamp } = payload;
        ({ error } = await supabase.from('feedbacks').insert([withoutTimestamp]));
      }

      if (error) {
        setErrorMessage('送信に失敗しました: ' + error.message);
        return;
      }

      resetForm();
      setOpen(false);
      setToast('ご協力ありがとうございました！');
    } catch (err) {
      setErrorMessage('送信中にエラーが発生しました。時間をおいて再度お試しください。');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-3 z-40 min-h-11 rounded-full bg-navy px-3 py-2.5 text-xs font-extrabold text-white transition hover:bg-navy-hover sm:bottom-6 sm:right-6 sm:min-h-12 sm:px-4 sm:py-3 sm:text-sm"
      >
        ご意見
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="閉じる"
            onClick={closeModal}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border bg-white p-5 sm:p-6 shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="feedback-title" className="text-lg font-extrabold text-gray-900">
                  ご意見・バグ報告
                </h2>
                <p className="mt-1 text-xs text-gray-500">改善の参考にさせていただきます。匿名でも送信できます。</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="min-h-10 min-w-10 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset className="space-y-2">
                <legend className="text-xs font-bold text-gray-700">種別</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {FEEDBACK_TYPES.map((item) => (
                    <label
                      key={item.id}
                      className={`min-h-12 flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-extrabold cursor-pointer transition ${
                        type === item.id
                          ? 'border-navy bg-navy-soft text-navy'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-navy/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="feedback-type"
                        value={item.id}
                        checked={type === item.id}
                        onChange={() => setType(item.id)}
                        className="sr-only"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">内容</label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="ご自由にご記入ください（例: 〇〇の資格を追加してほしい、ボタンが押せない等）"
                  className="w-full rounded-xl border bg-gray-50 p-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              {errorMessage && (
                <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={sending || !content.trim()}
                className="w-full min-h-12 rounded-xl bg-navy text-white text-sm font-extrabold hover:bg-navy-hover transition disabled:opacity-50"
              >
                {sending ? '送信中...' : '送信する'}
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 right-6 z-[70] max-w-xs rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
