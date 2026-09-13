import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/project/app-shell';
import { ProjectList } from '@/components/project/project-list';
import { getSessionUser, toProjectScope } from '@/lib/auth/session';
import { listProjects } from '@/lib/project/store';

export const metadata: Metadata = {
  title: '我的项目',
  description: '可研报告 AI 智写 — 项目列表',
};

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  const projects = await listProjects(toProjectScope(user));

  return (
    <AppShell user={user}>
      <ProjectList projects={projects} />
    </AppShell>
  );
}
