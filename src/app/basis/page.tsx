import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/project/app-shell';
import { BasisImportPanel } from '@/components/project/basis-import-panel';
import { BasisLibraryBrowser } from '@/components/project/basis-library-browser';
import { BasisPackEditor } from '@/components/project/basis-pack-editor';
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
            只存标题、文号与原文链接。页面分两层：
            <span className="text-[var(--app-ink)]">推荐包</span>
            决定「哪类项目自动看到哪些文件」；
            <span className="text-[var(--app-ink)]">来源官网</span>
            只用于浏览核验，与推荐无关。
          </p>
        </div>

        <ol className="grid gap-3 rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] p-4 sm:grid-cols-3">
          <li className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-[var(--app-accent)]">
              第 1 步 · 推荐策略
            </p>
            <p className="text-sm font-medium text-[var(--app-ink)]">配置推荐包</p>
            <p className="text-xs leading-relaxed text-[var(--app-muted)]">
              设置关键词或「全量推荐」，控制项目里自动召回哪一组文件。
            </p>
          </li>
          <li className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-[var(--app-accent)]">
              第 2 步 · 采集入库
            </p>
            <p className="text-sm font-medium text-[var(--app-ink)]">同步官方栏目</p>
            <p className="text-xs leading-relaxed text-[var(--app-muted)]">
              从官网列表抓取文件，并指定写入哪个推荐包。
            </p>
          </li>
          <li className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-[var(--app-accent)]">
              第 3 步 · 浏览核验
            </p>
            <p className="text-sm font-medium text-[var(--app-ink)]">按来源官网查看</p>
            <p className="text-xs leading-relaxed text-[var(--app-muted)]">
              只按官网筛选核对原文；这里不改推荐规则。
            </p>
          </li>
        </ol>
      </div>

      <div className="mb-10 space-y-8">
        <BasisPackEditor />
        <BasisImportPanel />
        <BasisLibraryBrowser data={data} />
      </div>
    </AppShell>
  );
}
