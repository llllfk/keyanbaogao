'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  GROUP_LABEL,
  type BasisLibraryEntry,
  type BasisLibraryViewModel,
} from '@/lib/project/basis-library-shared';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

type FlatEntry = BasisLibraryEntry & {
  siteId: string;
  siteName: string;
};

type BasisLibraryBrowserProps = {
  data: BasisLibraryViewModel;
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

export function BasisLibraryBrowser({ data }: BasisLibraryBrowserProps) {
  const router = useRouter();
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [packFilter, setPackFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const flatItems: FlatEntry[] = [];
  for (const section of data.bySite) {
    for (const item of section.items) {
      if (hiddenIds.includes(item.id)) {
        continue;
      }
      flatItems.push({
        ...item,
        siteId: section.siteId,
        siteName: section.siteName,
      });
    }
  }

  const filtered = flatItems.filter(item => {
    if (siteFilter !== 'all' && item.siteId !== siteFilter) {
      return false;
    }
    if (packFilter !== 'all' && item.packId !== packFilter) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const rangeStart =
    filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const pageIds = pageItems.map(item => item.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));

  const resetPage = () => setPage(1);

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(current =>
      checked
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter(item => item !== id),
    );
  };

  const toggleSelectPage = (checked: boolean) => {
    if (checked) {
      setSelectedIds(current => [...new Set([...current, ...pageIds])]);
      return;
    }
    setSelectedIds(current => current.filter(id => !pageIds.includes(id)));
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('请先勾选要删除的条目');
      return;
    }
    if (
      !window.confirm(
        `批量删除 ${selectedIds.length} 条知识条目？\n若对应栏目仍在同步列表中，下次同步可能再次入库。`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch('/api/basis/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteItems',
          itemIds: selectedIds,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '批量删除失败'));
        return;
      }
      setHiddenIds(current => [...current, ...selectedIds]);
      setSelectedIds([]);
      toast.success('已批量删除');
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const deleteOne = async (item: FlatEntry) => {
    if (
      !window.confirm(
        `删除知识条目「${item.title}」？\n若对应栏目仍在同步列表中，下次同步可能再次入库。`,
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch('/api/basis/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteItem', itemId: item.id }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '删除失败'));
        return;
      }
      setHiddenIds(current => [...current, item.id]);
      setSelectedIds(current => current.filter(id => id !== item.id));
      toast.success('条目已删除');
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] px-5 py-5">
        <p className="text-xs font-medium tracking-wide text-[var(--app-accent)]">
          第 3 步 · 浏览核验
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[var(--app-ink)]">
          按来源 / 推荐包查看
        </h2>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          可按官网或推荐包筛选；支持单条或批量删除误入库条目。
        </p>
        <p className="mt-3 text-sm text-[var(--app-ink)]">
          当前共 <span className="font-medium">{flatItems.length}</span> 条，覆盖{' '}
          <span className="font-medium">{data.bySite.length}</span> 个官网、
          <span className="font-medium">{data.packs.length}</span> 个推荐包。
        </p>
      </div>

      {flatItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--app-line)] bg-[var(--app-paper)] px-6 py-14 text-center">
          <p className="font-[family-name:var(--font-display)] text-lg text-[var(--app-ink)]">
            还没有入库内容
          </p>
          <p className="mt-2 text-sm text-[var(--app-muted)]">
            请先完成第 2 步：添加栏目后点「同步此源」或「同步全部知识源」。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-medium text-[var(--app-muted)]">
                按来源官网
              </p>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  active={siteFilter === 'all'}
                  onClick={() => {
                    setSiteFilter('all');
                    resetPage();
                  }}
                  label={`全部 ${flatItems.length}`}
                />
                {data.bySite.map(section => {
                  const count = section.items.filter(
                    item => !hiddenIds.includes(item.id),
                  ).length;
                  if (count === 0) {
                    return null;
                  }
                  return (
                    <FilterChip
                      key={section.siteId}
                      active={siteFilter === section.siteId}
                      onClick={() => {
                        setSiteFilter(section.siteId);
                        resetPage();
                      }}
                      label={`${section.siteName} ${count}`}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-[var(--app-muted)]">
                按推荐包
              </p>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  active={packFilter === 'all'}
                  onClick={() => {
                    setPackFilter('all');
                    resetPage();
                  }}
                  label={`全部包 ${flatItems.length}`}
                />
                {data.packs.map(pack => {
                  const count = flatItems.filter(
                    item => item.packId === pack.id,
                  ).length;
                  if (count === 0) {
                    return null;
                  }
                  return (
                    <FilterChip
                      key={pack.id}
                      active={packFilter === pack.id}
                      onClick={() => {
                        setPackFilter(pack.id);
                        resetPage();
                      }}
                      label={`${pack.name} ${count}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--app-ink)]">
              <Checkbox
                checked={allPageSelected}
                onCheckedChange={checked =>
                  toggleSelectPage(checked === true)
                }
              />
              本页全选
              {selectedIds.length > 0 ? (
                <span className="text-xs text-[var(--app-muted)]">
                  （已选 {selectedIds.length}）
                </span>
              ) : null}
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={deleting || selectedIds.length === 0}
              onClick={() => {
                void deleteSelected();
              }}
            >
              {deleting ? '删除中…' : `批量删除${selectedIds.length > 0 ? `（${selectedIds.length}）` : ''}`}
            </Button>
          </div>

          <ul className="divide-y divide-[var(--app-line)] overflow-hidden rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)]">
            {pageItems.map(item => (
              <li key={item.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start gap-3">
                  <Checkbox
                    className="mt-1"
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={checked =>
                      toggleSelect(item.id, checked === true)
                    }
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium text-[var(--app-ink)]">
                      {item.title}
                      {item.docCode ? (
                        <span className="ml-1 font-normal text-[var(--app-muted)]">
                          （{item.docCode}）
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[var(--app-muted)]">
                      来源 {item.siteName}
                      {' · '}
                      {GROUP_LABEL[item.group]}
                      {item.issuer ? ` · ${item.issuer}` : ''}
                      {item.packName ? ` · 推荐包 ${item.packName}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {item.sourceUrl ? (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[var(--app-accent)] underline-offset-2 hover:underline"
                      >
                        原文
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--app-muted)]">
                        暂无原文链接
                      </span>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={deleting}
                      onClick={() => {
                        void deleteOne(item);
                      }}
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--app-muted)]">
              第 {rangeStart}–{rangeEnd} 条，共 {filtered.length} 条 · 每页{' '}
              {PAGE_SIZE} 条
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                上一页
              </Button>
              <span className="min-w-[4.5rem] text-center text-sm text-[var(--app-ink)]">
                {currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 text-xs transition-colors',
        active
          ? 'border-[var(--app-accent)] bg-[var(--app-accent)] text-white'
          : 'border-[var(--app-line)] bg-[var(--app-tint)]/40 text-[var(--app-muted)] hover:border-[var(--app-accent)]/40 hover:text-[var(--app-ink)]',
      )}
    >
      {label}
    </button>
  );
}
