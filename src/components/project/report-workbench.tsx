'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ProjectRecord, ReportChapter } from '@/lib/project/schema';
import { sortChaptersForDocument } from '@/lib/project/outline';
import { cn } from '@/lib/utils';

type ReportWorkbenchProps = {
  project: ProjectRecord;
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

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .trim();
}

/** 预览正文：全文同一套宋体；标题仅加粗。识别 ### 与「1.2.1 标题」行 */
function ChapterContentView({
  content,
  chapterTitle,
}: {
  content: string;
  chapterTitle: string;
}) {
  const nodes = useMemo(() => {
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const result: ReactNode[] = [];
    const titleNorm = chapterTitle.replace(/\s+/g, '');
    let skippedDuplicateTitle = false;

    const isDuplicateTitle = (text: string) => {
      const plain = text.replace(/\s+/g, '');
      return (
        plain === titleNorm ||
        titleNorm.includes(plain) ||
        plain.includes(titleNorm)
      );
    };

    for (let i = 0; i < lines.length; i += 1) {
      const trimmed = (lines[i] ?? '').trim();

      if (!trimmed) {
        result.push(<div key={`sp-${i}`} className="h-3" />);
        continue;
      }

      let headingText: string | null = null;
      let headingLevel = 3;

      const mdHeading = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (mdHeading) {
        headingLevel = mdHeading[1].length;
        headingText = stripInlineMarkdown(mdHeading[2]);
      } else {
        // 无 # 的编号小标题：1.2 / 1.2.1 / 1.3.1 标题…
        const numbered = trimmed.match(/^(\d+(?:\.\d+){1,3})\s+(.+)$/);
        if (numbered && numbered[2].length <= 40 && !/[。；;]$/.test(numbered[2])) {
          headingLevel = numbered[1].split('.').length + 1;
          headingText = stripInlineMarkdown(`${numbered[1]} ${numbered[2]}`);
        }
      }

      if (headingText) {
        if (!skippedDuplicateTitle && isDuplicateTitle(headingText)) {
          skippedDuplicateTitle = true;
          continue;
        }
        result.push(
          <p
            key={`h-${i}`}
            className={cn(
              'font-bold text-[var(--app-ink)] [font-family:var(--font-report)]',
              headingLevel <= 2 ? 'mt-5 mb-2 text-[15px]' : 'mt-4 mb-1.5 text-sm',
            )}
          >
            {headingText}
          </p>,
        );
        continue;
      }

      if (!skippedDuplicateTitle && isDuplicateTitle(stripInlineMarkdown(trimmed))) {
        skippedDuplicateTitle = true;
        continue;
      }

      const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
      if (bulletMatch) {
        result.push(
          <p
            key={`b-${i}`}
            className="mb-2 pl-4 text-sm leading-7 [font-family:var(--font-report)]"
          >
            · {stripInlineMarkdown(bulletMatch[1])}
          </p>,
        );
        continue;
      }

      result.push(
        <p
          key={`p-${i}`}
          className="mb-2 text-sm leading-7 text-[var(--app-ink)] [font-family:var(--font-report)]"
        >
          {stripInlineMarkdown(trimmed)}
        </p>,
      );
    }

    return result;
  }, [content, chapterTitle]);

  return (
    <div className="space-y-0 [font-family:var(--font-report)]">{nodes}</div>
  );
}

export function ReportWorkbench({ project }: ReportWorkbenchProps) {
  const router = useRouter();
  const outlineId = project.outlineConfig?.outlineId;
  const [chapters, setChapters] = useState<ReportChapter[]>(() =>
    sortChaptersForDocument(project.reportChapters ?? [], outlineId),
  );
  const [activeId, setActiveId] = useState(
    chapters.find(item => item.status === 'done')?.chapterId ??
      chapters[0]?.chapterId ??
      '',
  );
  const [rewriting, setRewriting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState('');

  const active: ReportChapter | undefined = useMemo(
    () => chapters.find(item => item.chapterId === activeId) ?? chapters[0],
    [activeId, chapters],
  );

  const supportsRewriteHint = Boolean(
    active &&
      active.chapterId !== '1.3' &&
      !active.chapterId.startsWith('11'),
  );

  const selectChapter = (chapterId: string) => {
    setActiveId(chapterId);
    setRewriteInstruction('');
  };

  const rewriteChapter = async () => {
    if (!active) {
      return;
    }
    setRewriting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateChapter',
          chapterId: active.chapterId,
          rewriteInstruction: supportsRewriteHint
            ? rewriteInstruction.trim() || undefined
            : undefined,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '重写失败'));
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'project' in payload &&
          typeof (payload as { project: { reportChapters?: ReportChapter[] } })
            .project === 'object' &&
          (payload as { project: { reportChapters?: ReportChapter[] } }).project
            ?.reportChapters
        ) {
          setChapters(
            (payload as { project: { reportChapters: ReportChapter[] } })
              .project.reportChapters,
          );
        }
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (payload as {
              data: { project?: ProjectRecord; chapter?: ReportChapter };
            }).data
          : null;
      if (data?.project?.reportChapters) {
        setChapters(
          sortChaptersForDocument(
            data.project.reportChapters,
            project.outlineConfig?.outlineId,
          ),
        );
      } else if (data?.chapter) {
        setChapters(current =>
          current.map(item =>
            item.chapterId === data.chapter!.chapterId ? data.chapter! : item,
          ),
        );
      }
      setRewriteInstruction('');
      toast.success('本章已智能重写');
      router.refresh();
    } finally {
      setRewriting(false);
    }
  };

  const exportDocx = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/export/docx`);
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        toast.error(errorMessage(payload, '导出失败'));
        return;
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
      const fileName = match?.[1]
        ? decodeURIComponent(match[1])
        : '可研报告初稿.docx';
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success('Word 已开始下载');
      router.refresh();
    } catch {
      toast.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  if (chapters.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-[var(--app-muted)]">
          尚无 AI 初稿。请先在「分章智写」勾选章节并启动引擎。
        </p>
        <Button asChild className="mt-6">
          <Link href={`/projects/${project.id}/outline`}>去分章智写</Link>
        </Button>
      </div>
    );
  }

  const doneCount = chapters.filter(
    item => item.status === 'done' || Boolean(item.content?.trim()),
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--app-muted)]">
          AI 初稿已成 {doneCount}/{chapters.length} 章
        </p>
        <Button
          type="button"
          disabled={exporting || doneCount < 1}
          onClick={() => {
            void exportDocx();
          }}
        >
          {exporting ? '导出中…' : '导出 Word'}
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-[var(--app-line)] bg-[var(--app-tint)]/30 p-3">
          <p className="mb-2 px-2 text-xs font-medium tracking-wide text-[var(--app-muted)] uppercase">
            目录
          </p>
          <ul className="max-h-[70vh] space-y-0.5 overflow-y-auto">
            {chapters.map(item => (
              <li key={item.chapterId}>
                <button
                  type="button"
                  onClick={() => selectChapter(item.chapterId)}
                  className={cn(
                    'w-full rounded-md px-2 py-2 text-left text-sm transition-colors',
                    active?.chapterId === item.chapterId
                      ? 'bg-[var(--app-accent)] text-white'
                      : 'text-[var(--app-ink)] hover:bg-[var(--app-tint)]',
                  )}
                >
                  <span className="line-clamp-2">{item.title}</span>
                  <span
                    className={cn(
                      'mt-1 block text-[10px]',
                      active?.chapterId === item.chapterId
                        ? 'text-white/80'
                        : 'text-[var(--app-muted)]',
                    )}
                  >
                    {item.status === 'done'
                      ? '已成稿'
                      : item.status === 'failed'
                        ? '失败'
                        : item.status === 'generating'
                          ? '智写中'
                          : '待智写'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <article className="rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] px-5 py-6 sm:px-8">
          {active ? (
            <>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--app-line)] pb-4">
                <h2 className="text-xl font-bold text-[var(--app-ink)] [font-family:var(--font-report)]">
                  {active.title}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={exporting || rewriting}
                    onClick={() => {
                      void exportDocx();
                    }}
                  >
                    {exporting ? '导出中…' : '导出 Word'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={rewriting || exporting}
                    onClick={() => {
                      void rewriteChapter();
                    }}
                  >
                    {rewriting ? '智写中…' : '智能重写本章'}
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/projects/${project.id}/outline`}>返回分章智写</Link>
                  </Button>
                </div>
              </div>

              {supportsRewriteHint ? (
                <div className="mb-5 space-y-2">
                  <Label htmlFor="rewrite-instruction">
                    优化指令（可选）
                  </Label>
                  <Textarea
                    id="rewrite-instruction"
                    value={rewriteInstruction}
                    maxLength={1000}
                    disabled={rewriting || exporting}
                    placeholder="例如：语气更正式、补充建设必要性论述、控制在约 3000 字、少写套话…"
                    className="min-h-[72px]"
                    onChange={event =>
                      setRewriteInstruction(event.target.value)
                    }
                  />
                  <p className="text-xs text-[var(--app-muted)]">
                    留空则按原提示词整章重写；填写后模型优先遵循，但仍不得编造文号与财务数字。
                  </p>
                </div>
              ) : (
                <p className="mb-5 text-xs text-[var(--app-muted)]">
                  本章为规则生成内容（编制依据或附表清单），重写将刷新固定结构，无需优化指令。
                </p>
              )}

              {active.status === 'done' || active.content ? (
                <ChapterContentView
                  content={active.content}
                  chapterTitle={active.title}
                />
              ) : (
                <p className="text-sm text-[var(--app-muted)]">
                  {active.status === 'failed'
                    ? active.error || '本章生成失败'
                    : '本章尚未生成内容'}
                </p>
              )}
              <p className="mt-8 border-t border-[var(--app-line)] pt-4 text-xs text-[var(--app-muted)]">
                本页为 AI 辅助初稿预览；正式报审须人工复核。
              </p>
            </>
          ) : null}
        </article>
      </div>
    </div>
  );
}
