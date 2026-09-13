import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';

import { NavigationProgress } from '@/components/navigation-progress';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '可研智写',
    template: '%s | 可研智写',
  },
  description: 'AI 驱动的可行性研究报告智写引擎：结构化输入、智能依据、分章生成与导出。',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        <NavigationProgress />
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
