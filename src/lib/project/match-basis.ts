import { randomUUID } from 'node:crypto';

import {
  BASIS_SOURCE_SITES,
  type BasisSourceSiteId,
} from '@/lib/project/basis-auto-sources';
import { listBasisPacksFromLibrary } from '@/lib/project/basis-library';
import type { BasicInfoInput, BasisItem } from './schema';

function itemKey(title: string, docCode?: string): string {
  return `${docCode?.trim() || ''}|${title.trim()}`;
}

/** 仅这些核心文件默认勾选；其余召回为候选，由大模型勾选 */
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

const MAX_CANDIDATES = 120;

/** 全国通用来源：所有项目进入候选 */
const ALWAYS_SITE_IDS: BasisSourceSiteId[] = ['gov_cn', 'ndrc'];

type RegionRule = {
  siteId: BasisSourceSiteId;
  keywords: string[];
};

const REGION_RULES: RegionRule[] = [
  { siteId: 'shaanxi', keywords: ['陕西', '西安', '陕'] },
  { siteId: 'gansu', keywords: ['甘肃', '兰州'] },
  { siteId: 'qinghai', keywords: ['青海', '西宁'] },
  { siteId: 'ningxia', keywords: ['宁夏', '银川'] },
  { siteId: 'xinjiang', keywords: ['新疆', '乌鲁木齐'] },
  { siteId: 'henan', keywords: ['河南', '郑州', '豫'] },
];

function resolveRelevantSiteIds(basic: BasicInfoInput): Set<BasisSourceSiteId> {
  const sites = new Set<BasisSourceSiteId>(ALWAYS_SITE_IDS);
  const location = `${basic.locationRegion} ${basic.locationDetail}`;
  const industryText = [
    basic.industry,
    basic.subSector,
    basic.constructionContentScale,
    basic.mainProductsServices,
  ].join(' ');

  for (const rule of REGION_RULES) {
    if (rule.keywords.some(keyword => location.includes(keyword))) {
      sites.add(rule.siteId);
    }
  }

  // 未点名省份时不塞入全部地方站，避免候选爆炸
  if (basic.doFinancialAnalysis) {
    sites.add('mof');
  }

  if (/建筑|房屋|市政|住建|给排水|暖通|电气|防火|公共建筑/.test(industryText)) {
    sites.add('mohurd');
    sites.add('openstd');
  }
  if (/公路|道路|桥梁|隧道|交通|市政道路/.test(industryText)) {
    sites.add('mot');
    sites.add('mohurd');
    sites.add('openstd');
  }
  if (/水利|水电|水库|防洪|灌溉/.test(industryText)) {
    sites.add('mwr');
  }
  if (/环境|生态|环评|污染|排放/.test(industryText)) {
    sites.add('mee');
  }
  if (/林草|森林|草原|防火|灭火|林业/.test(industryText)) {
    sites.add('forestry');
  }

  // 行业未命中专项时，仍给住建+国标作通用工程建设候选
  if (
    !sites.has('mohurd') &&
    !sites.has('mot') &&
    !sites.has('mwr') &&
    !sites.has('mee') &&
    !sites.has('forestry')
  ) {
    sites.add('mohurd');
    sites.add('openstd');
  }

  return sites;
}

function siteDisplayNames(siteIds: Set<BasisSourceSiteId>): Set<string> {
  const names = new Set<string>();
  for (const id of siteIds) {
    names.add(BASIS_SOURCE_SITES[id].name);
  }
  return names;
}

type LibraryFlatItem = {
  packId: string;
  group: BasisItem['group'];
  title: string;
  docCode?: string;
  issuer?: string;
  sourceUrl?: string;
  sourceSite?: string;
};

async function loadLibraryFlatItems(): Promise<LibraryFlatItem[]> {
  const packs = await listBasisPacksFromLibrary();
  const items: LibraryFlatItem[] = [];
  for (const pack of packs) {
    for (const entry of pack.items) {
      if (entry.group === 'project') {
        continue;
      }
      items.push({
        packId: pack.id,
        group: entry.group,
        title: entry.title,
        docCode: entry.docCode,
        issuer: entry.issuer,
        sourceUrl: entry.sourceUrl,
        sourceSite: entry.sourceSite,
      });
    }
  }
  return items;
}

function scoreCandidate(
  entry: LibraryFlatItem,
  basic: BasicInfoInput,
  allowedSiteNames: Set<string>,
): number {
  let score = 0;
  const site = entry.sourceSite?.trim() ?? '';
  if (site && allowedSiteNames.has(site)) {
    score += 10;
  }
  if (shouldAutoSelect(entry)) {
    score += 50;
  }
  const hay = `${entry.title} ${entry.docCode ?? ''} ${entry.issuer ?? ''}`;
  const tokens = [
    basic.industry,
    basic.subSector,
    ...basic.locationRegion.split(/[\s/、，,]+/).filter(Boolean),
  ].filter(token => token.length >= 2);
  for (const token of tokens) {
    if (hay.includes(token)) {
      score += 3;
    }
  }
  return score;
}

/**
 * 按来源官网 + 地点/行业规则召回候选条目（不再先选文件分组）。
 * 内部 packId 仅作归库元数据保留。
 */
export async function buildCandidateBasisItems(
  basic: BasicInfoInput,
  existing: BasisItem[] = [],
): Promise<BasisItem[]> {
  const siteIds = resolveRelevantSiteIds(basic);
  const allowedSiteNames = siteDisplayNames(siteIds);
  const library = await loadLibraryFlatItems();

  const ranked = library
    .map(entry => ({
      entry,
      score: scoreCandidate(entry, basic, allowedSiteNames),
    }))
    .filter(row => {
      const site = row.entry.sourceSite?.trim() ?? '';
      if (!site) {
        // 无来源标注的旧数据：仅核心文件进入
        return shouldAutoSelect(row.entry);
      }
      return allowedSiteNames.has(site) || shouldAutoSelect(row.entry);
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES)
    .map(row => row.entry);

  const existingByKey = new Map(
    existing.map(item => [itemKey(item.title, item.docCode), item]),
  );

  const next: BasisItem[] = [];
  const seen = new Set<string>();

  for (const entry of ranked) {
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
      packId: entry.packId,
      selected: prev?.selected ?? shouldAutoSelect(entry),
    });
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

/** @deprecated 兼容旧名：现为按来源召回候选 */
export async function buildRecommendedBasisItems(
  basic: BasicInfoInput,
  existing: BasisItem[] = [],
): Promise<BasisItem[]> {
  return buildCandidateBasisItems(basic, existing);
}

/** @deprecated 内部归库桶 ID，仅兜底/兼容旧调用 */
export async function matchPackIdsFallback(
  basic: BasicInfoInput,
): Promise<string[]> {
  const items = await buildCandidateBasisItems(basic, []);
  return [...new Set(items.map(item => item.packId).filter(Boolean))];
}

/** @deprecated */
export async function matchPackIds(
  basic: BasicInfoInput,
): Promise<string[]> {
  return matchPackIdsFallback(basic);
}

/** @deprecated 请改用 buildCandidateBasisItems */
export async function buildRecommendedBasisItemsFromPackIds(
  packIds: string[],
  existing: BasisItem[] = [],
): Promise<BasisItem[]> {
  const library = await loadLibraryFlatItems();
  const idSet = new Set(packIds);
  const filtered = library.filter(entry => idSet.has(entry.packId));
  const existingByKey = new Map(
    existing.map(item => [itemKey(item.title, item.docCode), item]),
  );
  const next: BasisItem[] = [];
  const seen = new Set<string>();
  for (const entry of filtered) {
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
      packId: entry.packId,
      selected: prev?.selected ?? shouldAutoSelect(entry),
    });
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
