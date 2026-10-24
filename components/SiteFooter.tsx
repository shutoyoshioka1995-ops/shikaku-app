import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-navy/15 bg-navy text-white/80">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-5 text-xs sm:justify-between">
        <p className="font-bold text-white">合格ロードマップ</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/terms" className="inline-flex min-h-10 items-center hover:text-white hover:underline">
            利用規約
          </Link>
          <Link href="/privacy" className="inline-flex min-h-10 items-center hover:text-white hover:underline">
            プライバシーポリシー
          </Link>
          <Link href="/contact" className="inline-flex min-h-10 items-center hover:text-white hover:underline">
            お問い合わせ
          </Link>
        </nav>
      </div>
    </footer>
  );
}
