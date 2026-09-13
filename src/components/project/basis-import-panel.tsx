'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PackOption = { id: string; name: string };

type PreviewState = {
  sourceUrl: string;
  siteId: string;
  siteName: string;
  suggestedPackId: string;
  suggestedGroup: 'policy' | 'standard' | 'project';
  title: string;
  docCode: string;
  issuer: string;
  fetchMode: 'document' | 'catalog';
  syncStatus: 'fetched' | 'fallback';
  packs: PackOption[];
};

type ListSourceRow = {
  id?: string;
  siteId: string;
  packId: string;
  group: 'policy' | 'standard' | 'project';
  listUrl: string;
  title: string;
  enabled: boolean;
  lastSyncedAt?: string | null;
  lastFoundCount: number;
  builtin: boolean;
};

type SyncSummary = {
  packs: number;
  items: number;
  discovered: number;
  fetched: number;
  fallback: number;
  scope?: 'all' | 'list';
  listResults: Array<{ listUrl: string; found: number; error?: string }>;
  failed: Array<{ sourceUrl: string; title: string; error: string }>;
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

export function BasisImportPanel() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [packId, setPackId] = useState('');
  const [group, setGroup] = useState<'policy' | 'standard' | 'project'>(
    'policy',
  );
  const [title, setTitle] = useState('');
  const [docCode, setDocCode] = useState('');
  const [issuer, setIssuer] = useState('');

  const [listUrl, setListUrl] = useState('');
  const [listTitle, setListTitle] = useState('');
  const [listTitleHint, setListTitleHint] = useState('');
  const [resolvingList, setResolvingList] = useState(false);
  const [listPackId, setListPackId] = useState('pack_common_gov');
  const [listGroup, setListGroup] = useState<'policy' | 'standard' | 'project'>(
    'policy',
  );
  const [addingList, setAddingList] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingListUrl, setSyncingListUrl] = useState<string | null>(null);
  const [deletingListUrl, setDeletingListUrl] = useState<string | null>(null);
  const [restoringListUrl, setRestoringListUrl] = useState<string | null>(null);
  const [listSources, setListSources] = useState<ListSourceRow[]>([]);
  const [disabledSources, setDisabledSources] = useState<ListSourceRow[]>([]);
  const [packs, setPacks] = useState<PackOption[]>([]);
  const [lastSync, setLastSync] = useState<SyncSummary | null>(null);

  const loadListSources = async () => {
    try {
      const response = await fetch('/api/basis/import');
      const payload: unknown = await response.json();
      if (!response.ok) {
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (payload as {
              data: {
                sources?: ListSourceRow[];
                disabledSources?: ListSourceRow[];
                packs?: PackOption[];
              };
            }).data
          : null;
      if (data?.sources) {
        setListSources(data.sources);
      }
      setDisabledSources(data?.disabledSources ?? []);
      if (data?.packs?.length) {
        setPacks(data.packs);
        if (!listPackId) {
          setListPackId(data.packs[0].id);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadListSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  useEffect(() => {
    const trimmed = listUrl.trim();
    if (!/^https:\/\//i.test(trimmed) || trimmed.length < 20) {
      setListTitleHint('');
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setResolvingList(true);
        try {
          const response = await fetch('/api/basis/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'previewList',
              listUrl: trimmed,
            }),
          });
          const payload: unknown = await response.json();
          if (cancelled) {
            return;
          }
          if (!response.ok) {
            setListTitleHint('');
            return;
          }
          const data =
            typeof payload === 'object' &&
            payload !== null &&
            'data' in payload
              ? (
                  payload as {
                    data: {
                      preview?: {
                        title: string;
                        suggestedPackId: string;
                        suggestedGroup: 'policy' | 'standard' | 'project';
                        siteName: string;
                      };
                    };
                  }
                ).data
              : null;
          if (!data?.preview) {
            return;
          }
          setListTitle(prev => prev.trim() || data.preview!.title);
          setListTitleHint(`已识别：${data.preview.siteName}`);
          setListPackId(data.preview.suggestedPackId);
          setListGroup(data.preview.suggestedGroup);
        } catch {
          if (!cancelled) {
            setListTitleHint('');
          }
        } finally {
          if (!cancelled) {
            setResolvingList(false);
          }
        }
      })();
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [listUrl]);

  const runPreview = async () => {
    setPreviewing(true);
    try {
      const response = await fetch('/api/basis/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', sourceUrl: url.trim() }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '解析失败'));
        setPreview(null);
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (payload as { data: { preview?: PreviewState } }).data
          : null;
      if (!data?.preview) {
        toast.error('解析结果为空');
        return;
      }
      const next = data.preview;
      setPreview(next);
      setPackId(next.suggestedPackId);
      setGroup(next.suggestedGroup);
      setTitle(next.title);
      setDocCode(next.docCode);
      setIssuer(next.issuer);
      toast.success(
        next.syncStatus === 'fetched'
          ? `已识别：${next.siteName}`
          : `已识别来源站（元数据部分兜底）：${next.siteName}`,
      );
    } finally {
      setPreviewing(false);
    }
  };

  const runImport = async () => {
    if (!preview) {
      toast.error('请先解析链接');
      return;
    }
    if (!title.trim()) {
      toast.error('请确认标题');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/basis/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          sourceUrl: preview.sourceUrl,
          packId,
          group,
          title: title.trim(),
          docCode: docCode.trim(),
          issuer: issuer.trim(),
          fetchMode: preview.fetchMode,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '入库失败'));
        return;
      }
      toast.success('已加入依据库');
      setUrl('');
      setPreview(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const runAddList = async () => {
    if (!listUrl.trim()) {
      toast.error('请填写栏目列表页链接');
      return;
    }
    setAddingList(true);
    try {
      const response = await fetch('/api/basis/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addList',
          listUrl: listUrl.trim(),
          packId: listPackId,
          group: listGroup,
          title: listTitle.trim() || undefined,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '添加栏目失败'));
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (
              payload as {
                data: { listSource?: { title?: string } };
              }
            ).data
          : null;
      const name = data?.listSource?.title?.trim();
      toast.success(
        name ? `栏目「${name}」已登记，可点「同步此源」抓取` : '栏目已登记',
      );
      setListUrl('');
      setListTitle('');
      setListTitleHint('');
      await loadListSources();
    } finally {
      setAddingList(false);
    }
  };

  const runSync = async (listUrl?: string) => {
    const scoped = Boolean(listUrl?.trim());
    if (scoped) {
      setSyncingListUrl(listUrl!.trim());
    } else {
      setSyncing(true);
    }
    try {
      const response = await fetch('/api/basis/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'runSync',
          ...(scoped ? { listUrl: listUrl!.trim() } : {}),
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '同步失败'));
        return;
      }
      const data =
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload
          ? (payload as { data: { sync?: SyncSummary } }).data
          : null;
      if (data?.sync) {
        setLastSync(data.sync);
        toast.success(
          scoped
            ? `本栏目同步完成：写入 ${data.sync.items} 条（新发现 ${data.sync.discovered}）`
            : `全部同步完成：共 ${data.sync.items} 条（栏目新发现 ${data.sync.discovered}）`,
        );
      } else {
        toast.success('同步完成');
      }
      await loadListSources();
      router.refresh();
    } finally {
      setSyncing(false);
      setSyncingListUrl(null);
    }
  };

  const runDeleteList = async (source: ListSourceRow) => {
    const label = source.title || source.listUrl;
    const okConfirm = window.confirm(
      `停用栏目「${label}」？\n之后不再同步该栏目；已入库条目仍保留。可在下方「已停用」中恢复。`,
    );
    if (!okConfirm) {
      return;
    }
    setDeletingListUrl(source.listUrl);
    try {
      const response = await fetch('/api/basis/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteList',
          listUrl: source.listUrl,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '停用失败'));
        return;
      }
      toast.success('栏目已停用');
      await loadListSources();
      router.refresh();
    } finally {
      setDeletingListUrl(null);
    }
  };

  const runRestoreList = async (source: ListSourceRow) => {
    setRestoringListUrl(source.listUrl);
    try {
      const response = await fetch('/api/basis/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restoreList',
          listUrl: source.listUrl,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        toast.error(errorMessage(payload, '恢复失败'));
        return;
      }
      toast.success(`已恢复「${source.title || '栏目'}」`);
      await loadListSources();
      router.refresh();
    } finally {
      setRestoringListUrl(null);
    }
  };

  return (
    <section className="space-y-6 rounded-xl border border-[var(--app-line)] bg-[var(--app-paper)] px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-[var(--app-accent)]">
            第 2 步 · 采集入库
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[var(--app-ink)]">
            同步官方栏目
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--app-muted)]">
            从官网列表抓取文件元数据。网站会自动识别；你只要选好「写入哪个推荐包」，决定这些文件以后推荐给谁。
          </p>
        </div>
        <Button
          type="button"
          disabled={syncing || Boolean(syncingListUrl)}
          onClick={() => {
            void runSync();
          }}
        >
          {syncing ? '全量同步中…' : '同步全部知识源'}
        </Button>
      </div>

      <div className="space-y-4 border-t border-[var(--app-line)] pt-5">
        <div>
          <h3 className="text-sm font-medium text-[var(--app-ink)]">
            （1）智能发现：官方栏目
          </h3>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            粘贴官网列表页地址。同步时由引擎自动识别正文链接并抽取标题、文号，过滤导航噪声。
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="listUrl">栏目列表页链接</Label>
            <Input
              id="listUrl"
              value={listUrl}
              placeholder="例如：https://www.ndrc.gov.cn/xxgk/zcfb/ghxwj/"
              onChange={event => {
                setListUrl(event.target.value);
                setListTitle('');
                setListTitleHint('');
              }}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="listTitle">栏目中文名称</Label>
              {resolvingList ? (
                <span className="text-[11px] text-[var(--app-muted)]">
                  正在识别…
                </span>
              ) : listTitleHint ? (
                <span className="text-[11px] text-[var(--app-accent)]">
                  {listTitleHint}
                </span>
              ) : null}
            </div>
            <Input
              id="listTitle"
              value={listTitle}
              placeholder="粘贴链接后自动识别，也可手改"
              onChange={event => setListTitle(event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-[140px_minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <Label>类型</Label>
              <Select
                value={listGroup}
                onValueChange={value =>
                  setListGroup(value as 'policy' | 'standard' | 'project')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="policy">政策</SelectItem>
                  <SelectItem value="standard">标准</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-snug text-[var(--app-muted)]">
                对应报告 1.3：政策 / 标准规范。
              </p>
            </div>
            <div className="space-y-2">
              <Label>写入推荐包</Label>
              <Select value={listPackId} onValueChange={setListPackId}>
                <SelectTrigger>
                  <SelectValue placeholder="推荐包" />
                </SelectTrigger>
                <SelectContent>
                  {(packs.length
                    ? packs
                    : [{ id: 'pack_common_gov', name: '政府投资可研通用' }]
                  ).map(pack => (
                    <SelectItem key={pack.id} value={pack.id}>
                      {pack.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-snug text-[var(--app-muted)]">
                与「按网站浏览」无关：只决定项目智能依据里会不会被召回。
              </p>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={addingList || !listUrl.trim()}
                onClick={() => {
                  void runAddList();
                }}
              >
                {addingList ? '添加中…' : '添加栏目'}
              </Button>
            </div>
          </div>
        </div>

        {listSources.length > 0 ? (
          <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
            {listSources.map(source => {
              const busy =
                syncing ||
                syncingListUrl === source.listUrl ||
                deletingListUrl === source.listUrl;
              return (
                <li
                  key={source.listUrl}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-[var(--app-line)] bg-[var(--app-tint)]/20 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--app-ink)]">
                      {source.title || '未命名栏目'}
                    </p>
                    <a
                      href={source.listUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 block break-all text-xs text-[var(--app-accent)] underline-offset-2 hover:underline"
                    >
                      {source.listUrl}
                    </a>
                    <p className="mt-1 text-xs text-[var(--app-muted)]">
                      {source.builtin ? '预置栏目' : '已添加'}
                      {source.lastSyncedAt
                        ? ` · 上次发现 ${source.lastFoundCount} 条 · ${new Date(source.lastSyncedAt).toLocaleString('zh-CN')}`
                        : ' · 尚未同步'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        void runSync(source.listUrl);
                      }}
                    >
                      {syncingListUrl === source.listUrl
                        ? '同步中…'
                        : '同步此源'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        void runDeleteList(source);
                      }}
                    >
                      {deletingListUrl === source.listUrl
                        ? '处理中…'
                        : '停用'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-[var(--app-muted)]">
            还没有栏目。可先用预置栏目点「同步此源」，或粘贴新的列表页链接添加。
          </p>
        )}

        {disabledSources.length > 0 ? (
          <div className="space-y-2 rounded-lg border border-dashed border-[var(--app-line)] px-3 py-3">
            <p className="text-xs font-medium text-[var(--app-muted)]">
              已停用栏目（可恢复）
            </p>
            <ul className="space-y-2 text-sm">
              {disabledSources.map(source => (
                <li
                  key={source.listUrl}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[var(--app-ink)]">
                      {source.title || '未命名栏目'}
                      {source.builtin ? (
                        <span className="ml-2 text-[11px] text-[var(--app-muted)]">
                          预置
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-[var(--app-muted)]">
                      {source.listUrl}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      restoringListUrl === source.listUrl ||
                      syncing ||
                      Boolean(syncingListUrl)
                    }
                    onClick={() => {
                      void runRestoreList(source);
                    }}
                  >
                    {restoringListUrl === source.listUrl
                      ? '恢复中…'
                      : '恢复'}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {lastSync ? (
          <p className="text-xs text-[var(--app-muted)]">
            最近同步
            {lastSync.scope === 'list' ? '（单栏目）' : '（全部）'}
            ：写入 {lastSync.items} 条，新发现 {lastSync.discovered}
            {lastSync.failed.length > 0
              ? `，失败 ${lastSync.failed.length}`
              : ''}
            。
          </p>
        ) : null}
      </div>

      <div className="space-y-4 border-t border-[var(--app-line)] pt-5">
        <div>
          <h3 className="text-sm font-medium text-[var(--app-ink)]">
            （2）精准确认：原文链接
          </h3>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            仅差少数文件时使用：粘贴详情页链接，AI 辅助解析元数据，确认后写入知识底座。
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={url}
            placeholder="https://www.gov.cn/... 详情页地址"
            className="flex-1"
            onChange={event => setUrl(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void runPreview();
              }
            }}
          />
          <Button
            type="button"
            disabled={previewing || !url.trim()}
            onClick={() => {
              void runPreview();
            }}
          >
            {previewing ? '解析中…' : '解析链接'}
          </Button>
        </div>

        {preview ? (
          <div className="mt-5 space-y-4 border-t border-[var(--app-line)] pt-5">
            <p className="text-sm text-[var(--app-muted)]">
              来源站：
              <span className="text-[var(--app-ink)]">{preview.siteName}</span>
              {' · '}
              <a
                href={preview.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--app-accent)] underline-offset-2 hover:underline"
              >
                打开原文
              </a>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>标题 *</Label>
                <Input
                  value={title}
                  maxLength={300}
                  onChange={event => setTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>文号 / 标准号</Label>
                <Input
                  value={docCode}
                  maxLength={100}
                  onChange={event => setDocCode(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>发文单位</Label>
                <Input
                  value={issuer}
                  maxLength={100}
                  onChange={event => setIssuer(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>类型</Label>
                <Select
                  value={group}
                  onValueChange={value =>
                    setGroup(value as 'policy' | 'standard' | 'project')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">政策</SelectItem>
                    <SelectItem value="standard">标准</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>写入推荐包</Label>
                <Select value={packId} onValueChange={setPackId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {preview.packs.map(pack => (
                      <SelectItem key={pack.id} value={pack.id}>
                        {pack.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="button"
              disabled={saving}
              onClick={() => {
                void runImport();
              }}
            >
              {saving ? '入库中…' : '确认加入依据库'}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
