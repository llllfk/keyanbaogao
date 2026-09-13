import { asc, eq, inArray, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { getDb, getPool } from '@/lib/db';
import { basisPackItems, basisPacks, basisSourceUrls } from '@/lib/db/schema';
import {
  SEED_BASIS_PACKS,
  type BasisPack,
  type BasisGroup,
} from '@/lib/project/basis-packs';

export type BasisPackSummary = {
  id: string;
  name: string;
  description: string;
  matchAlways: boolean;
  matchKeywords: string;
  itemCount: number;
};

const SEED_MATCH: Record<
  string,
  { matchAlways: boolean; matchKeywords: string }
> = {
  pack_common_gov: { matchAlways: true, matchKeywords: '' },
  pack_finance_eval: { matchAlways: false, matchKeywords: '' },
  pack_eng_municipal_road: {
    matchAlways: false,
    matchKeywords: '道路,市政,公路',
  },
  pack_region_henan: { matchAlways: false, matchKeywords: '河南' },
  pack_industry_forestry_fire: {
    matchAlways: false,
    matchKeywords: '防灭火,防火,林草',
  },
};

function mapItem(item: {
  id: string;
  group: string;
  title: string;
  docCode: string;
  issuer: string;
  sourceUrl: string;
  sourceSite: string;
}) {
  return {
    id: item.id,
    group: item.group as BasisGroup,
    title: item.title,
    docCode: item.docCode || undefined,
    issuer: item.issuer || undefined,
    sourceUrl: item.sourceUrl || undefined,
    sourceSite: item.sourceSite || undefined,
  };
}

export async function ensureBasisPackColumns(): Promise<void> {
  const pool = getPool();
  await pool.query(`
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
  `);
}

/** 确保全局共享库已有种子数据（幂等；并补齐预置包匹配规则） */
export async function ensureBasisPackLibrarySeeded(): Promise<void> {
  await ensureBasisPackColumns();
  const db = getDb();

  for (const pack of SEED_BASIS_PACKS) {
    const match = SEED_MATCH[pack.id] ?? {
      matchAlways: false,
      matchKeywords: '',
    };
    await db
      .insert(basisPacks)
      .values({
        id: pack.id,
        name: pack.name,
        description: pack.description,
        matchAlways: match.matchAlways,
        matchKeywords: match.matchKeywords,
      })
      .onConflictDoNothing();
  }

  // 仅当匹配字段仍为空时，补预置规则（不覆盖用户已改内容）
  const pool = getPool();
  for (const [id, match] of Object.entries(SEED_MATCH)) {
    if (match.matchAlways) {
      await pool.query(
        `UPDATE basis_packs
         SET match_always = true, updated_at = now()
         WHERE id = $1 AND match_always = false AND match_keywords = ''`,
        [id],
      );
    }
    if (match.matchKeywords) {
      await pool.query(
        `UPDATE basis_packs
         SET match_keywords = $2, updated_at = now()
         WHERE id = $1 AND match_keywords = ''`,
        [id, match.matchKeywords],
      );
    }
  }

  const existingItems = await db
    .select({ id: basisPackItems.id })
    .from(basisPackItems)
    .limit(1);
  if (existingItems.length > 0) {
    return;
  }

  for (const pack of SEED_BASIS_PACKS) {
    if (pack.items.length === 0) {
      continue;
    }
    await db.insert(basisPackItems).values(
      pack.items.map((item, index) => ({
        packId: pack.id,
        group: item.group,
        title: item.title,
        docCode: item.docCode ?? '',
        issuer: item.issuer ?? '',
        sourceUrl: item.sourceUrl ?? '',
        sourceSite: item.sourceSite ?? '',
        sortOrder: String(index),
      })),
    );
  }
}

export async function listBasisPacksFromLibrary(): Promise<BasisPack[]> {
  await ensureBasisPackLibrarySeeded();
  const db = getDb();
  const packs = await db.select().from(basisPacks).orderBy(asc(basisPacks.name));
  if (packs.length === 0) {
    return SEED_BASIS_PACKS;
  }

  const packIds = packs.map(pack => pack.id);
  const items = await db
    .select()
    .from(basisPackItems)
    .where(inArray(basisPackItems.packId, packIds))
    .orderBy(asc(basisPackItems.sortOrder));

  return packs.map(pack => ({
    id: pack.id,
    name: pack.name,
    description: pack.description,
    items: items.filter(item => item.packId === pack.id).map(mapItem),
  }));
}

export async function listBasisPackSummaries(): Promise<BasisPackSummary[]> {
  await ensureBasisPackLibrarySeeded();
  const db = getDb();
  const packs = await db.select().from(basisPacks).orderBy(asc(basisPacks.name));
  const items = await db
    .select({ packId: basisPackItems.packId })
    .from(basisPackItems);
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.packId, (counts.get(item.packId) ?? 0) + 1);
  }
  return packs.map(pack => ({
    id: pack.id,
    name: pack.name,
    description: pack.description,
    matchAlways: pack.matchAlways,
    matchKeywords: pack.matchKeywords,
    itemCount: counts.get(pack.id) ?? 0,
  }));
}

export async function getBasisPacksByIds(
  packIds: string[],
): Promise<BasisPack[]> {
  if (packIds.length === 0) {
    return [];
  }
  await ensureBasisPackLibrarySeeded();
  const db = getDb();
  const packs = await db
    .select()
    .from(basisPacks)
    .where(inArray(basisPacks.id, packIds));

  const items = await db
    .select()
    .from(basisPackItems)
    .where(inArray(basisPackItems.packId, packIds))
    .orderBy(asc(basisPackItems.sortOrder));

  return packIds
    .map(id => packs.find(pack => pack.id === id))
    .filter((pack): pack is (typeof packs)[number] => Boolean(pack))
    .map(pack => ({
      id: pack.id,
      name: pack.name,
      description: pack.description,
      items: items.filter(item => item.packId === pack.id).map(mapItem),
    }));
}

export async function getBasisPackById(
  packId: string,
): Promise<BasisPack | null> {
  await ensureBasisPackLibrarySeeded();
  const db = getDb();
  const [pack] = await db
    .select()
    .from(basisPacks)
    .where(eq(basisPacks.id, packId))
    .limit(1);
  if (!pack) {
    return null;
  }
  const items = await db
    .select()
    .from(basisPackItems)
    .where(eq(basisPackItems.packId, packId))
    .orderBy(asc(basisPackItems.sortOrder));
  return {
    id: pack.id,
    name: pack.name,
    description: pack.description,
    items: items.map(mapItem),
  };
}

export type UpsertBasisPackInput = {
  id?: string;
  name: string;
  description?: string;
  matchAlways?: boolean;
  matchKeywords?: string;
};

export async function createBasisPack(
  input: UpsertBasisPackInput,
): Promise<BasisPackSummary> {
  await ensureBasisPackLibrarySeeded();
  const name = input.name.trim();
  if (!name) {
    throw new Error('请填写依据包名称');
  }
  const id =
    input.id?.trim() ||
    `pack_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  if (!/^pack_[a-z0-9_]+$/i.test(id)) {
    throw new Error('依据包 ID 格式无效');
  }

  const db = getDb();
  const existing = await db
    .select({ id: basisPacks.id })
    .from(basisPacks)
    .where(eq(basisPacks.id, id))
    .limit(1);
  if (existing.length > 0) {
    throw new Error('依据包 ID 已存在');
  }

  await db.insert(basisPacks).values({
    id,
    name: name.slice(0, 100),
    description: (input.description ?? '').trim().slice(0, 500),
    matchAlways: Boolean(input.matchAlways),
    matchKeywords: (input.matchKeywords ?? '').trim().slice(0, 200),
  });

  return {
    id,
    name: name.slice(0, 100),
    description: (input.description ?? '').trim().slice(0, 500),
    matchAlways: Boolean(input.matchAlways),
    matchKeywords: (input.matchKeywords ?? '').trim().slice(0, 200),
    itemCount: 0,
  };
}

export async function updateBasisPack(
  packId: string,
  input: UpsertBasisPackInput,
): Promise<BasisPackSummary> {
  await ensureBasisPackLibrarySeeded();
  const name = input.name.trim();
  if (!name) {
    throw new Error('请填写依据包名称');
  }
  const db = getDb();
  const [pack] = await db
    .select()
    .from(basisPacks)
    .where(eq(basisPacks.id, packId))
    .limit(1);
  if (!pack) {
    throw new Error('依据包不存在');
  }

  const description = (input.description ?? pack.description).trim().slice(0, 500);
  const matchAlways =
    input.matchAlways === undefined ? pack.matchAlways : Boolean(input.matchAlways);
  const matchKeywords =
    input.matchKeywords === undefined
      ? pack.matchKeywords
      : input.matchKeywords.trim().slice(0, 200);

  await db
    .update(basisPacks)
    .set({
      name: name.slice(0, 100),
      description,
      matchAlways,
      matchKeywords,
      updatedAt: sql`now()`,
    })
    .where(eq(basisPacks.id, packId));

  const items = await db
    .select({ id: basisPackItems.id })
    .from(basisPackItems)
    .where(eq(basisPackItems.packId, packId));

  return {
    id: packId,
    name: name.slice(0, 100),
    description,
    matchAlways,
    matchKeywords,
    itemCount: items.length,
  };
}

export async function deleteBasisPack(packId: string): Promise<void> {
  await ensureBasisPackLibrarySeeded();
  const db = getDb();
  const [pack] = await db
    .select({ id: basisPacks.id })
    .from(basisPacks)
    .where(eq(basisPacks.id, packId))
    .limit(1);
  if (!pack) {
    throw new Error('依据包不存在');
  }
  await db.delete(basisPacks).where(eq(basisPacks.id, packId));
}

/** 删除单条知识条目；同步会按栏目再次发现时可能重新入库 */
export async function deleteBasisPackItem(itemId: string): Promise<void> {
  await deleteBasisPackItems([itemId]);
}

/** 批量删除知识条目 */
export async function deleteBasisPackItems(itemIds: string[]): Promise<number> {
  const ids = [...new Set(itemIds.map(id => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    throw new Error('请选择要删除的条目');
  }
  await ensureBasisPackLibrarySeeded();
  const db = getDb();
  const rows = await db
    .select({
      id: basisPackItems.id,
      sourceUrl: basisPackItems.sourceUrl,
    })
    .from(basisPackItems)
    .where(inArray(basisPackItems.id, ids));

  if (rows.length === 0) {
    throw new Error('所选条目不存在或已删除');
  }

  await db
    .delete(basisPackItems)
    .where(
      inArray(
        basisPackItems.id,
        rows.map(row => row.id),
      ),
    );

  const urls = rows
    .map(row => row.sourceUrl)
    .filter((url): url is string => Boolean(url?.trim()));
  if (urls.length > 0) {
    await db
      .delete(basisSourceUrls)
      .where(inArray(basisSourceUrls.sourceUrl, urls));
  }

  return rows.length;
}
