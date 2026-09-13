'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PROJECT_STATUSES } from '@/lib/project/constants';
import type { ProjectRecord } from '@/lib/project/schema';

type ProjectListProps = {
  projects: ProjectRecord[];
};

function statusLabel(status: ProjectRecord['status']): string {
  return (
    PROJECT_STATUSES.find(item => item.value === status)?.label ?? status
  );
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ProjectList({ projects }: ProjectListProps) {
  const router = useRouter();
  const [creating, startCreate] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createProject = () => {
    startCreate(async () => {
      const response = await fetch('/api/projects', { method: 'POST' });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error('创建项目失败');
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (payload as { data: unknown }).data
          : payload;
      if (
        typeof data === 'object' &&
        data !== null &&
        'project' in data &&
        typeof (data as { project: { id?: unknown } }).project === 'object' &&
        (data as { project: { id?: unknown } }).project !== null &&
        typeof (data as { project: { id: unknown } }).project.id === 'string'
      ) {
        const id = (data as { project: { id: string } }).project.id;
        router.push(`/projects/${id}/basic`);
        router.refresh();
        return;
      }
      toast.error('创建项目失败');
    });
  };

  const removeProject = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        toast.error('删除失败');
        return;
      }
      toast.success('已删除');
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--app-ink)]">
            我的项目
          </h1>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            以项目为单元启动智写：信息结构化输入，模型分章生成可研初稿。
          </p>
        </div>
        <Button disabled={creating} onClick={createProject}>
          {creating ? '创建中…' : '新建智写项目'}
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--app-line)] bg-[var(--app-paper)] px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg text-[var(--app-ink)]">
            开启第一份 AI 可研初稿
          </p>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            新建项目后，依次完成信息采集、依据智能匹配与分章生成。
          </p>
          <Button className="mt-6" disabled={creating} onClick={createProject}>
            {creating ? '创建中…' : '新建智写项目'}
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--app-line)] overflow-hidden rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)]">
          {projects.map(project => (
            <li
              key={project.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <Link
                  href={`/projects/${project.id}/basic`}
                  className="block truncate text-base font-medium text-[var(--app-ink)] hover:text-[var(--app-accent)]"
                >
                  {project.basicInfo.name.trim() || '未命名项目'}
                </Link>
                <p className="text-sm text-[var(--app-muted)]">
                  {project.basicInfo.industry}
                  {project.basicInfo.subSector
                    ? ` · ${project.basicInfo.subSector}`
                    : ''}
                  {' · '}
                  {statusLabel(project.status)}
                  {' · '}
                  {formatTime(project.updatedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/projects/${project.id}/basic`}>继续编辑</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === project.id}
                  onClick={() => {
                    if (window.confirm('确认删除该项目？')) {
                      void removeProject(project.id);
                    }
                  }}
                >
                  删除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
