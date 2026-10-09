import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/project/app-shell';
import { BasisImportPanel } from '@/components/project/basis-import-panel';
import { BasisLibraryBrowser } from '@/components/project/basis-library-browser';
import { getSessionUser } from '@/lib/auth/session';
import { getBasisLibraryViewModel } from '@/lib/project/basis-library-view';

export const metadata: Metadata = {
  title: '智能依据库',
  description: 'AI 可研智写的政策与标准知识底座',
};

export const dynamic = 'force-dynamic';

export default async function BasisLibraryPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const data = await getBasisLibraryViewModel();

  return (
    <AppShell user={user} title="智能依据库">
      <div className="mb-8 space-y-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--app-ink)]">
            智能依据库
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">
            只存标题、文号与原文链接。按
            <span className="text-[var(--app-ink)]">来源官网</span>
            同步与浏览；进入项目编制依据时，由
            <span className="text-[var(--app-ink)]">大模型按项目画像勾选条目</span>
            。
          </p>
        </div>

        <ol className="grid gap-3 rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] p-4 sm:grid-cols-2">
          <li className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-[var(--app-accent)]">
              第 1 步 · 采集入库
            </p>
            <p className="text-sm font-medium text-[var(--app-ink)]">同步官方栏目</p>
            <p className="text-xs leading-relaxed text-[var(--app-muted)]">
              从白名单官网列表抓取文件元数据，系统按来源自动归库。
            </p>
          </li>
          <li className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-[var(--app-accent)]">
              第 2 步 · 浏览核验
            </p>
            <p className="text-sm font-medium text-[var(--app-ink)]">按来源官网查看</p>
            <p className="text-xs leading-relaxed text-[var(--app-muted)]">
              按官网筛选核对原文，可删除误入库条目。
            </p>
          </li>
        </ol>
      </div>

      <div className="mb-10 space-y-8">
        <BasisImportPanel />
        <BasisLibraryBrowser data={data} />
      </div>
    </AppShell>
  );
}
