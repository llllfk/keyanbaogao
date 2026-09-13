import {
  BASIS_AUTO_DOCUMENTS,
  BASIS_AUTO_PACKS,
  BASIS_SOURCE_SITES,
} from '@/lib/project/basis-auto-sources';

export type BasisGroup = 'policy' | 'standard' | 'project';

export type BasisPackItem = {
  /** 库内条目 ID（有库时存在） */
  id?: string;
  title: string;
  docCode?: string;
  issuer?: string;
  sourceUrl?: string;
  /** 来源网站显示名，如「中国政府网」 */
  sourceSite?: string;
  group: BasisGroup;
};

export type BasisPack = {
  id: string;
  name: string;
  description: string;
  items: BasisPackItem[];
};

/**
 * 包壳 + 按网站白名单的兜底条目（空库首次写入）。
 * 正式数据以 `pnpm basis:sync` 刷新为准。
 */
export const SEED_BASIS_PACKS: BasisPack[] = BASIS_AUTO_PACKS.map(pack => ({
  id: pack.id,
  name: pack.name,
  description: pack.description,
  items: BASIS_AUTO_DOCUMENTS.filter(doc => doc.packId === pack.id).map(
    doc => ({
      group: doc.group,
      title: doc.fallbackTitle,
      docCode: doc.fallbackDocCode,
      issuer: doc.fallbackIssuer,
      sourceUrl: doc.sourceUrl,
      sourceSite: BASIS_SOURCE_SITES[doc.siteId].name,
    }),
  ),
}));
