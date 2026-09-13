import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/project/app-shell';
import { SettingsForm } from '@/components/settings/settings-form';
import { getSessionUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: '模型设置',
  description: '接入智写大模型与账号相关配置',
};

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <AppShell user={user} title="模型设置">
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--app-ink)]">
          模型设置
        </h1>
        <p className="mt-2 text-sm text-[var(--app-muted)]">
          接入智写引擎所用大模型。配置 API Key 后，即可启用分章智写与智能重写。
        </p>
      </div>
      <SettingsForm />
    </AppShell>
  );
}
