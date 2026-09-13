'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  defaultSelectedChapterIds,
  getOutlineTemplate,
  listSelectableChapters,
  selectionNeedsLlm,
  type OutlineNode,
} from '@/lib/project/outline';
import type { ProjectRecord, ReportChapter } from '@/lib/project/schema';
import { cn } from '@/lib/utils';

type OutlineFormProps = {
  project: ProjectRecord;
  deepseekConfigured: boolean;
};

function errorMessage(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'string'
  ) {
    return (data as { error: string }).error;
  }
  return fallback;
}

function statusLabel(status: ReportChapter['status']): string {
  switch (status) {
    case 'done':
      return '已成稿';
    case 'generating':
      return '智写中';
    case 'failed':
      return '失败';
    case 'skipped':
      return '跳过';
    default:
      return '待智写';
  }
}

function readProjectFromPayload(payload: unknown): ProjectRecord | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  if (
    'data' in payload &&
    typeof (payload as { data: unknown }).data === 'object' &&
    (payload as { data: unknown }).data !== null &&
    'project' in (payload as { data: { project?: unknown } }).data &&
    typeof (payload as { data: { project: unknown } }).data.project ===
      'object'
  ) {
    return (payload as { data: { project: ProjectRecord } }).data.project;
  }
  if (
    'project' in payload &&
    typeof (payload as { project: unknown }).project === 'object' &&
    (payload as { project: unknown }).project !== null
  ) {
    return (payload as { project: ProjectRecord }).project;
  }
  return null;
}

export function OutlineForm({
  project,
  deepseekConfigured,
}: OutlineFormProps) {
  const router = useRouter();
  const template = useMemo(() => getOutlineTemplate('gov_feasibility_2023'), []);
  const allLeafIds = useMemo(
    () => listSelectableChapters(template).map(node => node.id),
    [template],
  );
  const requiredLeafIds = useMemo(
    () =>
      defaultSelectedChapterIds({
        involvesLandAcquisition: project.basicInfo.involvesLandAcquisition,
      }),
    [project.basicInfo.involvesLandAcquisition],
  );

  const [selected, setSelected] = useState<string[]>(
    project.outlineConfig?.selectedChapterIds ?? requiredLeafIds,
  );
  const [targetWords, setTargetWords] = useState(
    project.outlineConfig?.targetWords ?? 80000,
  );
  const [targetWordsText, setTargetWordsText] = useState(
    String(project.outlineConfig?.targetWords ?? 80000),
  );
  const [chapters, setChapters] = useState<ReportChapter[]>(
    project.reportChapters ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const basisOk = Boolean(project.basisConfirmedAt);
  const needsLlm = selectionNeedsLlm(selected, template.id);
  const pendingCount = chapters.filter(
    item => item.status === 'pending' || item.status === 'failed',
  ).length;
  const doneCount = chapters.filter(item => item.status === 'done').length;
  const canContinue = chapters.length > 0 && pendingCount > 0;

  const toggle = (id: string, value: boolean) => {
    setSelected(current => {
      if (value) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter(item => item !== id);
    });
  };

  const renderTree = (nodes: OutlineNode[], depth = 0): ReactNode =>
    nodes.map(node => {
      const isLeaf = !node.children || node.children.length === 0;
      return (
        <li key={node.id}>
          <div
            className={cn(
              'flex items-start gap-3 rounded-md px-2 py-2',
              isLeaf && 'hover:bg-[var(--app-tint)]/60',
            )}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {isLeaf ? (
              <Checkbox
                checked={selectedSet.has(node.id)}
                disabled={generating}
                className="mt-0.5"
                onCheckedChange={value => toggle(node.id, value === true)}
              />
            ) : (
              <span className="mt-0.5 inline-block h-4 w-4" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-sm',
                  isLeaf
                    ? 'text-[var(--app-ink)]'
                    : 'font-medium text-[var(--app-ink)]',
                )}
              >
                {node.id} {node.title}
                {node.optional ? (
                  <span className="ml-2 text-xs text-[var(--app-muted)]">
                    可选
                  </span>
                ) : null}
                {node.programmatic ? (
                  <span className="ml-2 text-xs text-[var(--app-accent)]">
                    规则渲染
                  </span>
                ) : null}
                {node.noLlm ? (
                  <span className="ml-2 text-xs text-[var(--app-muted)]">
                    不调模型
                  </span>
                ) : null}
                {node.deferLast ? (
                  <span className="ml-2 text-xs text-[var(--app-muted)]">
                    收尾智写
                  </span>
                ) : null}
              </p>
              {isLeaf ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-[var(--app-muted)]">
                  {node.writingGuide}
                </p>
              ) : null}
            </div>
          </div>
          {node.children?.length ? (
            <ul>{renderTree(node.children, depth + 1)}</ul>
          ) : null}
        </li>
      );
    });

  const clampTargetWords = (value: number) =>
    Math.min(300000, Math.max(3000, value || 80000));

  const commitTargetWords = (raw: string) => {
    const words = clampTargetWords(Number(raw));
    setTargetWords(words);
    setTargetWordsText(String(words));
    return words;
  };

  const saveOutline = async () => {
    if (!basisOk) {
      toast.error('请先确认编制依据');
      return;
    }
    if (selected.length < 1) {
      toast.error('请至少勾选一章');
      return;
    }
    const words = commitTargetWords(targetWordsText);
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveOutline',
          outlineId: template.id,
          selectedChapterIds: selected,
          targetWords: words,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '保存失败'));
        return;
      }
      const saved = readProjectFromPayload(payload);
      if (saved?.reportChapters) {
        setChapters(saved.reportChapters);
      }
      toast.success('大纲已保存（已完成章节会保留）');
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const runQueue = async (queue: string[]) => {
    let failed = false;
    for (const chapterId of queue) {
      setCurrentId(chapterId);
      const genRes = await fetch(`/api/projects/${project.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateChapter', chapterId }),
      });
      const genPayload: unknown = await genRes.json();
      const saved = readProjectFromPayload(genPayload);
      if (saved?.reportChapters) {
        setChapters(saved.reportChapters);
      }
      if (!genRes.ok) {
        failed = true;
        toast.error(errorMessage(genPayload, `章节 ${chapterId} 生成失败`));
        break;
      }
      const complete =
        typeof genPayload === 'object' &&
        genPayload !== null &&
        'data' in genPayload &&
        typeof (genPayload as { data: { complete?: unknown } }).data ===
          'object' &&
        (genPayload as { data: { complete?: unknown } }).data !== null &&
        (genPayload as { data: { complete?: boolean } }).data.complete === true;
      if (complete) {
        toast.success('全部章节已智写完成');
        router.push(`/projects/${project.id}/report`);
        router.refresh();
        return true;
      }
    }
    if (!failed) {
      toast.success('生成流程结束');
      router.push(`/projects/${project.id}/report`);
      router.refresh();
      return true;
    }
    router.refresh();
    return false;
  };

  const startGenerate = async (mode: 'full' | 'continue') => {
    if (!basisOk) {
      toast.error('请先确认编制依据');
      return;
    }
    if (needsLlm && !deepseekConfigured) {
      toast.error('请先在设置中配置 DeepSeek API Key');
      return;
    }
    if (selected.length < 1) {
      toast.error('请至少勾选一章');
      return;
    }

    setGenerating(true);
    try {
      const words = commitTargetWords(targetWordsText);
      const saveRes = await fetch(`/api/projects/${project.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveOutline',
          outlineId: template.id,
          selectedChapterIds: selected,
          targetWords: words,
        }),
      });
      const savePayload: unknown = await saveRes.json();
      if (!saveRes.ok) {
        toast.error(errorMessage(savePayload, '保存大纲失败'));
        return;
      }

      const startRes = await fetch(`/api/projects/${project.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'startGenerate', mode }),
      });
      const startPayload: unknown = await startRes.json();
      if (!startRes.ok) {
        toast.error(errorMessage(startPayload, '启动生成失败'));
        return;
      }

      const startData =
        typeof startPayload === 'object' &&
        startPayload !== null &&
        'data' in startPayload
          ? (startPayload as {
              data: {
                queue?: string[];
                project?: ProjectRecord;
                complete?: boolean;
              };
            }).data
          : null;

      if (startData?.project?.reportChapters) {
        setChapters(startData.project.reportChapters);
      }

      if (startData?.complete || !startData?.queue?.length) {
        toast.success('没有待生成章节');
        router.push(`/projects/${project.id}/report`);
        router.refresh();
        return;
      }

      await runQueue(startData.queue);
    } finally {
      setCurrentId(null);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {!basisOk ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          尚未锁定智能依据，请先完成上一步后再启动分章智写。
          <Link
            href={`/projects/${project.id}/basis`}
            className="ml-2 underline underline-offset-2"
          >
            去锁定
          </Link>
        </div>
      ) : null}

      {needsLlm && !deepseekConfigured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          未接入大模型 API Key，智写引擎暂不可用。
          <Link href="/settings" className="ml-2 underline underline-offset-2">
            去模型设置
          </Link>
        </div>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--app-ink)]">
            {template.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            {template.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={generating}
            onClick={() => setSelected(requiredLeafIds)}
          >
            仅必选章
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={generating}
            onClick={() => setSelected(allLeafIds)}
          >
            全选
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={generating}
            onClick={() => setSelected([])}
          >
            清空
          </Button>
        </div>
        <div className="max-w-xs space-y-2">
          <Label htmlFor="targetWords">
            目标总字数（约{' '}
            {Math.max(
              1,
              Math.round(clampTargetWords(Number(targetWordsText) || targetWords) / 700),
            )}{' '}
            页）
          </Label>
          <Input
            id="targetWords"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={targetWordsText}
            disabled={generating}
            onChange={event => {
              const raw = event.target.value.replace(/[^\d]/g, '');
              setTargetWordsText(raw);
              if (raw !== '') {
                const n = Number(raw);
                if (Number.isFinite(n)) {
                  setTargetWords(Math.min(300000, n));
                }
              }
            }}
            onBlur={() => {
              commitTargetWords(targetWordsText);
            }}
          />
          <p className="text-xs text-[var(--app-muted)]">
            范围 3,000～300,000 字。约{' '}
            {Math.max(
              1,
              Math.round(
                clampTargetWords(Number(targetWordsText) || targetWords) / 700,
              ),
            )}{' '}
            页（按约 700 字/页粗算）。已选 {selected.length}{' '}
            章由模型均分篇幅智写。1.3 由已锁定依据列表程序渲染；有材料写满论述，仅缺精确文号/未测算财务指标等才标【待补充】。已成稿章节需「智能重写」或清空后才会按新口径重写。
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] py-2">
        <ul className="max-h-[28rem] overflow-y-auto">
          {renderTree(template.tree)}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={saving || generating}
          onClick={() => {
            void saveOutline();
          }}
        >
          {saving ? '保存中…' : '保存大纲'}
        </Button>
        <Button
          type="button"
          disabled={generating || !basisOk || (needsLlm && !deepseekConfigured)}
          onClick={() => {
            void startGenerate('full');
          }}
        >
          {generating && currentId
            ? `智写中 ${currentId}…`
            : generating
              ? '引擎就绪中…'
              : '启动分章智写'}
        </Button>
        {canContinue ? (
          <Button
            type="button"
            variant="secondary"
            disabled={generating || !basisOk || (needsLlm && !deepseekConfigured)}
            onClick={() => {
              void startGenerate('continue');
            }}
          >
            继续智写（剩 {pendingCount} 章）
          </Button>
        ) : null}
        {chapters.length > 0 ? (
          <Button asChild type="button" variant="ghost">
            <Link href={`/projects/${project.id}/report`}>
              进入智能审改（{doneCount}/{chapters.length}）
            </Link>
          </Button>
        ) : null}
      </div>

      {chapters.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--app-ink)]">
            智写进度
          </h3>
          <ul className="divide-y divide-[var(--app-line)] overflow-hidden rounded-lg border border-[var(--app-line)]">
            {chapters.map(item => (
              <li
                key={item.chapterId}
                className="flex items-center justify-between gap-3 px-4 py-2 text-sm"
              >
                <span className="text-[var(--app-ink)]">{item.title}</span>
                <span
                  className={cn(
                    'text-xs',
                    item.status === 'done' && 'text-[var(--app-accent)]',
                    item.status === 'failed' && 'text-red-600',
                    item.status === 'generating' && 'text-amber-700',
                    item.status === 'pending' && 'text-[var(--app-muted)]',
                  )}
                >
                  {currentId === item.chapterId && generating
                    ? '智写中'
                    : statusLabel(item.status)}
                  {item.error ? ` · ${item.error}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
