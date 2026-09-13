import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { AppShell } from '@/components/project/app-shell';
import { OutlineForm } from '@/components/project/outline-form';
import { WizardSteps } from '@/components/project/wizard-steps';
import { getSessionUser, toProjectScope } from '@/lib/auth/session';
import { getProject } from '@/lib/project/store';
import { getLlmSettingsPublic } from '@/lib/settings/llm';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const user = await getSessionUser();
  if (!user) {
    return { title: '分章智写' };
  }
  const { id } = await params;
  const project = await getProject(toProjectScope(user), id);
  return {
    title: project?.basicInfo.name
      ? `分章智写 · ${project.basicInfo.name}`
      : '分章智写',
  };
}

export const dynamic = 'force-dynamic';

export default async function OutlinePage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  const { id } = await params;
  const project = await getProject(toProjectScope(user), id);
  if (!project) {
    notFound();
  }

  const settings = await getLlmSettingsPublic(user.id);

  return (
    <AppShell title={project.basicInfo.name || '未命名项目'} user={user}>
      <div className="rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-2">
          <p className="text-xs font-medium tracking-[0.16em] text-[var(--app-accent)] uppercase">
            Step 03
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--app-ink)] sm:text-3xl">
            分章智写
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
            对齐发改委 2023 可研大纲，按章调用大模型生成正文。1.3
            编制依据由已确认列表渲染；已确认的简化财务测算数字须原样引用，禁止模型另算或虚构
            IRR/NPV。
          </p>
        </div>
        <WizardSteps
          projectId={project.id}
          current="outline"
          doFinancialAnalysis={project.basicInfo.doFinancialAnalysis}
        />
        <OutlineForm
          project={project}
          deepseekConfigured={settings.deepseekConfigured}
        />
      </div>
    </AppShell>
  );
}
