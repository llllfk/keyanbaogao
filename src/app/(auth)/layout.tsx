import type { Metadata } from 'next';

import { Toaster } from '@/components/ui/sonner';

import '../projects/projects.css';

export const metadata: Metadata = {
  title: '登录',
  description: '登录可研智写，继续编写可行性研究报告。',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <Toaster richColors position="top-center" />
    </>
  );
}
