import './globals.css';
import Header from './components/Header';
import FeedbackWidget from '@/components/FeedbackWidget';
import SiteFooter from '@/components/SiteFooter';

export const metadata = {
  title: '資格合格ロードマップ検索',
  description: 'リアルな合格体験談・学習ロードマップ検索サービス',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 pb-28 sm:pb-8">{children}</div>
        <SiteFooter />
        <FeedbackWidget />
      </body>
    </html>
  );
}