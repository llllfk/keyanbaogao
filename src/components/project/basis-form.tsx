'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BasisItem, ProjectRecord } from '@/lib/project/schema';
import { cn } from '@/lib/utils';

type PackSummary = {
  id: string;
  name: string;
  description: string;
};

type BasisFormProps = {
  project: ProjectRecord;
  initialItems: BasisItem[];
  matchedPacks: PackSummary[];
};

const GROUP_LABEL: Record<BasisItem['group'], string> = {
  policy: '主要规划及产业政策',
  standard: '主要标准规范',
  project: '本项目批复 / 委托',
};

const PAGE_SIZE = 10;

const GROUP_KEYS = ['policy', 'standard', 'project'] as const;

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

export function BasisForm({
  project,
  initialItems,
  matchedPacks,
}: BasisFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<BasisItem[]>(initialItems);
  const [pending, startTransition] = useTransition();
  const [drafting, setDrafting] = useState(false);
  const [aiPicking, setAiPicking] = useState(false);
  const [manual, setManual] = useState({
    group: 'project' as BasisItem['group'],
    title: '',
    docCode: '',
    issuer: '',
    sourceUrl: '',
    sourceSite: '',
  });
  const [pages, setPages] = useState<Record<BasisItem['group'], number>>({
    policy: 1,
    standard: 1,
    project: 1,
  });
  const [searches, setSearches] = useState<Record<BasisItem['group'], string>>({
    policy: '',
    standard: '',
    project: '',
  });

  const packs = matchedPacks;

  const groupedAll = useMemo(() => {
    const map: Record<BasisItem['group'], BasisItem[]> = {
      policy: [],
      standard: [],
      project: [],
    };
    for (const item of items) {
      map[item.group].push(item);
    }
    // 组内：已勾选置顶，其余保持召回顺序
    for (const group of GROUP_KEYS) {
      map[group].sort((a, b) => Number(b.selected) - Number(a.selected));
    }
    return map;
  }, [items]);

  const matchItem = (item: BasisItem, query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return true;
    }
    const hay = [item.title, item.docCode, item.issuer, item.sourceSite]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  };

  const selectedCount = items.filter(item => item.selected).length;

  const setGroupPage = (group: BasisItem['group'], page: number) => {
    setPages(current => ({ ...current, [group]: page }));
  };

  const setGroupSearch = (group: BasisItem['group'], value: string) => {
    setSearches(current => ({ ...current, [group]: value }));
    setPages(current => ({ ...current, [group]: 1 }));
  };

  const persist = async (confirm: boolean) => {
    const response = await fetch(`/api/projects/${project.id}?mode=basis`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, confirm }),
    });
    const data: unknown = await response.json();
    if (!response.ok) {
      throw new Error(errorMessage(data, '保存失败'));
    }
    return data;
  };

  const saveDraft = async () => {
    setDrafting(true);
    try {
      await persist(false);
      toast.success('依据草稿已保存');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setDrafting(false);
    }
  };

  const confirmAndNext = () => {
    startTransition(async () => {
      try {
        await persist(true);
        // 以服务端最新项目状态决定下一步，避免沿用打开页面时的旧开关
        let goFinance = project.basicInfo.doFinancialAnalysis;
        try {
          const latest = await fetch(`/api/projects/${project.id}`);
          const payload: unknown = await latest.json();
          if (
            latest.ok &&
            typeof payload === 'object' &&
            payload !== null &&
            'data' in payload
          ) {
            const flag = (
              payload as {
                data: {
                  project?: { basicInfo?: { doFinancialAnalysis?: boolean } };
                };
              }
            ).data?.project?.basicInfo?.doFinancialAnalysis;
            if (typeof flag === 'boolean') {
              goFinance = flag;
            }
          }
        } catch {
          // 回退到页面初始 props
        }
        toast.success(
          goFinance ? '编制依据已确认，进入财务测算' : '编制依据已确认',
        );
        window.location.assign(
          goFinance
            ? `/projects/${project.id}/finance`
            : `/projects/${project.id}/outline`,
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '确认失败');
      }
    });
  };

  const toggleItem = (id: string, selected: boolean) => {
    setItems(current =>
      current.map(item => (item.id === id ? { ...item, selected } : item)),
    );
    // 勾选变化后置顶，回到该组第 1 页便于看到
    const group = items.find(item => item.id === id)?.group;
    if (group) {
      setGroupPage(group, 1);
    }
  };

  const selectAll = (selected: boolean) => {
    setItems(current => current.map(item => ({ ...item, selected })));
  };

  const aiRecommendSelect = async () => {
    setAiPicking(true);
    try {
      const response = await fetch(
        `/api/projects/${project.id}/basis/ai-recommend`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        },
      );
      const data: unknown = await response.json();
      if (!response.ok) {
        throw new Error(errorMessage(data, 'AI 勾选失败'));
      }
      const selectedIds =
        typeof data === 'object' &&
        data !== null &&
        'data' in data &&
        typeof (data as { data: unknown }).data === 'object' &&
        (data as { data: { selectedIds?: unknown } }).data !== null &&
        Array.isArray(
          (data as { data: { selectedIds: unknown } }).data.selectedIds,
        )
          ? (
              data as { data: { selectedIds: unknown[] } }
            ).data.selectedIds.filter(
              (id): id is string => typeof id === 'string',
            )
          : [];
      if (selectedIds.length === 0) {
        throw new Error('AI 未返回有效勾选');
      }
      const idSet = new Set(selectedIds);
      setItems(current =>
        current.map(item => {
          if (item.group === 'project') {
            return item;
          }
          return { ...item, selected: idSet.has(item.id) };
        }),
      );
      const reason =
        typeof data === 'object' &&
        data !== null &&
        'data' in data &&
        typeof (data as { data: { reason?: unknown } }).data?.reason === 'string'
          ? (data as { data: { reason: string } }).data.reason.trim()
          : '';
      toast.success(
        reason
          ? `AI 已勾选 ${selectedIds.length} 条：${reason}`
          : `AI 已勾选 ${selectedIds.length} 条，请复核后锁定`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 勾选失败');
    } finally {
      setAiPicking(false);
    }
  };

  const removeManual = (id: string) => {
    setItems(current => current.filter(item => item.id !== id));
  };

  const addManual = () => {
    const title = manual.title.trim();
    if (!title) {
      toast.error('请填写文件名称');
      return;
    }
    const item: BasisItem = {
      id: crypto.randomUUID(),
      group: manual.group,
      title,
      docCode: manual.docCode.trim(),
      issuer: manual.issuer.trim(),
      sourceUrl: manual.sourceUrl.trim(),
      sourceSite: manual.sourceSite.trim(),
      source: 'manual',
      packId: '',
      selected: true,
    };
    setItems(current => [...current, item]);
    setManual({
      group: 'project',
      title: '',
      docCode: '',
      issuer: '',
      sourceUrl: '',
      sourceSite: '',
    });
    toast.success('已添加本项目依据');
  };

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-[var(--app-line)] bg-[var(--app-tint)]/40 px-4 py-4">
        <p className="text-sm text-[var(--app-ink)]">
          已按项目画像从智能依据库召回{' '}
          <span className="font-medium">{packs.length}</span>{' '}
          个智能包中的候选（共 {items.length} 条）。可点「AI
          智能勾选」让模型在候选内二次筛选；也可手工勾选。智写只用最终锁定的条目。也可打开{' '}
          <Link
            href="/basis"
            className="text-[var(--app-accent)] underline-offset-2 hover:underline"
          >
            智能依据库
          </Link>{' '}
          管理知识源。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={aiPicking || pending || drafting || items.length === 0}
            onClick={() => void aiRecommendSelect()}
          >
            {aiPicking ? 'AI 勾选中…' : 'AI 智能勾选'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={aiPicking || pending || drafting}
            onClick={() => selectAll(false)}
          >
            清空勾选
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={aiPicking || pending || drafting}
            onClick={() => selectAll(true)}
          >
            全选候选
          </Button>
        </div>
        {packs.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {packs.map(pack => (
              <li
                key={pack.id}
                className="rounded-full border border-[var(--app-line)] bg-white px-3 py-1 text-xs text-[var(--app-muted)]"
                title={pack.description}
              >
                {pack.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            暂无智能召回结果，请手填本项目批复，或完善行业 / 地区 / 细分领域后重试。
          </p>
        )}
        {project.basisConfirmedAt ? (
          <p className="mt-2 text-xs text-[var(--app-muted)]">
            上次确认：{new Date(project.basisConfirmedAt).toLocaleString('zh-CN')}
          </p>
        ) : null}
        {project.basicInfo.doFinancialAnalysis ? (
          <p className="mt-3 rounded-md border border-[var(--app-accent)]/30 bg-[var(--app-tint)] px-3 py-2 text-sm text-[var(--app-ink)]">
            已启用财务测算：锁定依据后将进入测算页（顶栏应出现「财务测算」步骤）。
          </p>
        ) : (
          <p className="mt-3 text-xs text-[var(--app-muted)]">
            当前未启用财务测算。若要测算，请返回信息采集选择「做简化财务测算」并重新保存。
          </p>
        )}
      </section>

      {GROUP_KEYS.map(group => {
        const allInGroup = groupedAll[group];
        const query = searches[group];
        const groupItems = allInGroup.filter(item => matchItem(item, query));
        const totalPages = Math.max(1, Math.ceil(groupItems.length / PAGE_SIZE));
        const currentPage = Math.min(pages[group], totalPages);
        const pageItems = groupItems.slice(
          (currentPage - 1) * PAGE_SIZE,
          currentPage * PAGE_SIZE,
        );
        const rangeStart =
          groupItems.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
        const rangeEnd = Math.min(currentPage * PAGE_SIZE, groupItems.length);
        const selectedInGroup = allInGroup.filter(item => item.selected).length;
        const queryTrimmed = query.trim();

        return (
          <section key={group} className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--app-ink)]">
                  {GROUP_LABEL[group]}
                </h2>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  已选 {selectedInGroup}/{allInGroup.length}
                  {queryTrimmed
                    ? ` · 匹配 ${groupItems.length} 条`
                    : ''}
                </p>
              </div>
              <div className="w-full sm:max-w-xs">
                <Label htmlFor={`basis-search-${group}`} className="sr-only">
                  查询{GROUP_LABEL[group]}
                </Label>
                <Input
                  id={`basis-search-${group}`}
                  value={query}
                  placeholder="本类内按名称/文号查询…"
                  onChange={event =>
                    setGroupSearch(group, event.target.value)
                  }
                />
              </div>
            </div>
            {allInGroup.length === 0 ? (
              <p className="rounded-md border border-dashed border-[var(--app-line)] px-3 py-6 text-center text-sm text-[var(--app-muted)]">
                暂无条目
              </p>
            ) : groupItems.length === 0 ? (
              <p className="rounded-md border border-dashed border-[var(--app-line)] px-3 py-6 text-center text-sm text-[var(--app-muted)]">
                无匹配条目
              </p>
            ) : (
              <>
                <ul className="space-y-2">
                  {pageItems.map(item => (
                    <li
                      key={item.id}
                      className={cn(
                        'flex items-start gap-3 rounded-md border border-[var(--app-line)] bg-white px-3 py-3',
                        item.selected &&
                          'border-[var(--app-accent)] bg-[var(--app-tint)]/30',
                      )}
                    >
                      <Checkbox
                        checked={item.selected}
                        className="mt-1"
                        onCheckedChange={value =>
                          toggleItem(item.id, value === true)
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--app-ink)]">
                          {item.title}
                          {item.docCode ? (
                            <span className="ml-1 font-normal text-[var(--app-muted)]">
                              （{item.docCode}）
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-[var(--app-muted)]">
                          {[
                            item.sourceSite || null,
                            item.issuer,
                            item.source === 'manual' ? '本项目补充' : '依据包',
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                          {item.sourceUrl ? (
                            <>
                              {' · '}
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--app-accent)] underline-offset-2 hover:underline"
                              >
                                原文
                              </a>
                            </>
                          ) : null}
                        </p>
                      </div>
                      {item.source === 'manual' ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-[var(--app-muted)]"
                          onClick={() => removeManual(item.id)}
                        >
                          删除
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {groupItems.length > PAGE_SIZE ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--app-muted)]">
                    <span>
                      第 {rangeStart}–{rangeEnd} 条，共 {groupItems.length} 条 ·
                      每页 {PAGE_SIZE} 条
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={currentPage <= 1}
                        onClick={() => setGroupPage(group, currentPage - 1)}
                      >
                        上一页
                      </Button>
                      <span>
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={currentPage >= totalPages}
                        onClick={() => setGroupPage(group, currentPage + 1)}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        );
      })}

      <section className="space-y-4 border-t border-[var(--app-line)] pt-8">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--app-ink)]">
            手填本项目依据
          </h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            批复、委托书等项目专属文件请在此添加（可不存原文，填名称与文号即可）。
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>类型</Label>
            <Select
              value={manual.group}
              onValueChange={value =>
                setManual(current => ({
                  ...current,
                  group: value as BasisItem['group'],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">本项目批复 / 委托</SelectItem>
                <SelectItem value="policy">规划及产业政策</SelectItem>
                <SelectItem value="standard">标准规范</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>文件名称 *</Label>
            <Input
              value={manual.title}
              maxLength={300}
              placeholder="如：××项目建议书批复"
              onChange={event =>
                setManual(current => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>文号 / 标准号</Label>
            <Input
              value={manual.docCode}
              maxLength={100}
              placeholder="可空"
              onChange={event =>
                setManual(current => ({
                  ...current,
                  docCode: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>发文单位</Label>
            <Input
              value={manual.issuer}
              maxLength={100}
              placeholder="可空"
              onChange={event =>
                setManual(current => ({
                  ...current,
                  issuer: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>来源网站</Label>
            <Input
              value={manual.sourceSite}
              maxLength={100}
              placeholder="可选，如：本市发改委"
              onChange={event =>
                setManual(current => ({
                  ...current,
                  sourceSite: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>原文链接</Label>
            <Input
              value={manual.sourceUrl}
              maxLength={500}
              placeholder="可选，官方详情页 URL"
              onChange={event =>
                setManual(current => ({
                  ...current,
                  sourceUrl: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <Button type="button" variant="outline" onClick={addManual}>
          添加条目
        </Button>
      </section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-line)] bg-[var(--app-paper)]/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-b-xl">
        <p className="text-sm text-[var(--app-muted)]">
          当前已选 <span className="text-[var(--app-ink)]">{selectedCount}</span> /{' '}
          {items.length} 条
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={aiPicking || drafting || pending || items.length === 0}
            onClick={() => void aiRecommendSelect()}
          >
            {aiPicking ? 'AI 勾选中…' : 'AI 智能勾选'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={aiPicking || drafting || pending || items.length === 0}
            onClick={() => selectAll(true)}
          >
            全选候选
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={aiPicking || drafting || pending || selectedCount === 0}
            onClick={() => selectAll(false)}
          >
            清空勾选
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={aiPicking || drafting || pending}
            onClick={() => {
              void saveDraft();
            }}
          >
            {drafting ? '保存中…' : '保存草稿'}
          </Button>
          <Button
            type="button"
            disabled={pending || drafting || selectedCount < 1}
            onClick={confirmAndNext}
          >
            {pending
              ? '确认中…'
              : project.basicInfo.doFinancialAnalysis
                ? '锁定依据并进入财务测算'
                : '锁定依据并进入分章智写'}
          </Button>
        </div>
      </div>
    </div>
  );
}
