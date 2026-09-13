import { randomUUID } from 'node:crypto';

import {
  getBasisPacksByIds,
  listBasisPackSummaries,
} from '@/lib/project/basis-library';
import type { BasicInfoInput, BasisItem } from './schema';

function itemKey(title: string, docCode?: string): string {
  return `${docCode?.trim() || ''}|${title.trim()}`;
}

function splitKeywords(raw: string): string[] {
  return raw
    .split(/[,，|、;/；\s]+/)
    .map(part => part.trim())
    .filter(part => part.length > 0);
}

/** 仅这些核心文件默认勾选；其余召回为候选，避免同步后整包上百条全选 */
const CORE_AUTO_SELECT_PATTERNS = [
  '政府投资条例',
  '可行性研究报告编写通用大纲',
  '发改投资规〔2023〕304号',
  '304号',
] as const;

function shouldAutoSelect(entry: {
  title: string;
  docCode?: string;
}): boolean {
  const hay = `${entry.docCode ?? ''} ${entry.title}`;
  return CORE_AUTO_SELECT_PATTERNS.some(pattern => hay.includes(pattern));
}

/** 根据基础信息匹配应挂载的依据包 ID（读库内规则） */
export async function matchPackIds(basic: BasicInfoInput): Promise<string[]> {
  const packs = await listBasisPackSummaries();
  const ids = new Set<string>();
  const haystack = [
    basic.locationRegion,
    basic.subSector,
    basic.industry,
    basic.mainProductsServices,
  ]
    .filter(Boolean)
    .join(' ');

  for (const pack of packs) {
    if (pack.matchAlways) {
      ids.add(pack.id);
      continue;
    }

    // 财务包：仅在启用财务分析时挂载
    if (pack.id === 'pack_finance_eval') {
      if (basic.doFinancialAnalysis) {
        ids.add(pack.id);
      }
      continue;
    }

    const keywords = splitKeywords(pack.matchKeywords);
    if (keywords.length === 0) {
      continue;
    }
    if (keywords.some(keyword => haystack.includes(keyword))) {
      ids.add(pack.id);
    }
  }

  // 库为空或未匹配到任何包时，至少挂通用包（若存在）
  if (ids.size === 0 && packs.some(pack => pack.id === 'pack_common_gov')) {
    ids.add('pack_common_gov');
  }

  return [...ids];
}

/** 生成推荐条目；保留用户已有勾选与手填项（从全局共享库读包内容） */
export async function buildRecommendedBasisItems(
  basic: BasicInfoInput,
  existing: BasisItem[] = [],
): Promise<BasisItem[]> {
  const packIds = await matchPackIds(basic);
  const packs = await getBasisPacksByIds(packIds);
  const existingByKey = new Map(
    existing.map(item => [itemKey(item.title, item.docCode), item]),
  );

  const next: BasisItem[] = [];
  const seen = new Set<string>();

  for (const pack of packs) {
    for (const entry of pack.items) {
      const key = itemKey(entry.title, entry.docCode);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const prev = existingByKey.get(key);
      next.push({
        id: prev?.id ?? randomUUID(),
        group: entry.group,
        title: entry.title,
        docCode: entry.docCode ?? '',
        issuer: entry.issuer ?? '',
        sourceUrl: entry.sourceUrl ?? '',
        sourceSite: entry.sourceSite ?? '',
        source: 'pack',
        packId: pack.id,
        selected: prev?.selected ?? shouldAutoSelect(entry),
      });
    }
  }

  for (const item of existing) {
    if (item.source !== 'manual') {
      continue;
    }
    const key = itemKey(item.title, item.docCode);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    next.push(item);
  }

  return next;
}

export async function getMatchedPackSummaries(basic: BasicInfoInput): Promise<
  {
    id: string;
    name: string;
    description: string;
  }[]
> {
  const packs = await getBasisPacksByIds(await matchPackIds(basic));
  return packs.map(pack => ({
    id: pack.id,
    name: pack.name,
    description: pack.description,
  }));
}
