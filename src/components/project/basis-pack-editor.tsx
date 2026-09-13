'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PackRow = {
  id: string;
  name: string;
  description: string;
  matchAlways: boolean;
  matchKeywords: string;
  itemCount: number;
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

const emptyDraft = {
  name: '',
  description: '',
  matchAlways: false,
  matchKeywords: '',
};

export function BasisPackEditor() {
  const router = useRouter();
  const [packs, setPacks] = useState<PackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);

  const dialogOpen = editingId !== null;
  const isNew = editingId === '__new__';

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/basis/packs');
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '加载推荐包失败'));
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (payload as { data: { packs?: PackRow[] } }).data
          : null;
      setPacks(data?.packs ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const startCreate = () => {
    setDraft(emptyDraft);
    setEditingId('__new__');
  };

  const startEdit = (pack: PackRow) => {
    setDraft({
      name: pack.name,
      description: pack.description,
      matchAlways: pack.matchAlways,
      matchKeywords: pack.matchKeywords,
    });
    setEditingId(pack.id);
  };

  const closeDialog = () => {
    if (saving) {
      return;
    }
    setEditingId(null);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error('请填写推荐包名称');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/basis/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isNew
            ? {
                action: 'create',
                name: draft.name.trim(),
                description: draft.description.trim(),
                matchAlways: draft.matchAlways,
                matchKeywords: draft.matchKeywords.trim(),
              }
            : {
                action: 'update',
                packId: editingId,
                name: draft.name.trim(),
                description: draft.description.trim(),
                matchAlways: draft.matchAlways,
                matchKeywords: draft.matchKeywords.trim(),
              },
        ),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '保存失败'));
        return;
      }
      toast.success(isNew ? '已新建推荐包' : '已保存');
      setEditingId(null);
      await load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (packId: string, name: string) => {
    if (
      !window.confirm(
        `确定删除推荐包「${name}」？其中的依据条目也会一并删除。`,
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/basis/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', packId }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '删除失败'));
        return;
      }
      toast.success('已删除');
      if (editingId === packId) {
        setEditingId(null);
      }
      await load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] px-5 py-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-[var(--app-accent)]">
            第 1 步 · 推荐策略
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[var(--app-ink)]">
            配置推荐包
          </h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            推荐包只管「项目自动召回」，不管「按哪个官网浏览」。例如含「河南」才推地方文件；勾选「全量推荐」则几乎所有项目都会看到该包。
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={startCreate}
        >
          新建推荐包
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isNew ? '新建推荐包' : '编辑推荐包'}
            </DialogTitle>
            <DialogDescription>
              {isNew
                ? '设置名称与匹配规则，决定哪类项目会自动召回该包内文件。'
                : '修改后立即影响后续项目的智能依据召回。'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="pack-name">名称 *</Label>
              <Input
                id="pack-name"
                value={draft.name}
                maxLength={100}
                placeholder="例如：市政桥梁标准"
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pack-desc">说明</Label>
              <Input
                id="pack-desc"
                value={draft.description}
                maxLength={500}
                placeholder="用途说明，可选"
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pack-keywords">匹配关键词</Label>
              <Input
                id="pack-keywords"
                value={draft.matchKeywords}
                maxLength={200}
                placeholder="河南,道路,防火（逗号分隔）"
                disabled={draft.matchAlways}
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    matchKeywords: event.target.value,
                  }))
                }
              />
              <p className="text-[11px] text-[var(--app-muted)]">
                对照建设地点 / 细分领域 / 行业；出现任一关键词即推荐本包。
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--app-ink)]">
              <Checkbox
                checked={draft.matchAlways}
                onCheckedChange={checked =>
                  setDraft(current => ({
                    ...current,
                    matchAlways: checked === true,
                  }))
                }
              />
              所有项目默认推荐
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={closeDialog}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => {
                void save();
              }}
            >
              {saving ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-sm text-[var(--app-muted)]">加载中…</p>
      ) : packs.length === 0 ? (
        <p className="text-sm text-[var(--app-muted)]">暂无推荐包</p>
      ) : (
        <ul className="divide-y divide-[var(--app-line)] overflow-hidden rounded-lg border border-[var(--app-line)]">
          {packs.map(pack => (
            <li
              key={pack.id}
              className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--app-ink)]">
                  {pack.name}
                  <span className="ml-2 font-normal text-xs text-[var(--app-muted)]">
                    {pack.itemCount} 条
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-[var(--app-muted)]">
                  {pack.description || '无说明'}
                </p>
                <p className="mt-1 text-[11px] text-[var(--app-muted)]">
                  {pack.matchAlways
                    ? '匹配：所有项目默认推荐'
                    : pack.matchKeywords
                      ? `匹配关键词：${pack.matchKeywords}`
                      : pack.id === 'pack_finance_eval'
                        ? '匹配：启用财务分析时'
                        : '匹配：未设置（仅手动写入栏目时选用）'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => startEdit(pack)}
                >
                  编辑
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => {
                    void remove(pack.id, pack.name);
                  }}
                >
                  删除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
