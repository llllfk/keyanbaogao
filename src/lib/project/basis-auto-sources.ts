import type { BasisGroup } from '@/lib/project/basis-packs';

/**
 * 依据库按「来源网站」分类配置。
 * - 同步白名单按站维护
 * - 每条必须有可点开的原文详情链接（禁止部委首页）
 * - 只存元数据，不存全文；不做人工条目录入后台
 */

export type BasisSourceSiteId =
  | 'gov_cn'
  | 'ndrc'
  | 'mohurd'
  | 'openstd'
  | 'henan'
  | 'forestry';

export type BasisSourceSite = {
  id: BasisSourceSiteId;
  name: string;
  host: string;
  description: string;
};

export const BASIS_SOURCE_SITES: Record<BasisSourceSiteId, BasisSourceSite> = {
  gov_cn: {
    id: 'gov_cn',
    name: '中国政府网',
    host: 'www.gov.cn',
    description: '国务院法规与政策公开',
  },
  ndrc: {
    id: 'ndrc',
    name: '国家发展改革委',
    host: 'www.ndrc.gov.cn',
    description: '投资与可研大纲等政策文件',
  },
  mohurd: {
    id: 'mohurd',
    name: '住房和城乡建设部',
    host: 'www.mohurd.gov.cn',
    description: '工程建设标准发布与公开',
  },
  openstd: {
    id: 'openstd',
    name: '国家标准公开系统',
    host: 'openstd.samr.gov.cn',
    description: '国家标准号公开查询入口',
  },
  henan: {
    id: 'henan',
    name: '河南省人民政府',
    host: 'www.henan.gov.cn',
    description: '河南省规划与地方政策',
  },
  forestry: {
    id: 'forestry',
    name: '国家林业和草原局',
    host: 'www.forestry.gov.cn',
    description: '林草防灭火相关政策',
  },
};

export const BASIS_SYNC_ALLOWED_HOSTS = [
  ...new Set([
    ...Object.values(BASIS_SOURCE_SITES).map(site => site.host),
    'zfxxgk.ndrc.gov.cn',
    'std.samr.gov.cn',
  ]),
] as const;

export type BasisAutoPackDef = {
  id: string;
  name: string;
  description: string;
};

export const BASIS_AUTO_PACKS: BasisAutoPackDef[] = [
  {
    id: 'pack_common_gov',
    name: '政府投资可研通用',
    description: '所有政府投资项目默认挂载（按网站自动同步）',
  },
  {
    id: 'pack_finance_eval',
    name: '财务评价通用',
    description: '启用财务分析时挂载（按网站自动同步）',
  },
  {
    id: 'pack_eng_municipal_road',
    name: '市政道路工程标准',
    description: '细分领域含道路/市政道路时挂载（按网站自动同步）',
  },
  {
    id: 'pack_region_henan',
    name: '河南省地方依据',
    description: '建设地点含河南时挂载（按网站自动同步）',
  },
  {
    id: 'pack_industry_forestry_fire',
    name: '林草防灭火政策',
    description: '行业为农林且细分含防灭火/防火时挂载（按网站自动同步）',
  },
];

export type BasisAutoDocument = {
  siteId: BasisSourceSiteId;
  packId: string;
  group: BasisGroup;
  /** 原文详情页（禁止门户首页） */
  sourceUrl: string;
  /**
   * document：从详情页抽取 title/文号
   * catalog：标准公开多为检索页/SPA，用可核对元数据 + 带标准号的原文链接
   */
  fetchMode: 'document' | 'catalog';
  fallbackTitle: string;
  fallbackDocCode?: string;
  fallbackIssuer?: string;
};

/** 按网站分组的白名单原文（新增 = 在对应站下加详情 URL，再 pnpm basis:sync） */
export const BASIS_AUTO_DOCUMENTS_BY_SITE: Record<
  BasisSourceSiteId,
  BasisAutoDocument[]
> = {
  gov_cn: [
    {
      siteId: 'gov_cn',
      packId: 'pack_common_gov',
      group: 'policy',
      fetchMode: 'document',
      sourceUrl:
        'https://www.gov.cn/gongbao/content/2019/content_5392291.htm',
      fallbackTitle: '政府投资条例',
      fallbackDocCode: '国务院令第712号',
      fallbackIssuer: '国务院',
    },
    {
      siteId: 'gov_cn',
      packId: 'pack_common_gov',
      group: 'standard',
      fetchMode: 'document',
      sourceUrl:
        'https://www.gov.cn/zhengce/zhengceku/2023-04/11/content_5750844.htm',
      fallbackTitle: '政府投资项目可行性研究报告编写通用大纲（2023年版）',
      fallbackDocCode: '发改投资规〔2023〕304号附件',
      fallbackIssuer: '国家发展和改革委员会',
    },
    {
      siteId: 'gov_cn',
      packId: 'pack_industry_forestry_fire',
      group: 'policy',
      fetchMode: 'document',
      sourceUrl:
        'https://www.gov.cn/zhengce/2021-03/30/content_5596867.htm',
      fallbackTitle: '关于全面加强新形势下森林草原防灭火工作的意见',
      fallbackIssuer: '中共中央办公厅 / 国务院办公厅',
    },
  ],
  ndrc: [
    {
      siteId: 'ndrc',
      packId: 'pack_common_gov',
      group: 'policy',
      fetchMode: 'document',
      sourceUrl:
        'https://www.ndrc.gov.cn/xxgk/zcfb/ghxwj/202304/t20230407_1353356.html',
      fallbackTitle:
        '关于印发投资项目可行性研究报告编写大纲及说明的通知',
      fallbackDocCode: '发改投资规〔2023〕304号',
      fallbackIssuer: '国家发展和改革委员会',
    },
    {
      siteId: 'ndrc',
      packId: 'pack_finance_eval',
      group: 'standard',
      fetchMode: 'document',
      sourceUrl:
        'https://www.ndrc.gov.cn/xxgk/zcfb/tz/201905/t20190508_962437.html',
      fallbackTitle: '建设项目经济评价方法与参数（第三版）',
      fallbackIssuer: '国家发展改革委 / 建设部',
    },
  ],
  mohurd: [
    {
      siteId: 'mohurd',
      packId: 'pack_finance_eval',
      group: 'standard',
      fetchMode: 'catalog',
      sourceUrl:
        'https://www.mohurd.gov.cn/gongkai/fdzdgknr/tzgg/index.html',
      fallbackTitle: '市政公用设施建设项目经济评价方法与参数',
      fallbackIssuer: '住房和城乡建设部',
    },
    {
      siteId: 'mohurd',
      packId: 'pack_eng_municipal_road',
      group: 'standard',
      fetchMode: 'catalog',
      sourceUrl:
        'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html',
      fallbackTitle: '城市道路工程设计规范',
      fallbackDocCode: 'CJJ37-2012',
      fallbackIssuer: '住房和城乡建设部',
    },
    {
      siteId: 'mohurd',
      packId: 'pack_eng_municipal_road',
      group: 'standard',
      fetchMode: 'catalog',
      sourceUrl:
        'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html',
      fallbackTitle: '城市道路路线设计规范',
      fallbackDocCode: 'CJJ193-2012',
      fallbackIssuer: '住房和城乡建设部',
    },
    {
      siteId: 'mohurd',
      packId: 'pack_eng_municipal_road',
      group: 'standard',
      fetchMode: 'catalog',
      sourceUrl:
        'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html',
      fallbackTitle: '城市道路路基设计规范',
      fallbackDocCode: 'CJJ194-2013',
      fallbackIssuer: '住房和城乡建设部',
    },
  ],
  openstd: [
    {
      siteId: 'openstd',
      packId: 'pack_eng_municipal_road',
      group: 'standard',
      fetchMode: 'catalog',
      sourceUrl:
        'https://openstd.samr.gov.cn/bzgk/gb/std_list?p.p1=7&p.p2=GB%2050014-2021',
      fallbackTitle: '室外排水设计标准',
      fallbackDocCode: 'GB50014-2021',
      fallbackIssuer: '住房和城乡建设部',
    },
    {
      siteId: 'openstd',
      packId: 'pack_eng_municipal_road',
      group: 'standard',
      fetchMode: 'catalog',
      sourceUrl:
        'https://openstd.samr.gov.cn/bzgk/gb/std_list?p.p1=7&p.p2=GB%2050763-2012',
      fallbackTitle: '无障碍设计规范',
      fallbackDocCode: 'GB50763-2012',
      fallbackIssuer: '住房和城乡建设部',
    },
  ],
  henan: [
    {
      siteId: 'henan',
      packId: 'pack_region_henan',
      group: 'policy',
      fetchMode: 'document',
      sourceUrl:
        'https://www.henan.gov.cn/2021/04-13/2132370.html',
      fallbackTitle:
        '河南省国民经济和社会发展第十四个五年规划和二〇三五年远景目标纲要',
      fallbackIssuer: '河南省人民政府',
    },
    {
      siteId: 'henan',
      packId: 'pack_region_henan',
      group: 'standard',
      fetchMode: 'catalog',
      sourceUrl:
        'https://www.henan.gov.cn/zwgk/fgwj/',
      fallbackTitle: '河南省城镇控水防尘海绵型道路技术规程',
      fallbackDocCode: 'DBJ41/T164-2016',
      fallbackIssuer: '河南省住房和城乡建设厅',
    },
  ],
  forestry: [
    {
      siteId: 'forestry',
      packId: 'pack_industry_forestry_fire',
      group: 'policy',
      fetchMode: 'catalog',
      sourceUrl:
        'https://www.forestry.gov.cn/c/www/gkml.jhtml',
      fallbackTitle: '“十四五”全国草原防灭火规划',
      fallbackIssuer: '国家林业和草原局',
    },
  ],
};

export const BASIS_AUTO_DOCUMENTS: BasisAutoDocument[] = (
  Object.keys(BASIS_AUTO_DOCUMENTS_BY_SITE) as BasisSourceSiteId[]
).flatMap(siteId => BASIS_AUTO_DOCUMENTS_BY_SITE[siteId]);

export function getSourceSite(siteId: BasisSourceSiteId): BasisSourceSite {
  return BASIS_SOURCE_SITES[siteId];
}

export function resolveSiteIdByHost(hostname: string): BasisSourceSiteId | null {
  const exact = Object.values(BASIS_SOURCE_SITES).find(
    site => site.host === hostname,
  );
  if (exact) {
    return exact.id;
  }
  if (hostname.endsWith('ndrc.gov.cn')) {
    return 'ndrc';
  }
  if (hostname.endsWith('samr.gov.cn')) {
    return 'openstd';
  }
  if (hostname.endsWith('gov.cn') && hostname.includes('henan')) {
    return 'henan';
  }
  if (hostname.endsWith('forestry.gov.cn')) {
    return 'forestry';
  }
  if (hostname.endsWith('mohurd.gov.cn')) {
    return 'mohurd';
  }
  if (hostname === 'www.gov.cn' || hostname.endsWith('.gov.cn')) {
    // 仅精确中国政府网主站；其他 .gov.cn 需已登记
    if (hostname === 'www.gov.cn') {
      return 'gov_cn';
    }
  }
  return null;
}

export function resolveSiteFromUrl(urlString: string): BasisSourceSiteId | null {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') {
      return null;
    }
    return resolveSiteIdByHost(url.hostname);
  } catch {
    return null;
  }
}

export function suggestPackIdForSite(siteId: BasisSourceSiteId): string {
  switch (siteId) {
    case 'henan':
      return 'pack_region_henan';
    case 'forestry':
      return 'pack_industry_forestry_fire';
    case 'mohurd':
    case 'openstd':
      return 'pack_eng_municipal_road';
    case 'ndrc':
      return 'pack_common_gov';
    case 'gov_cn':
    default:
      return 'pack_common_gov';
  }
}

export function suggestGroupForUrl(
  urlString: string,
  siteId: BasisSourceSiteId,
): BasisGroup {
  if (siteId === 'openstd' || siteId === 'mohurd') {
    return 'standard';
  }
  if (/标准|规范|规程|大纲/.test(urlString)) {
    return 'standard';
  }
  return 'policy';
}

/** 原文链接不得是门户根路径 */
export function isDetailSourceUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') {
      return false;
    }
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (path === '/' || path === '/index' || path === '/index.html') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** 栏目列表页：允许栏目 index，但禁止站点根路径 */
export function isListSourceUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') {
      return false;
    }
    if (!resolveSiteFromUrl(urlString)) {
      return false;
    }
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (path === '/') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export type BasisAutoListSource = {
  siteId: BasisSourceSiteId;
  packId: string;
  group: BasisGroup;
  listUrl: string;
  /** 栏目中文名称（列表页标题） */
  title: string;
};

/** 预置栏目列表页（同步时自动发现详情链接） */
export const BASIS_AUTO_LIST_SOURCES: BasisAutoListSource[] = [
  {
    siteId: 'ndrc',
    packId: 'pack_common_gov',
    group: 'policy',
    title: '国家发展改革委 · 规划司文件',
    listUrl: 'https://www.ndrc.gov.cn/xxgk/zcfb/ghxwj/',
  },
  {
    siteId: 'gov_cn',
    packId: 'pack_common_gov',
    group: 'policy',
    title: '中国政府网 · 最新政策',
    listUrl: 'https://www.gov.cn/zhengce/zuixin/',
  },
];

