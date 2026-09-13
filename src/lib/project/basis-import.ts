import { asc, eq, sql } from 'drizzle-orm';

import { getDb, getPool } from '@/lib/db';
import {
  basisListSources,
  basisPackItems,
  basisPacks,
  basisSourceUrls,
} from '@/lib/db/schema';
import {
  BASIS_AUTO_DOCUMENTS,
  BASIS_AUTO_LIST_SOURCES,
  BASIS_AUTO_PACKS,
  getSourceSite,
  isDetailSourceUrl,
  isListSourceUrl,
  resolveSiteFromUrl,
  suggestGroupForUrl,
  suggestPackIdForSite,
  type BasisAutoDocument,
  type BasisAutoListSource,
  type BasisSourceSiteId,
} from '@/lib/project/basis-auto-sources';
import {
  collectBasisSyncPayload,
  resolveAutoDocument,
  resolveListPageTitle,
  toWritableItem,
  type BasisSyncResult,
} from '@/lib/project/basis-sync';
import {
  ensureBasisPackLibrarySeeded,
  getBasisPackById,
  listBasisPackSummaries,
} from '@/lib/project/basis-library';
import type { BasisGroup } from '@/lib/project/basis-packs';

const BASIS_TABLES_SQL = `
    CREATE TABLE IF NOT EXISTS basis_packs (
      id varchar(64) PRIMARY KEY,
      name varchar(100) NOT NULL,
      description text NOT NULL DEFAULT '',
      match_always boolean NOT NULL DEFAULT false,
      match_keywords text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE basis_packs
      ADD COLUMN IF NOT EXISTS match_always boolean NOT NULL DEFAULT false;
    ALTER TABLE basis_packs
      ADD COLUMN IF NOT EXISTS match_keywords text NOT NULL DEFAULT '';

    CREATE TABLE IF NOT EXISTS basis_pack_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      pack_id varchar(64) NOT NULL REFERENCES basis_packs(id) ON DELETE CASCADE,
      "group" varchar(32) NOT NULL,
      title varchar(300) NOT NULL,
      doc_code varchar(100) NOT NULL DEFAULT '',
      issuer varchar(100) NOT NULL DEFAULT '',
      source_url text NOT NULL DEFAULT '',
      source_site varchar(100) NOT NULL DEFAULT '',
      sort_order varchar(16) NOT NULL DEFAULT '0',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE basis_pack_items
      ADD COLUMN IF NOT EXISTS source_site varchar(100) NOT NULL DEFAULT '';

    CREATE INDEX IF NOT EXISTS basis_pack_items_pack_id_idx
      ON basis_pack_items(pack_id);

    CREATE TABLE IF NOT EXISTS basis_source_urls (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id varchar(32) NOT NULL,
      pack_id varchar(64) NOT NULL REFERENCES basis_packs(id) ON DELETE CASCADE,
      "group" varchar(32) NOT NULL,
      source_url text NOT NULL UNIQUE,
      fetch_mode varchar(16) NOT NULL DEFAULT 'document',
      fallback_title varchar(300) NOT NULL,
      fallback_doc_code varchar(100) NOT NULL DEFAULT '',
      fallback_issuer varchar(100) NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS basis_list_sources (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id varchar(32) NOT NULL,
      pack_id varchar(64) NOT NULL REFERENCES basis_packs(id) ON DELETE CASCADE,
      "group" varchar(32) NOT NULL,
      list_url text NOT NULL UNIQUE,
      title varchar(200) NOT NULL DEFAULT '',
      enabled boolean NOT NULL DEFAULT true,
      last_synced_at timestamptz,
      last_found_count integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE basis_list_sources
      ADD COLUMN IF NOT EXISTS title varchar(200) NOT NULL DEFAULT '';
  `;

export async function ensureBasisSourceUrlTable(): Promise<void> {
  const pool = getPool();
  await pool.query(BASIS_TABLES_SQL);
}

export async function listExtraAutoDocuments(): Promise<BasisAutoDocument[]> {
  await ensureBasisSourceUrlTable();
  const db = getDb();
  const rows = await db
    .select()
    .from(basisSourceUrls)
    .orderBy(asc(basisSourceUrls.createdAt));

  return rows.map(row => ({
    siteId: row.siteId as BasisSourceSiteId,
    packId: row.packId,
    group: row.group as BasisGroup,
    sourceUrl: row.sourceUrl,
    fetchMode: row.fetchMode === 'catalog' ? 'catalog' : 'document',
    fallbackTitle: row.fallbackTitle,
    fallbackDocCode: row.fallbackDocCode || undefined,
    fallbackIssuer: row.fallbackIssuer || undefined,
  }));
}

/** 代码白名单 + 工具页新增源 */
export async function listAllAutoDocuments(): Promise<BasisAutoDocument[]> {
  const extras = await listExtraAutoDocuments();
  const seen = new Set(BASIS_AUTO_DOCUMENTS.map(doc => doc.sourceUrl));
  const merged = [...BASIS_AUTO_DOCUMENTS];
  for (const doc of extras) {
    if (seen.has(doc.sourceUrl)) {
      continue;
    }
    seen.add(doc.sourceUrl);
    merged.push(doc);
  }
  return merged;
}

/** 预置栏目 + 库内启用栏目（已停用的预置栏目不再参与同步） */
export async function listAllListSources(): Promise<BasisAutoListSource[]> {
  await ensureBasisSourceUrlTable();
  const db = getDb();
  const rows = await db
    .select()
    .from(basisListSources)
    .orderBy(asc(basisListSources.createdAt));

  const disabledBuiltin = new Set(
    rows
      .filter(
        row =>
          !row.enabled &&
          BASIS_AUTO_LIST_SOURCES.some(item => item.listUrl === row.listUrl),
      )
      .map(row => row.listUrl),
  );

  const merged: BasisAutoListSource[] = BASIS_AUTO_LIST_SOURCES.filter(
    item => !disabledBuiltin.has(item.listUrl),
  );
  const seen = new Set(merged.map(item => item.listUrl));

  for (const row of rows) {
    if (!row.enabled || seen.has(row.listUrl)) {
      continue;
    }
    seen.add(row.listUrl);
    merged.push({
      siteId: row.siteId as BasisSourceSiteId,
      packId: row.packId,
      group: row.group as BasisGroup,
      listUrl: row.listUrl,
      title:
        row.title?.trim() ||
        getSourceSite(row.siteId as BasisSourceSiteId).name,
    });
  }
  return merged;
}

export type ListedListSource = BasisAutoListSource & {
  id?: string;
  enabled: boolean;
  lastSyncedAt?: string | null;
  lastFoundCount: number;
  builtin: boolean;
};

export async function listListSourcesForUi(): Promise<ListedListSource[]> {
  await ensureBasisSourceUrlTable();
  const db = getDb();
  const rows = await db
    .select()
    .from(basisListSources)
    .orderBy(asc(basisListSources.createdAt));

  const byUrl = new Map(rows.map(row => [row.listUrl, row]));
  const result: ListedListSource[] = [];

  for (const item of BASIS_AUTO_LIST_SOURCES) {
    const row = byUrl.get(item.listUrl);
    if (row && !row.enabled) {
      continue;
    }
    result.push({
      ...item,
      title: row?.title?.trim() || item.title,
      id: row?.id,
      enabled: true,
      lastSyncedAt: row?.lastSyncedAt?.toISOString() ?? null,
      lastFoundCount: row?.lastFoundCount ?? 0,
      builtin: true,
    });
  }

  for (const row of rows) {
    if (!row.enabled) {
      continue;
    }
    if (BASIS_AUTO_LIST_SOURCES.some(item => item.listUrl === row.listUrl)) {
      continue;
    }
    const site = getSourceSite(row.siteId as BasisSourceSiteId);
    result.push({
      id: row.id,
      siteId: row.siteId as BasisSourceSiteId,
      packId: row.packId,
      group: row.group as BasisGroup,
      listUrl: row.listUrl,
      title: row.title?.trim() || `${site.name}栏目`,
      enabled: true,
      lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
      lastFoundCount: row.lastFoundCount,
      builtin: false,
    });
  }
  return result;
}

export type BasisImportPreview = {
  sourceUrl: string;
  siteId: BasisSourceSiteId;
  siteName: string;
  suggestedPackId: string;
  suggestedGroup: BasisGroup;
  title: string;
  docCode: string;
  issuer: string;
  fetchMode: 'document' | 'catalog';
  syncStatus: 'fetched' | 'fallback';
  packs: Array<{ id: string; name: string }>;
};

export async function previewBasisImport(
  sourceUrlRaw: string,
): Promise<BasisImportPreview> {
  const sourceUrl = sourceUrlRaw.trim();
  if (!sourceUrl) {
    throw new Error('请粘贴原文链接');
  }
  if (!isDetailSourceUrl(sourceUrl)) {
    throw new Error('请使用原文详情页链接，不能是门户首页');
  }

  const siteId = resolveSiteFromUrl(sourceUrl);
  if (!siteId) {
    throw new Error(
      '链接不在已支持官网白名单内（中国政府网 / 发改委 / 住建部 / 标准公开 / 河南 / 林草等）',
    );
  }

  const site = getSourceSite(siteId);
  const suggestedPackId = suggestPackIdForSite(siteId);
  const suggestedGroup = suggestGroupForUrl(sourceUrl, siteId);
  const fetchMode: 'document' | 'catalog' =
    siteId === 'openstd' ? 'catalog' : 'document';

  const resolved = await resolveAutoDocument({
    siteId,
    packId: suggestedPackId,
    group: suggestedGroup,
    sourceUrl,
    fetchMode,
    fallbackTitle: '',
    fallbackDocCode: '',
    fallbackIssuer: site.name,
  });

  const title =
    resolved.title && resolved.title !== '（待确认标题）'
      ? resolved.title
      : '';

  const packRows = await listBasisPackSummaries();

  return {
    sourceUrl,
    siteId,
    siteName: site.name,
    suggestedPackId,
    suggestedGroup,
    title,
    docCode: resolved.docCode ?? '',
    issuer: resolved.issuer ?? site.name,
    fetchMode,
    syncStatus: resolved.syncStatus,
    packs: packRows.map(pack => ({
      id: pack.id,
      name: pack.name,
    })),
  };
}

export type BasisImportInput = {
  sourceUrl: string;
  packId: string;
  group: BasisGroup;
  title: string;
  docCode?: string;
  issuer?: string;
  fetchMode?: 'document' | 'catalog';
};

export async function importBasisFromUrl(input: BasisImportInput): Promise<{
  sourceUrl: string;
  packId: string;
  title: string;
  sourceSite: string;
}> {
  const sourceUrl = input.sourceUrl.trim();
  const title = input.title.trim();
  if (!sourceUrl || !title) {
    throw new Error('原文链接与标题不能为空');
  }
  if (!isDetailSourceUrl(sourceUrl)) {
    throw new Error('请使用原文详情页链接，不能是门户首页');
  }

  const siteId = resolveSiteFromUrl(sourceUrl);
  if (!siteId) {
    throw new Error('链接不在已支持官网白名单内');
  }

  const pack = await getBasisPackById(input.packId);
  if (!pack) {
    throw new Error('请选择有效的依据包');
  }

  if (!['policy', 'standard', 'project'].includes(input.group)) {
    throw new Error('类型无效');
  }

  await ensureBasisSourceUrlTable();
  const db = getDb();
  const site = getSourceSite(siteId);
  const fetchMode = input.fetchMode ?? 'document';
  const docCode = (input.docCode ?? '').trim();
  const issuer = (input.issuer ?? '').trim();

  await db
    .insert(basisPacks)
    .values({
      id: pack.id,
      name: pack.name,
      description: pack.description,
    })
    .onConflictDoUpdate({
      target: basisPacks.id,
      set: {
        name: pack.name,
        description: pack.description,
        updatedAt: sql`now()`,
      },
    });

  await db
    .insert(basisSourceUrls)
    .values({
      siteId,
      packId: pack.id,
      group: input.group,
      sourceUrl,
      fetchMode,
      fallbackTitle: title,
      fallbackDocCode: docCode,
      fallbackIssuer: issuer,
    })
    .onConflictDoUpdate({
      target: basisSourceUrls.sourceUrl,
      set: {
        siteId,
        packId: pack.id,
        group: input.group,
        fetchMode,
        fallbackTitle: title,
        fallbackDocCode: docCode,
        fallbackIssuer: issuer,
        updatedAt: sql`now()`,
      },
    });

  await db
    .delete(basisPackItems)
    .where(eq(basisPackItems.sourceUrl, sourceUrl));

  const existingItems = await db
    .select({ id: basisPackItems.id })
    .from(basisPackItems)
    .where(eq(basisPackItems.packId, pack.id));
  const nextSort = String(existingItems.length);

  const writable = toWritableItem({
    group: input.group,
    title,
    docCode: docCode || undefined,
    issuer: issuer || undefined,
    sourceUrl,
    sourceSiteId: siteId,
    sourceSite: site.name,
    syncStatus: 'fetched',
  });

  await db.insert(basisPackItems).values({
    packId: pack.id,
    group: writable.group,
    title: writable.title,
    docCode: writable.docCode,
    issuer: writable.issuer,
    sourceUrl: writable.sourceUrl,
    sourceSite: writable.sourceSite,
    sortOrder: nextSort,
  });

  return {
    sourceUrl,
    packId: pack.id,
    title,
    sourceSite: site.name,
  };
}

export type AddListSourceInput = {
  listUrl: string;
  packId?: string;
  group?: BasisGroup;
  /** 栏目中文名；为空时自动抓取列表页标题 */
  title?: string;
};

export async function previewBasisListSource(listUrlRaw: string): Promise<{
  listUrl: string;
  siteId: BasisSourceSiteId;
  siteName: string;
  title: string;
  suggestedPackId: string;
  suggestedGroup: BasisGroup;
}> {
  const listUrl = listUrlRaw.trim();
  if (!listUrl) {
    throw new Error('请填写栏目列表页链接');
  }
  if (!isListSourceUrl(listUrl)) {
    throw new Error(
      '请使用白名单官网的栏目/列表页链接（不能是网站首页）',
    );
  }
  const siteId = resolveSiteFromUrl(listUrl);
  if (!siteId) {
    throw new Error('链接不在已支持官网白名单内');
  }
  const site = getSourceSite(siteId);
  const fetchedTitle = await resolveListPageTitle(listUrl);
  return {
    listUrl,
    siteId,
    siteName: site.name,
    title: (fetchedTitle || `${site.name}栏目`).slice(0, 200),
    suggestedPackId: suggestPackIdForSite(siteId),
    suggestedGroup: suggestGroupForUrl(listUrl, siteId),
  };
}

export async function addBasisListSource(input: AddListSourceInput): Promise<{
  listUrl: string;
  siteId: BasisSourceSiteId;
  siteName: string;
  packId: string;
  group: BasisGroup;
  title: string;
}> {
  const listUrl = input.listUrl.trim();
  if (!listUrl) {
    throw new Error('请填写栏目列表页链接');
  }
  if (!isListSourceUrl(listUrl)) {
    throw new Error(
      '请使用白名单官网的栏目/列表页链接（不能是网站首页）',
    );
  }

  const siteId = resolveSiteFromUrl(listUrl);
  if (!siteId) {
    throw new Error('链接不在已支持官网白名单内');
  }

  const packId = input.packId ?? suggestPackIdForSite(siteId);
  const pack = await getBasisPackById(packId);
  if (!pack) {
    throw new Error('请选择有效的依据包（可先在上方新建）');
  }

  const group = input.group ?? suggestGroupForUrl(listUrl, siteId);
  if (!['policy', 'standard', 'project'].includes(group)) {
    throw new Error('类型无效');
  }

  await ensureBasisSourceUrlTable();
  const db = getDb();
  const site = getSourceSite(siteId);

  const manualTitle = input.title?.trim() ?? '';
  const fetchedTitle = manualTitle
    ? null
    : await resolveListPageTitle(listUrl);
  const title = (manualTitle || fetchedTitle || `${site.name}栏目`).slice(
    0,
    200,
  );

  await db
    .insert(basisPacks)
    .values({
      id: pack.id,
      name: pack.name,
      description: pack.description,
    })
    .onConflictDoUpdate({
      target: basisPacks.id,
      set: {
        name: pack.name,
        description: pack.description,
        updatedAt: sql`now()`,
      },
    });

  await db
    .insert(basisListSources)
    .values({
      siteId,
      packId: pack.id,
      group,
      listUrl,
      title,
      enabled: true,
    })
    .onConflictDoUpdate({
      target: basisListSources.listUrl,
      set: {
        siteId,
        packId: pack.id,
        group,
        title,
        enabled: true,
        updatedAt: sql`now()`,
      },
    });

  return {
    listUrl,
    siteId,
    siteName: site.name,
    packId: pack.id,
    group,
    title,
  };
}

/**
 * 停用栏目（预置与自定义均软删除）。
 * 已入库知识条目默认保留，可在第 3 步单独删除。
 */
export async function deleteBasisListSource(listUrlRaw: string): Promise<{
  listUrl: string;
  builtin: boolean;
}> {
  const listUrl = listUrlRaw.trim();
  if (!listUrl) {
    throw new Error('缺少栏目链接');
  }

  await ensureBasisSourceUrlTable();
  const db = getDb();
  const builtin = BASIS_AUTO_LIST_SOURCES.some(item => item.listUrl === listUrl);
  const [existing] = await db
    .select()
    .from(basisListSources)
    .where(eq(basisListSources.listUrl, listUrl))
    .limit(1);

  if (builtin) {
    const preset = BASIS_AUTO_LIST_SOURCES.find(item => item.listUrl === listUrl);
    if (!preset) {
      throw new Error('预置栏目不存在');
    }
    if (existing) {
      await db
        .update(basisListSources)
        .set({ enabled: false, updatedAt: sql`now()` })
        .where(eq(basisListSources.listUrl, listUrl));
    } else {
      await db.insert(basisListSources).values({
        siteId: preset.siteId,
        packId: preset.packId,
        group: preset.group,
        listUrl: preset.listUrl,
        title: preset.title,
        enabled: false,
      });
    }
    return { listUrl, builtin: true };
  }

  if (!existing) {
    throw new Error('栏目不存在或已删除');
  }
  await db
    .update(basisListSources)
    .set({ enabled: false, updatedAt: sql`now()` })
    .where(eq(basisListSources.listUrl, listUrl));
  return { listUrl, builtin: false };
}

/** 恢复已停用栏目 */
export async function restoreBasisListSource(listUrlRaw: string): Promise<{
  listUrl: string;
  title: string;
}> {
  const listUrl = listUrlRaw.trim();
  if (!listUrl) {
    throw new Error('缺少栏目链接');
  }

  await ensureBasisSourceUrlTable();
  const db = getDb();
  const [existing] = await db
    .select()
    .from(basisListSources)
    .where(eq(basisListSources.listUrl, listUrl))
    .limit(1);

  const preset = BASIS_AUTO_LIST_SOURCES.find(item => item.listUrl === listUrl);

  if (existing) {
    await db
      .update(basisListSources)
      .set({ enabled: true, updatedAt: sql`now()` })
      .where(eq(basisListSources.listUrl, listUrl));
    return {
      listUrl,
      title:
        existing.title?.trim() ||
        preset?.title ||
        getSourceSite(existing.siteId as BasisSourceSiteId).name,
    };
  }

  if (preset) {
    await db.insert(basisListSources).values({
      siteId: preset.siteId,
      packId: preset.packId,
      group: preset.group,
      listUrl: preset.listUrl,
      title: preset.title,
      enabled: true,
    });
    return { listUrl, title: preset.title };
  }

  throw new Error('栏目不存在，无法恢复');
}

/** 已停用栏目（供恢复） */
export async function listDisabledListSourcesForUi(): Promise<
  ListedListSource[]
> {
  await ensureBasisSourceUrlTable();
  const db = getDb();
  const rows = await db
    .select()
    .from(basisListSources)
    .where(eq(basisListSources.enabled, false))
    .orderBy(asc(basisListSources.updatedAt));

  return rows.map(row => {
    const builtin = BASIS_AUTO_LIST_SOURCES.some(
      item => item.listUrl === row.listUrl,
    );
    const preset = BASIS_AUTO_LIST_SOURCES.find(
      item => item.listUrl === row.listUrl,
    );
    const site = getSourceSite(row.siteId as BasisSourceSiteId);
    return {
      id: row.id,
      siteId: row.siteId as BasisSourceSiteId,
      packId: row.packId,
      group: row.group as BasisGroup,
      listUrl: row.listUrl,
      title: row.title?.trim() || preset?.title || `${site.name}栏目`,
      enabled: false,
      lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
      lastFoundCount: row.lastFoundCount,
      builtin,
    };
  });
}

export async function persistBasisSyncPayload(
  payload: BasisSyncResult,
  options?: {
    /** replace=按包整表重写（全量）；merge=按原文链接合并（单栏目） */
    mode?: 'replace' | 'merge';
  },
): Promise<{ itemCount: number; bySite: Record<string, number> }> {
  await ensureBasisSourceUrlTable();
  const db = getDb();
  const mode = options?.mode ?? 'replace';
  let itemCount = 0;
  const bySite: Record<string, number> = {};

  const packIds = Object.keys(payload.itemsByPack);
  await ensureBasisPackLibrarySeeded();
  const existingPacks = await listBasisPackSummaries();
  const packNameById = new Map(existingPacks.map(pack => [pack.id, pack]));

  for (const packId of packIds) {
    const known = packNameById.get(packId);
    const fallback = BASIS_AUTO_PACKS.find(pack => pack.id === packId);
    await db
      .insert(basisPacks)
      .values({
        id: packId,
        name: known?.name ?? fallback?.name ?? packId,
        description: known?.description ?? fallback?.description ?? '',
      })
      .onConflictDoUpdate({
        target: basisPacks.id,
        set: {
          updatedAt: sql`now()`,
        },
      });

    const items = payload.itemsByPack[packId] ?? [];

    if (mode === 'replace') {
      await db
        .delete(basisPackItems)
        .where(eq(basisPackItems.packId, packId));
      for (let i = 0; i < items.length; i += 1) {
        const row = toWritableItem(items[i]);
        await db.insert(basisPackItems).values({
          packId,
          group: row.group,
          title: row.title,
          docCode: row.docCode,
          issuer: row.issuer,
          sourceUrl: row.sourceUrl,
          sourceSite: row.sourceSite,
          sortOrder: String(i),
        });
        itemCount += 1;
        bySite[row.sourceSite] = (bySite[row.sourceSite] ?? 0) + 1;
      }
    } else {
      for (const item of items) {
        const row = toWritableItem(item);
        await db
          .delete(basisPackItems)
          .where(eq(basisPackItems.sourceUrl, row.sourceUrl));
        const existingInPack = await db
          .select({ id: basisPackItems.id })
          .from(basisPackItems)
          .where(eq(basisPackItems.packId, packId));
        await db.insert(basisPackItems).values({
          packId,
          group: row.group,
          title: row.title,
          docCode: row.docCode,
          issuer: row.issuer,
          sourceUrl: row.sourceUrl,
          sourceSite: row.sourceSite,
          sortOrder: String(existingInPack.length),
        });
        itemCount += 1;
        bySite[row.sourceSite] = (bySite[row.sourceSite] ?? 0) + 1;
      }
    }
  }

  for (const listResult of payload.listResults) {
    const source =
      (await listAllListSources()).find(
        item => item.listUrl === listResult.listUrl,
      ) ?? null;
    if (!source) {
      continue;
    }
    await db
      .insert(basisListSources)
      .values({
        siteId: source.siteId,
        packId: source.packId,
        group: source.group,
        listUrl: source.listUrl,
        enabled: true,
        lastSyncedAt: sql`now()`,
        lastFoundCount: listResult.found,
      })
      .onConflictDoUpdate({
        target: basisListSources.listUrl,
        set: {
          lastSyncedAt: sql`now()`,
          lastFoundCount: listResult.found,
          updatedAt: sql`now()`,
        },
      });
  }

  return { itemCount, bySite };
}

export async function runBasisLibrarySync(options?: {
  listUrl?: string;
}): Promise<{
  packs: number;
  items: number;
  bySite: Record<string, number>;
  fetched: number;
  fallback: number;
  discovered: number;
  listResults: BasisSyncResult['listResults'];
  failed: BasisSyncResult['failed'];
  scope: 'all' | 'list';
}> {
  const listUrl = options?.listUrl?.trim();
  const payload = await collectBasisSyncPayload(
    listUrl ? { listUrl } : undefined,
  );
  const { itemCount, bySite } = await persistBasisSyncPayload(payload, {
    mode: listUrl ? 'merge' : 'replace',
  });
  return {
    packs: Object.keys(payload.itemsByPack).length,
    items: itemCount,
    bySite,
    fetched: payload.fetched,
    fallback: payload.fallback,
    discovered: payload.discovered,
    listResults: payload.listResults,
    failed: payload.failed,
    scope: listUrl ? 'list' : 'all',
  };
}
