import { Toaster } from '@/components/ui/sonner';

import './projects.css';

export default function ProjectsLayout({
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
