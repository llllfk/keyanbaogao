import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/project/app-shell';
import { ExportFormatForm } from '@/components/settings/export-format-form';
import { getSessionUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: '导出格式',
  description: '设置 Word 导出的编号样式与一至四级标题、正文字体格式',
};

export const dynamic = 'force-dynamic';

export default async function ExportFormatPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <AppShell user={user} title="导出格式">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--app-ink)]">
          设置格式
        </h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          配置 Word 导出的章节编号样式，以及一至四级标题与正文的字体、字号、缩进与行距。保存后对本租户所有项目导出生效。
        </p>
      </div>
      <ExportFormatForm />
    </AppShell>
  );
}
