'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import type { SessionUser } from '@/lib/auth/token';
import { cn } from '@/lib/utils';

type AppShellProps = {
  children: ReactNode;
  title?: string;
  user?: SessionUser | null;
};

export function AppShell({ children, title, user }: AppShellProps) {
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-[var(--app-ink)]">
      <header className="border-b border-[var(--app-line)] bg-[var(--app-paper)]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/projects" className="flex shrink-0 items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--app-ink)]">
                可研智写
              </span>
              <span className="hidden text-xs text-[var(--app-muted)] sm:inline">
                AI 驱动的可研报告智写引擎
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/projects"
                className={cn(
                  'rounded-md px-3 py-1.5 text-[var(--app-ink)] transition-colors',
                  'hover:bg-[var(--app-tint)]',
                )}
              >
                我的项目
              </Link>
              <Link
                href="/basis"
                className={cn(
                  'rounded-md px-3 py-1.5 text-[var(--app-ink)] transition-colors',
                  'hover:bg-[var(--app-tint)]',
                )}
              >
                智能依据库
              </Link>
              <Link
                href="/settings"
                className={cn(
                  'rounded-md px-3 py-1.5 text-[var(--app-ink)] transition-colors',
                  'hover:bg-[var(--app-tint)]',
                )}
              >
                模型设置
              </Link>
            </nav>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            {title ? (
              <p className="hidden max-w-[28vw] truncate text-sm text-[var(--app-muted)] md:block">
                {title}
              </p>
            ) : null}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden max-w-[10rem] truncate text-sm text-[var(--app-muted)] sm:inline">
                  {user.name || user.email}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => void logout()}>
                  退出
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
