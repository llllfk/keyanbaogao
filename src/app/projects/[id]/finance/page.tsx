import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { AppShell } from '@/components/project/app-shell';
import { FinanceForm } from '@/components/project/finance-form';
import { WizardSteps } from '@/components/project/wizard-steps';
import { getSessionUser, toProjectScope } from '@/lib/auth/session';
import { getWizardSteps } from '@/lib/project/constants';
import { getProject } from '@/lib/project/store';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const user = await getSessionUser();
  if (!user) {
    return { title: '财务测算' };
  }
  const { id } = await params;
  const project = await getProject(toProjectScope(user), id);
  return {
    title: project?.basicInfo.name
      ? `财务测算 · ${project.basicInfo.name}`
      : '财务测算',
  };
}

export const dynamic = 'force-dynamic';

export default async function FinancePage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  const { id } = await params;
  const project = await getProject(toProjectScope(user), id);
  if (!project) {
    notFound();
  }

  if (!project.basicInfo.doFinancialAnalysis) {
    redirect(`/projects/${id}/outline`);
  }

  const stepIndex =
    getWizardSteps(true).findIndex(step => step.key === 'finance') + 1;

  return (
    <AppShell title={project.basicInfo.name || '未命名项目'} user={user}>
      <div className="rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-2">
          <p className="text-xs font-medium tracking-[0.16em] text-[var(--app-accent)] uppercase">
            Step {String(stepIndex).padStart(2, '0')}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--app-ink)] sm:text-3xl">
            财务测算
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
            填写关键假设后由引擎计算总投资、分年现金流、IRR/NPV（V2 档 B）；确认结果将注入智写与第 11
            章附表。也可跳过，财务数字保留【待补充】。
          </p>
        </div>
        <WizardSteps
          projectId={project.id}
          current="finance"
          doFinancialAnalysis
        />
        <FinanceForm project={project} />
      </div>
    </AppShell>
  );
}
