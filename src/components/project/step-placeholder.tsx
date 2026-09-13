import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { AppShell } from '@/components/project/app-shell';
import { WizardSteps } from '@/components/project/wizard-steps';
import { Button } from '@/components/ui/button';
import { getSessionUser, toProjectScope } from '@/lib/auth/session';
import { WIZARD_STEPS } from '@/lib/project/constants';
import { getProject } from '@/lib/project/store';

type PageProps = {
  params: Promise<{ id: string }>;
};

const PLACEHOLDERS = {
  finance: {
    title: '财务测算',
    blurb: '第一期聚焦 AI 智写，财务测算已跳过。',
  },
  outline: {
    title: '分章智写',
    blurb: '对齐 2023 可研大纲，按章调用大模型生成正文。',
  },
  report: {
    title: '智能审改',
    blurb: '审阅 AI 初稿，支持单章智能重写并导出 Word。',
  },
} as const;

type StepKey = keyof typeof PLACEHOLDERS;

async function PlaceholderPage({
  id,
  step,
}: {
  id: string;
  step: StepKey;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  const project = await getProject(toProjectScope(user), id);
  if (!project) {
    notFound();
  }
  const meta = PLACEHOLDERS[step];
  const current = step as (typeof WIZARD_STEPS)[number]['key'];

  return (
    <AppShell title={project.basicInfo.name || '未命名项目'} user={user}>
      <div className="rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] px-4 py-6 sm:px-8 sm:py-8">
        <WizardSteps projectId={id} current={current} />
        <div className="py-10 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--app-ink)]">
            {meta.title}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[var(--app-muted)]">
            {meta.blurb}
            <br />
            本步骤页面骨架已就绪，功能开发中。
          </p>
          <Button asChild className="mt-8" variant="outline">
            <Link href={`/projects/${id}/basis`}>返回智能依据</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

export function makePlaceholderPage(step: StepKey) {
  return async function Page({ params }: PageProps) {
    const { id } = await params;
    return <PlaceholderPage id={id} step={step} />;
  };
}
