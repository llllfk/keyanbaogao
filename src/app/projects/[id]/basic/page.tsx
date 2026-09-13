import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { AppShell } from '@/components/project/app-shell';
import { BasicInfoForm } from '@/components/project/basic-info-form';
import { WizardSteps } from '@/components/project/wizard-steps';
import { getSessionUser, toProjectScope } from '@/lib/auth/session';
import { getProject } from '@/lib/project/store';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const user = await getSessionUser();
  if (!user) {
    return { title: '信息采集' };
  }
  const { id } = await params;
  const project = await getProject(toProjectScope(user), id);
  return {
    title: project?.basicInfo.name
      ? `信息采集 · ${project.basicInfo.name}`
      : '信息采集',
  };
}

export const dynamic = 'force-dynamic';

export default async function BasicInfoPage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  const { id } = await params;
  const project = await getProject(toProjectScope(user), id);
  if (!project) {
    notFound();
  }

  return (
    <AppShell title={project.basicInfo.name || '未命名项目'} user={user}>
      <div className="rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-2">
          <p className="text-xs font-medium tracking-[0.16em] text-[var(--app-accent)] uppercase">
            Step 01
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--app-ink)] sm:text-3xl">
            信息采集
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
            结构化采集项目事实，为后续智能匹配与分章生成提供可信上下文。带 *
            为必填；暂缺项可在智写结果中保留为【待补充】。
          </p>
        </div>
        <WizardSteps
          projectId={project.id}
          current="basic"
          doFinancialAnalysis={project.basicInfo.doFinancialAnalysis}
        />
        <BasicInfoForm project={project} />
      </div>
    </AppShell>
  );
}
