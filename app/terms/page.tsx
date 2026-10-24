import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <article className="mx-auto max-w-3xl space-y-5 rounded-2xl border bg-white p-6 text-sm leading-relaxed text-gray-700 sm:p-8">
        <Link href="/" className="text-xs text-navy hover:underline">
          ← トップへ
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">利用規約</h1>
        <p>本サービス「合格ロードマップ」（以下「本サービス」）は、資格学習の体験談・学習計画を共有するための情報サービスです。ご利用の前に本規約をご確認ください。</p>
        <h2 className="text-base font-bold text-gray-900">1. 投稿について</h2>
        <p>
          投稿者は、自らが作成した内容であり、第三者の権利を侵害しないことを保証するものとします。虚偽の合格体験、他人の個人情報、誹謗中傷、違法な勧誘は禁止します。運営は、規約に反する投稿を予告なく非公開または削除できるものとします。
        </p>
        <h2 className="text-base font-bold text-gray-900">2. 免責</h2>
        <p>
          本サービスの情報は個人の体験に基づく参考情報であり、合格を保証するものではありません。教材リンク先の取引は各販売事業者との契約になります。
        </p>
        <h2 className="text-base font-bold text-gray-900">3. アカウント</h2>
        <p>
          登録情報は正確に管理してください。パスワードの管理責任は利用者にあります。不正利用が疑われる場合は直ちにパスワードを変更し、運営へご連絡ください。
        </p>
      </article>
    </main>
  );
}
