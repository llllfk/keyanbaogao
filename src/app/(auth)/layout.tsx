import { Toaster } from '@/components/ui/sonner';

import '../projects/projects.css';

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
