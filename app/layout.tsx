import './globals.css';
import Header from './components/Header';

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
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        <Header />
        {children}
      </body>
    </html>
  );
}