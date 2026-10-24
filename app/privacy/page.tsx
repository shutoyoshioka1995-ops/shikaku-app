import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <article className="mx-auto max-w-3xl space-y-5 rounded-2xl border bg-white p-6 text-sm leading-relaxed text-gray-700 sm:p-8">
        <Link href="/" className="text-xs text-navy hover:underline">
          ← トップへ
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">プライバシーポリシー</h1>
        <p>
          本サービスは、アカウント登録時および投稿時に、メールアドレス、表示名、任意のプロフィール（年代・業種・職種・SNS URL）、学習体験の内容、アイコン画像を取得します。
        </p>
        <h2 className="text-base font-bold text-gray-900">利用目的</h2>
        <p>
          取得した情報は、ログイン認証、体験談の表示、学習プランの保存、サービス改善、お問い合わせ対応のために利用します。法令に基づく場合を除き、本人の同意なく第三者に提供しません。
        </p>
        <h2 className="text-base font-bold text-gray-900">保管と開示</h2>
        <p>
          データは認証・データベース事業者のインフラ上に保管されます。登録情報の訂正・削除はマイページまたはお問い合わせから請求できます。
        </p>
        <h2 className="text-base font-bold text-gray-900">お問い合わせ</h2>
        <p>
          個人情報に関するご質問は、<Link href="/contact" className="text-navy hover:underline">お問い合わせ</Link>
          からご連絡ください。
        </p>
      </article>
    </main>
  );
}
