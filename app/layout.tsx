import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '射龍門 | Dragon Gate',
  description: '多人線上射龍門紙牌遊戲 — Dragon Gate Acey-Deucey',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-gradient-to-b from-green-950 to-green-900 text-white">
        {children}
      </body>
    </html>
  );
}
