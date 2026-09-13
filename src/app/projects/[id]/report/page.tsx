import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { AppShell } from '@/components/project/app-shell';
import { ReportWorkbench } from '@/components/project/report-workbench';
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
    return { title: '智能审改' };
  }
  const { id } = await params;
  const project = await getProject(toProjectScope(user), id);
  return {
    title: project?.basicInfo.name
      ? `智能审改 · ${project.basicInfo.name}`
      : '智能审改',
  };
}

export const dynamic = 'force-dynamic';

export default async function ReportPage({ params }: PageProps) {
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
            Step 04
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--app-ink)] sm:text-3xl">
            智能审改
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
            审阅 AI 初稿，支持单章智能重写；导出 Word 含封面与规范标题层级，便于人工精修与报审。
          </p>
        </div>
        <WizardSteps
          projectId={project.id}
          current="report"
          doFinancialAnalysis={project.basicInfo.doFinancialAnalysis}
        />
        <ReportWorkbench project={project} />
      </div>
    </AppShell>
  );
}
