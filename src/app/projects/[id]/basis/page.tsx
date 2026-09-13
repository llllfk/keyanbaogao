import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { AppShell } from '@/components/project/app-shell';
import { BasisForm } from '@/components/project/basis-form';
import { WizardSteps } from '@/components/project/wizard-steps';
import { getSessionUser, toProjectScope } from '@/lib/auth/session';
import {
  buildRecommendedBasisItems,
  getMatchedPackSummaries,
} from '@/lib/project/match-basis';
import { getProject } from '@/lib/project/store';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const user = await getSessionUser();
  if (!user) {
    return { title: '智能依据' };
  }
  const { id } = await params;
  const project = await getProject(toProjectScope(user), id);
  return {
    title: project?.basicInfo.name
      ? `智能依据 · ${project.basicInfo.name}`
      : '智能依据',
  };
}

export const dynamic = 'force-dynamic';

export default async function BasisPage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  const { id } = await params;
  const project = await getProject(toProjectScope(user), id);
  if (!project) {
    notFound();
  }

  const [initialItems, matchedPacks] = await Promise.all([
    buildRecommendedBasisItems(project.basicInfo, project.basisItems),
    getMatchedPackSummaries(project.basicInfo),
  ]);

  return (
    <AppShell title={project.basicInfo.name || '未命名项目'} user={user}>
      <div className="rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-2">
          <p className="text-xs font-medium tracking-[0.16em] text-[var(--app-accent)] uppercase">
            Step 02
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--app-ink)] sm:text-3xl">
            智能依据
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--app-muted)]">
            基于智能依据库与项目画像自动召回候选文件，请人工确认后锁定。本项目批复类材料请手填；确认列表将驱动报告 1.3 节生成。
          </p>
        </div>
        <WizardSteps
          projectId={project.id}
          current="basis"
          doFinancialAnalysis={project.basicInfo.doFinancialAnalysis}
        />
        <BasisForm
          project={project}
          initialItems={initialItems}
          matchedPacks={matchedPacks}
        />
      </div>
    </AppShell>
  );
}
