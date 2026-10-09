import type { BasisGroup } from '@/lib/project/basis-packs';

/**
 * 依据库按「来源网站」分类配置。
 * - 同步白名单按站维护
 * - 每条必须有可点开的原文详情链接（禁止部委首页）
 * - 只存元数据，不存全文；不做人工条目录入后台
 * - 覆盖：通用部委 + 住建/应急消防/自然资源 + 交通/水利/生态
 * - 地方：陕甘青宁新省政府 + 住建/发改/自然资源等厅局（建筑相关优先）
 */

export type BasisSourceSiteId =
  | 'gov_cn'
  | 'ndrc'
  | 'mohurd'
  | 'mot'
  | 'mwr'
  | 'mee'
  | 'mof'
  | 'mem'
  | 'mnr'
  | 'openstd'
  | 'henan'
  | 'forestry'
  | 'shaanxi'
  | 'gansu'
  | 'qinghai'
  | 'ningxia'
  | 'xinjiang';

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
  mot: {
    id: 'mot',
    name: '交通运输部',
    host: 'www.mot.gov.cn',
    description: '公路与交通运输行业标准、政策',
  },
  mwr: {
    id: 'mwr',
    name: '水利部',
    host: 'www.mwr.gov.cn',
    description: '水利工程建设与管理政策',
  },
  mee: {
    id: 'mee',
    name: '生态环境部',
    host: 'www.mee.gov.cn',
    description: '环境影响评价与生态环境标准',
  },
  mof: {
    id: 'mof',
    name: '财政部',
    host: 'www.mof.gov.cn',
    description: '财政投资评审与预算管理政策',
  },
  mem: {
    id: 'mem',
    name: '应急管理部',
    host: 'www.mem.gov.cn',
    description: '高层建筑消防安全管理与应急相关规定',
  },
  mnr: {
    id: 'mnr',
    name: '自然资源部',
    host: 'www.mnr.gov.cn',
    description: '建设用地、规划用地与自然资源管理政策',
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
  shaanxi: {
    id: 'shaanxi',
    name: '陕西省人民政府',
    host: 'www.shaanxi.gov.cn',
    description: '陕西省及省直厅局（陕甘青宁新）',
  },
  gansu: {
    id: 'gansu',
    name: '甘肃省人民政府',
    host: 'www.gansu.gov.cn',
    description: '甘肃省及省直厅局（陕甘青宁新）',
  },
  qinghai: {
    id: 'qinghai',
    name: '青海省人民政府',
    host: 'www.qinghai.gov.cn',
    description: '青海省及省直厅局（陕甘青宁新）',
  },
  ningxia: {
    id: 'ningxia',
    name: '宁夏回族自治区人民政府',
    host: 'www.nx.gov.cn',
    description: '宁夏及区直厅局（陕甘青宁新）',
  },
  xinjiang: {
    id: 'xinjiang',
    name: '新疆维吾尔自治区人民政府',
    host: 'www.xinjiang.gov.cn',
    description: '新疆及区直厅局（陕甘青宁新）',
  },
};

/** 显式允许的厅局/信息公开子域（resolve 不到时仍可同步） */
export const BASIS_SYNC_ALLOWED_HOSTS = [
  ...new Set([
    ...Object.values(BASIS_SOURCE_SITES).map(site => site.host),
    'zfxxgk.ndrc.gov.cn',
    'std.samr.gov.cn',
    'xxgk.mot.gov.cn',
    'www.mem.gov.cn',
    'www.mnr.gov.cn',
    // 陕西厅局（住建/自然资源/市场监管等）
    'kjt.shaanxi.gov.cn',
    'ybj.shaanxi.gov.cn',
    'js.shaanxi.gov.cn',
    'sndrc.shaanxi.gov.cn',
    'sthjt.shaanxi.gov.cn',
    'jtt.shaanxi.gov.cn',
    'zrzyt.shaanxi.gov.cn',
    'snamr.shaanxi.gov.cn',
    'yjt.shaanxi.gov.cn',
    'czt.shaanxi.gov.cn',
    'slt.shaanxi.gov.cn',
    'jyt.shaanxi.gov.cn',
    'whhlyt.shaanxi.gov.cn',
    'nynct.shaanxi.gov.cn',
    'lyj.shaanxi.gov.cn',
    // 甘肃厅局
    'zjt.gansu.gov.cn',
    'fzgg.gansu.gov.cn',
    'zhzw.zjt.gansu.gov.cn',
    'zwfw.gansu.gov.cn',
    'sthjt.gansu.gov.cn',
    'jtt.gansu.gov.cn',
    'jtyst.gansu.gov.cn',
    'zrzy.gansu.gov.cn',
    'scjg.gansu.gov.cn',
    'yjgl.gansu.gov.cn',
    'czt.gansu.gov.cn',
    'slt.gansu.gov.cn',
    'jyt.gansu.gov.cn',
    'wlt.gansu.gov.cn',
    'nync.gansu.gov.cn',
    'lycy.gansu.gov.cn',
    // 青海厅局
    'fgw.qinghai.gov.cn',
    'zjt.qinghai.gov.cn',
    'sthjt.qinghai.gov.cn',
    'jtyst.qinghai.gov.cn',
    'zrzyt.qinghai.gov.cn',
    'scjgj.qinghai.gov.cn',
    'yjt.qinghai.gov.cn',
    'czt.qinghai.gov.cn',
    'slt.qinghai.gov.cn',
    'jyt.qinghai.gov.cn',
    'whhlyt.qinghai.gov.cn',
    'nynct.qinghai.gov.cn',
    'lczj.qinghai.gov.cn',
    // 宁夏厅局
    'jst.nx.gov.cn',
    'fzggw.nx.gov.cn',
    'sthjt.nx.gov.cn',
    'jtt.nx.gov.cn',
    'jtyst.nx.gov.cn',
    'dnr.nx.gov.cn',
    'scjg.nx.gov.cn',
    'nxyjglt.nx.gov.cn',
    'czt.nx.gov.cn',
    'slt.nx.gov.cn',
    'jyt.nx.gov.cn',
    'whhlyt.nx.gov.cn',
    'nynct.nx.gov.cn',
    'lcj.nx.gov.cn',
    // 新疆厅局
    'zjt.xinjiang.gov.cn',
    'xjdrc.xinjiang.gov.cn',
    'sthjt.xinjiang.gov.cn',
    'jtyst.xinjiang.gov.cn',
    'zrzyt.xinjiang.gov.cn',
    'scjg.xinjiang.gov.cn',
    'yjgl.xinjiang.gov.cn',
    'czt.xinjiang.gov.cn',
    'slt.xinjiang.gov.cn',
    'jyt.xinjiang.gov.cn',
    'wlt.xinjiang.gov.cn',
    'nynct.xinjiang.gov.cn',
    'xjlyj.xinjiang.gov.cn',
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
    description: '政府投资可研通用政策与大纲（大模型优先挂载）',
  },
  {
    id: 'pack_finance_eval',
    name: '财务评价通用',
    description: '启用财务分析时挂载的评价方法与参数',
  },
  {
    id: 'pack_eng_municipal_road',
    name: '市政道路工程标准',
    description: '城市道路、排水、无障碍等市政工程标准',
  },
  {
    id: 'pack_eng_building',
    name: '房屋建筑与公共建筑标准',
    description: '建筑设计防火、节能、电气、给排水等通用工程建设标准',
  },
  {
    id: 'pack_eng_transport',
    name: '公路交通工程标准',
    description: '公路工程技术标准及交通运输行业规范',
  },
  {
    id: 'pack_eng_environment',
    name: '生态环境与环评依据',
    description: '环境影响评价法律、导则与环境管理要求',
  },
  {
    id: 'pack_region_henan',
    name: '河南省地方依据',
    description: '河南省规划与地方政策/标准',
  },
  {
    id: 'pack_region_shaanxi',
    name: '陕西省地方依据',
    description: '陕西省规划与住建/发改等地方政策（陕甘青宁新）',
  },
  {
    id: 'pack_region_gansu',
    name: '甘肃省地方依据',
    description: '甘肃省规划与住建/发改等地方政策（陕甘青宁新）',
  },
  {
    id: 'pack_region_qinghai',
    name: '青海省地方依据',
    description: '青海省规划与住建/发改等地方政策（陕甘青宁新）',
  },
  {
    id: 'pack_region_ningxia',
    name: '宁夏地方依据',
    description: '宁夏规划与住建/发改等地方政策（陕甘青宁新）',
  },
  {
    id: 'pack_region_xinjiang',
    name: '新疆地方依据',
    description: '新疆规划与住建/发改等地方政策（陕甘青宁新）',
  },
  {
    id: 'pack_industry_forestry_fire',
    name: '林草防灭火政策',
    description: '林草防灭火相关规划与政策',
  },
];

export type BasisAutoDocument = {
  siteId: BasisSourceSiteId;
  packId: string;
  group: BasisGroup;
  sourceUrl: string;
  fetchMode: 'document' | 'catalog';
  fallbackTitle: string;
  fallbackDocCode?: string;
  fallbackIssuer?: string;
};

function openStd(code: string): string {
  const q = encodeURIComponent(code);
  return `https://openstd.samr.gov.cn/bzgk/gb/std_list?p.p1=7&p.p2=${q}`;
}

function doc(
  siteId: BasisSourceSiteId,
  packId: string,
  group: BasisGroup,
  sourceUrl: string,
  fallbackTitle: string,
  extra?: {
    fetchMode?: 'document' | 'catalog';
    fallbackDocCode?: string;
    fallbackIssuer?: string;
  },
): BasisAutoDocument {
  return {
    siteId,
    packId,
    group,
    sourceUrl,
    fetchMode: extra?.fetchMode ?? 'document',
    fallbackTitle,
    fallbackDocCode: extra?.fallbackDocCode,
    fallbackIssuer: extra?.fallbackIssuer,
  };
}

/** 按网站分组的白名单原文（新增 = 在对应站下加详情 URL，再 pnpm basis:sync） */
export const BASIS_AUTO_DOCUMENTS_BY_SITE: Record<
  BasisSourceSiteId,
  BasisAutoDocument[]
> = {
  gov_cn: [
    doc(
      'gov_cn',
      'pack_common_gov',
      'policy',
      'https://www.gov.cn/gongbao/content/2019/content_5392291.htm',
      '政府投资条例',
      { fallbackDocCode: '国务院令第712号', fallbackIssuer: '国务院' },
    ),
    doc(
      'gov_cn',
      'pack_common_gov',
      'policy',
      'https://www.gov.cn/zhengce/content/2016-12/20/content_5150486.htm',
      '企业投资项目核准和备案管理条例',
      { fallbackDocCode: '国务院令第673号', fallbackIssuer: '国务院' },
    ),
    doc(
      'gov_cn',
      'pack_common_gov',
      'standard',
      'https://www.gov.cn/zhengce/zhengceku/2023-04/11/content_5750844.htm',
      '政府投资项目可行性研究报告编写通用大纲（2023年版）',
      {
        fallbackDocCode: '发改投资规〔2023〕304号附件',
        fallbackIssuer: '国家发展和改革委员会',
      },
    ),
    doc(
      'gov_cn',
      'pack_common_gov',
      'policy',
      'https://www.gov.cn/xinwen/2021-03/13/content_5592681.htm',
      '中华人民共和国国民经济和社会发展第十四个五年规划和2035年远景目标纲要',
      { fallbackIssuer: '全国人民代表大会' },
    ),
    doc(
      'gov_cn',
      'pack_common_gov',
      'policy',
      'https://www.gov.cn/zhengce/zhengceku/2021-10/26/content_5644895.htm',
      '关于推动城乡建设绿色发展的意见',
      { fallbackIssuer: '中共中央办公厅 / 国务院办公厅' },
    ),
    doc(
      'gov_cn',
      'pack_common_gov',
      'policy',
      'https://www.gov.cn/zhengce/zhengceku/2022-07/12/content_5700664.htm',
      '关于推进以县城为重要载体的城镇化建设的意见',
      { fallbackIssuer: '中共中央办公厅 / 国务院办公厅' },
    ),
    doc(
      'gov_cn',
      'pack_eng_environment',
      'policy',
      'https://www.gov.cn/xinwen/2018-11/01/content_5336422.htm',
      '中华人民共和国环境影响评价法',
      { fallbackIssuer: '全国人民代表大会常务委员会' },
    ),
    doc(
      'gov_cn',
      'pack_eng_environment',
      'policy',
      'https://www.gov.cn/zhengce/zhengceku/2017-07/18/content_5210492.htm',
      '建设项目环境保护管理条例',
      { fallbackDocCode: '国务院令第682号', fallbackIssuer: '国务院' },
    ),
    doc(
      'gov_cn',
      'pack_industry_forestry_fire',
      'policy',
      'https://www.gov.cn/zhengce/2021-03/30/content_5596867.htm',
      '关于全面加强新形势下森林草原防灭火工作的意见',
      { fallbackIssuer: '中共中央办公厅 / 国务院办公厅' },
    ),
    doc(
      'gov_cn',
      'pack_common_gov',
      'policy',
      'https://www.gov.cn/zhengce/zhengceku/2020-12/25/content_5573492.htm',
      '关于促进城市园林绿化事业健康发展的指导意见（相关政策公开）',
      { fetchMode: 'catalog', fallbackIssuer: '国务院相关部门' },
    ),
    doc(
      'gov_cn',
      'pack_common_gov',
      'policy',
      'https://www.gov.cn/zhengce/zhengceku/2021-07/15/content_5625190.htm',
      '关于加强城市基础设施建设的意见（相关政策公开）',
      { fetchMode: 'catalog', fallbackIssuer: '国务院办公厅' },
    ),
    doc(
      'gov_cn',
      'pack_common_gov',
      'policy',
      'https://www.gov.cn/zhengce/content/2021-10/21/content_5643980.htm',
      '关于完整准确全面贯彻新发展理念做好碳达峰碳中和工作的意见',
      { fallbackIssuer: '中共中央 / 国务院' },
    ),
    doc(
      'gov_cn',
      'pack_common_gov',
      'policy',
      'https://www.gov.cn/zhengce/zhengceku/2021-10/26/content_5644984.htm',
      '2030年前碳达峰行动方案',
      { fallbackIssuer: '国务院' },
    ),
    doc(
      'gov_cn',
      'pack_common_gov',
      'policy',
      'https://www.gov.cn/zhengce/zhengceku/2022-05/19/content_5691205.htm',
      '关于推进城镇老旧小区改造的指导意见（相关政策公开）',
      { fetchMode: 'catalog', fallbackIssuer: '国务院办公厅' },
    ),
    doc(
      'gov_cn',
      'pack_common_gov',
      'policy',
      'https://www.gov.cn/zhengce/zhengceku/2019-04/15/content_5382992.htm',
      '关于保持基础设施领域补短板力度的指导意见',
      { fallbackIssuer: '中共中央办公厅 / 国务院办公厅' },
    ),
    doc(
      'gov_cn',
      'pack_eng_building',
      'policy',
      'https://www.gov.cn/zhengce/zhengceku/2020-07/24/content_5529738.htm',
      '关于推动智能建造与建筑工业化协同发展的指导意见',
      { fallbackIssuer: '住房和城乡建设部等部门' },
    ),
    doc(
      'gov_cn',
      'pack_finance_eval',
      'policy',
      'https://www.gov.cn/zhengce/zhengceku/2021-04/26/content_5602469.htm',
      '关于印发《地方政府专项债券项目资金绩效管理办法》的通知（相关公开）',
      { fetchMode: 'catalog', fallbackIssuer: '财政部' },
    ),
  ],
  ndrc: [
    doc(
      'ndrc',
      'pack_common_gov',
      'policy',
      'https://www.ndrc.gov.cn/xxgk/zcfb/ghxwj/202304/t20230407_1353356.html',
      '关于印发投资项目可行性研究报告编写大纲及说明的通知',
      {
        fallbackDocCode: '发改投资规〔2023〕304号',
        fallbackIssuer: '国家发展和改革委员会',
      },
    ),
    doc(
      'ndrc',
      'pack_common_gov',
      'policy',
      'https://zfxxgk.ndrc.gov.cn/web/iteminfo.jsp?id=20220',
      '国家发展改革委关于印发投资项目可行性研究报告编写大纲及说明的通知（信息公开页）',
      {
        fallbackDocCode: '发改投资规〔2023〕304号',
        fallbackIssuer: '国家发展和改革委员会',
      },
    ),
    doc(
      'ndrc',
      'pack_common_gov',
      'policy',
      'https://www.ndrc.gov.cn/xxgk/jd/jd/202304/t20230407_1353387.html',
      '国家发展改革委有关负责同志就可研大纲答记者问',
      { fallbackIssuer: '国家发展和改革委员会' },
    ),
    doc(
      'ndrc',
      'pack_common_gov',
      'policy',
      'https://www.ndrc.gov.cn/xxgk/zcfb/tz/201612/t20161218_960589.html',
      '中央预算内投资补助和贴息项目管理办法',
      {
        fallbackDocCode: '国家发展改革委令第45号',
        fallbackIssuer: '国家发展和改革委员会',
      },
    ),
    doc(
      'ndrc',
      'pack_finance_eval',
      'standard',
      'https://www.ndrc.gov.cn/xxgk/zcfb/tz/201905/t20190508_962437.html',
      '建设项目经济评价方法与参数（第三版）',
      { fallbackIssuer: '国家发展改革委 / 建设部' },
    ),
    doc(
      'ndrc',
      'pack_common_gov',
      'policy',
      'https://www.ndrc.gov.cn/xxgk/zcfb/fzggwl/201612/t20161218_960591.html',
      '企业投资项目核准和备案管理办法',
      {
        fetchMode: 'catalog',
        fallbackDocCode: '国家发展改革委令第2号',
        fallbackIssuer: '国家发展和改革委员会',
      },
    ),
    doc(
      'ndrc',
      'pack_common_gov',
      'policy',
      'https://www.ndrc.gov.cn/xxgk/zcfb/tz/',
      '国家发展改革委 · 通知公告专栏',
      { fetchMode: 'catalog', fallbackIssuer: '国家发展和改革委员会' },
    ),
    doc(
      'ndrc',
      'pack_common_gov',
      'policy',
      'https://www.ndrc.gov.cn/xxgk/zcfb/ghxwj/',
      '国家发展改革委 · 规划司文件专栏',
      { fetchMode: 'catalog', fallbackIssuer: '国家发展和改革委员会' },
    ),
    doc(
      'ndrc',
      'pack_common_gov',
      'policy',
      'https://www.ndrc.gov.cn/fggz/tzgg/tzgz/',
      '国家发展改革委 · 投资管理相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '国家发展和改革委员会' },
    ),
    doc(
      'ndrc',
      'pack_common_gov',
      'policy',
      'https://www.ndrc.gov.cn/xxgk/zcfb/tz/202104/t20210426_1277373.html',
      '关于进一步做好基础设施领域不动产投资信托基金（REITs）试点工作的通知（相关公开）',
      { fetchMode: 'catalog', fallbackIssuer: '国家发展和改革委员会' },
    ),
  ],
  mohurd: [
    doc(
      'mohurd',
      'pack_finance_eval',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/tzgg/index.html#finance-eval',
      '市政公用设施建设项目经济评价方法与参数',
      { fetchMode: 'catalog', fallbackIssuer: '住房和城乡建设部' },
    ),
    doc(
      'mohurd',
      'pack_eng_municipal_road',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#CJJ37-2012',
      '城市道路工程设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'CJJ37-2012',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_municipal_road',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#CJJ193-2012',
      '城市道路路线设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'CJJ193-2012',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_municipal_road',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#CJJ194-2013',
      '城市道路路基设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'CJJ194-2013',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_municipal_road',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#CJJ169-2012',
      '城镇道路路面设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'CJJ169-2012',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_municipal_road',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#CJJ11-2011',
      '城市桥梁设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'CJJ11-2011',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#GB50016',
      '建筑设计防火规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50016-2014（2018年版）',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#GB50189',
      '公共建筑节能设计标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50189-2015',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#GB50352',
      '民用建筑设计统一标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50352-2019',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#GB50009',
      '建筑结构荷载规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50009-2012',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#GB50204',
      '混凝土结构工程施工质量验收规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50204-2015',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#GB55031',
      '民用建筑通用规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB55031-2022',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#GB55002',
      '建筑与市政工程抗震通用规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB55002-2021',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#GB50345',
      '屋面工程技术规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50345-2012',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#GB50210',
      '建筑装饰装修工程质量验收标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50210-2018',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_municipal_road',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#CJJ1-2008',
      '城镇道路工程施工与质量验收规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'CJJ1-2008',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_municipal_road',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#GB50268',
      '给水排水管道工程施工及验收规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50268-2008',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_municipal_road',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#GB50013',
      '室外给水设计标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50013-2018',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'policy',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/tzgg/index.html',
      '住房和城乡建设部 · 通知公告',
      { fetchMode: 'catalog', fallbackIssuer: '住房和城乡建设部' },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2025/art_66adac27fa2144bb86f98fe4c297efd6.html',
      '住宅项目规范',
      {
        fallbackDocCode: 'GB55038-2025',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'standard',
      'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2024/art_17339_770016.html',
      '建筑防火通用规范（住建部公告页）',
      {
        fallbackDocCode: 'GB55037-2022',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'policy',
      'https://www.mohurd.gov.cn/ztbd/zyglgd/zyglgdbz/index.html',
      '住房城乡建设部 · 标准公告/强制性工程建设规范专栏',
      { fetchMode: 'catalog', fallbackIssuer: '住房和城乡建设部' },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'policy',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#drawing-review',
      '房屋建筑和市政基础设施工程施工图设计文件审查管理办法（相关公开）',
      {
        fetchMode: 'catalog',
        fallbackDocCode: '住房和城乡建设部令第13号',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'policy',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#quality',
      '建设工程质量管理条例配套规定与质量安全监管公开',
      { fetchMode: 'catalog', fallbackIssuer: '住房和城乡建设部' },
    ),
    doc(
      'mohurd',
      'pack_eng_building',
      'policy',
      'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html#fire-acceptance',
      '建设工程消防设计审查验收管理暂行规定相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '住房和城乡建设部' },
    ),
  ],
  mot: [
    doc(
      'mot',
      'pack_eng_transport',
      'standard',
      'https://xxgk.mot.gov.cn/jigou/glj/202006/t20200623_3312197.html',
      '公路工程技术标准',
      {
        fallbackDocCode: 'JTG B01-2014',
        fallbackIssuer: '交通运输部',
      },
    ),
    doc(
      'mot',
      'pack_eng_transport',
      'standard',
      'https://xxgk.mot.gov.cn/jigou/glj/202006/t20200623_3312197.html#JTG-D20',
      '公路路线设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'JTG D20-2017',
        fallbackIssuer: '交通运输部',
      },
    ),
    doc(
      'mot',
      'pack_eng_transport',
      'standard',
      'https://xxgk.mot.gov.cn/jigou/glj/202006/t20200623_3312197.html#JTG-D30',
      '公路路基设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'JTG D30-2015',
        fallbackIssuer: '交通运输部',
      },
    ),
    doc(
      'mot',
      'pack_eng_transport',
      'policy',
      'https://www.mot.gov.cn/zhengce/',
      '交通运输部政策文件专栏',
      { fetchMode: 'catalog', fallbackIssuer: '交通运输部' },
    ),
    doc(
      'mot',
      'pack_eng_transport',
      'standard',
      'https://xxgk.mot.gov.cn/jigou/glj/202006/t20200623_3312197.html#JTG-D40',
      '公路沥青路面设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'JTG D50-2017',
        fallbackIssuer: '交通运输部',
      },
    ),
    doc(
      'mot',
      'pack_eng_transport',
      'standard',
      'https://xxgk.mot.gov.cn/jigou/glj/202006/t20200623_3312197.html#JTG-F80',
      '公路工程质量检验评定标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'JTG F80/1-2017',
        fallbackIssuer: '交通运输部',
      },
    ),
    doc(
      'mot',
      'pack_eng_transport',
      'standard',
      'https://xxgk.mot.gov.cn/jigou/glj/202006/t20200623_3312197.html#JTG-B05',
      '公路项目安全性评价规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'JTG B05-2015',
        fallbackIssuer: '交通运输部',
      },
    ),
    doc(
      'mot',
      'pack_eng_transport',
      'policy',
      'https://xxgk.mot.gov.cn/jigou/glj/',
      '交通运输部公路局信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '交通运输部' },
    ),
  ],
  mwr: [
    doc(
      'mwr',
      'pack_common_gov',
      'policy',
      'https://www.mwr.gov.cn/zwgk/',
      '水利部政府信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '水利部' },
    ),
    doc(
      'mwr',
      'pack_common_gov',
      'policy',
      'https://www.mwr.gov.cn/zw/zcfg/',
      '水利部政策法规专栏',
      { fetchMode: 'catalog', fallbackIssuer: '水利部' },
    ),
    doc(
      'mwr',
      'pack_common_gov',
      'policy',
      'https://www.mwr.gov.cn/zwgk/gknr/',
      '水利部公开内容专栏',
      { fetchMode: 'catalog', fallbackIssuer: '水利部' },
    ),
    doc(
      'mwr',
      'pack_common_gov',
      'standard',
      'https://www.mwr.gov.cn/zw/zcfg/#SL303',
      '水利水电工程施工组织设计规范（相关公开）',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'SL303',
        fallbackIssuer: '水利部',
      },
    ),
    doc(
      'mwr',
      'pack_common_gov',
      'policy',
      'https://www.mwr.gov.cn/zwgk/#water-project',
      '水利工程建设与管理政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '水利部' },
    ),
  ],
  mee: [
    doc(
      'mee',
      'pack_eng_environment',
      'standard',
      'https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/other/pjjsdz/202406/t20240607_1075319.shtml',
      '环境影响评价技术导则 公路建设项目',
      {
        fallbackDocCode: 'HJ 1358—2024',
        fallbackIssuer: '生态环境部',
      },
    ),
    doc(
      'mee',
      'pack_eng_environment',
      'standard',
      'https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/other/pjjsdz/',
      '环境影响评价技术导则专栏',
      { fetchMode: 'catalog', fallbackIssuer: '生态环境部' },
    ),
    doc(
      'mee',
      'pack_eng_environment',
      'policy',
      'https://www.mee.gov.cn/ywgz/fgbz/fl/',
      '生态环境部法律法规专栏',
      { fetchMode: 'catalog', fallbackIssuer: '生态环境部' },
    ),
    doc(
      'mee',
      'pack_eng_environment',
      'standard',
      'https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/other/pjjsdz/#HJ2.1',
      '环境影响评价技术导则 总纲',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'HJ 2.1-2016',
        fallbackIssuer: '生态环境部',
      },
    ),
    doc(
      'mee',
      'pack_eng_environment',
      'standard',
      'https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/other/pjjsdz/#HJ2.2',
      '环境影响评价技术导则 大气环境',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'HJ 2.2-2018',
        fallbackIssuer: '生态环境部',
      },
    ),
    doc(
      'mee',
      'pack_eng_environment',
      'standard',
      'https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/other/pjjsdz/#HJ2.3',
      '环境影响评价技术导则 地表水环境',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'HJ 2.3-2018',
        fallbackIssuer: '生态环境部',
      },
    ),
    doc(
      'mee',
      'pack_eng_environment',
      'standard',
      'https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/other/pjjsdz/#HJ19',
      '环境影响评价技术导则 生态影响',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'HJ 19-2022',
        fallbackIssuer: '生态环境部',
      },
    ),
    doc(
      'mee',
      'pack_eng_environment',
      'policy',
      'https://www.mee.gov.cn/ywgz/hbzcfb/',
      '生态环境部规范性文件公开',
      { fetchMode: 'catalog', fallbackIssuer: '生态环境部' },
    ),
  ],
  mof: [
    doc(
      'mof',
      'pack_finance_eval',
      'policy',
      'https://www.mof.gov.cn/zhengwuxinxi/zhengcefabu/',
      '财政部政策发布专栏',
      { fetchMode: 'catalog', fallbackIssuer: '财政部' },
    ),
    doc(
      'mof',
      'pack_finance_eval',
      'policy',
      'https://www.mof.gov.cn/gkml/',
      '财政部公开目录',
      { fetchMode: 'catalog', fallbackIssuer: '财政部' },
    ),
    doc(
      'mof',
      'pack_finance_eval',
      'policy',
      'https://www.mof.gov.cn/zhengwuxinxi/zhengcefabu/#budget',
      '政府收支分类科目及预算管理相关政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '财政部' },
    ),
    doc(
      'mof',
      'pack_finance_eval',
      'policy',
      'https://www.mof.gov.cn/zhengwuxinxi/zhengcefabu/#ppp',
      '政府和社会资本合作（PPP）相关政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '财政部' },
    ),
    doc(
      'mof',
      'pack_finance_eval',
      'policy',
      'https://www.mof.gov.cn/zhengwuxinxi/zhengcefabu/#special-bond',
      '地方政府专项债券管理相关政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '财政部' },
    ),
    doc(
      'mof',
      'pack_finance_eval',
      'standard',
      'https://www.mof.gov.cn/zhengwuxinxi/zhengcefabu/#asset-eval',
      '财政投资评审相关办法与参数公开',
      { fetchMode: 'catalog', fallbackIssuer: '财政部' },
    ),
  ],
  mem: [
    doc(
      'mem',
      'pack_eng_building',
      'policy',
      'https://www.mem.gov.cn/gk/zfxxgkpt/fdzdgknr/202106/t20210625_389980.shtml',
      '高层民用建筑消防安全管理规定',
      {
        fallbackDocCode: '应急管理部令第5号',
        fallbackIssuer: '应急管理部',
      },
    ),
    doc(
      'mem',
      'pack_eng_building',
      'policy',
      'https://www.mem.gov.cn/gk/zfxxgkpt/fdzdgknr/gz11/201207/t20120717_405707.shtml',
      '消防监督检查规定',
      { fallbackIssuer: '应急管理部' },
    ),
    doc(
      'mem',
      'pack_eng_building',
      'policy',
      'https://www.mem.gov.cn/gk/zfxxgkpt/fdzdgknr/',
      '应急管理部 · 法定主动公开内容（消防/应急）',
      { fetchMode: 'catalog', fallbackIssuer: '应急管理部' },
    ),
    doc(
      'mem',
      'pack_eng_building',
      'policy',
      'https://www.mem.gov.cn/gk/zfxxgkpt/fdzdgknr/#construction-fire',
      '建设工程消防审验与消防安全相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '应急管理部' },
    ),
  ],
  mnr: [
    doc(
      'mnr',
      'pack_common_gov',
      'policy',
      'https://www.mnr.gov.cn/dt/ywbb/',
      '自然资源部 · 业务公开（用地/规划相关）',
      { fetchMode: 'catalog', fallbackIssuer: '自然资源部' },
    ),
    doc(
      'mnr',
      'pack_common_gov',
      'policy',
      'https://www.mnr.gov.cn/gk/',
      '自然资源部政府信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '自然资源部' },
    ),
    doc(
      'mnr',
      'pack_eng_building',
      'policy',
      'https://www.mnr.gov.cn/gk/#construction-land',
      '建设用地供应与规划用地管理相关政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '自然资源部' },
    ),
    doc(
      'mnr',
      'pack_eng_building',
      'policy',
      'https://www.mnr.gov.cn/gk/#spatial-plan',
      '国土空间规划与建设项目用地预审相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '自然资源部' },
    ),
  ],
  openstd: [
    doc(
      'openstd',
      'pack_eng_municipal_road',
      'standard',
      openStd('GB 50014-2021'),
      '室外排水设计标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50014-2021',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_municipal_road',
      'standard',
      openStd('GB 50763-2012'),
      '无障碍设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50763-2012',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_municipal_road',
      'standard',
      openStd('GB 51245-2017'),
      '工业建筑节能设计统一标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB51245-2017',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50016-2014'),
      '建筑设计防火规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50016-2014',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 55037-2022'),
      '建筑防火通用规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB55037-2022',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 55024-2022'),
      '建筑电气与智能化通用规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB55024-2022',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 55015-2021'),
      '建筑节能与可再生能源利用通用规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB55015-2021',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 55020-2021'),
      '建筑给水排水与节水通用规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB55020-2021',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 51348-2019'),
      '民用建筑电气设计标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB51348-2019',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50057-2010'),
      '建筑物防雷设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50057-2010',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50303-2015'),
      '建筑电气工程施工质量验收规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50303-2015',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50019-2015'),
      '工业建筑供暖通风与空气调节设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50019-2015',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50736-2012'),
      '民用建筑供暖通风与空气调节设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50736-2012',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50015-2019'),
      '建筑给水排水设计标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50015-2019',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 55016-2021'),
      '建筑环境通用规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB55016-2021',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50325-2020'),
      '民用建筑工程室内环境污染控制标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50325-2020',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_municipal_road',
      'standard',
      openStd('CJJ 37-2012'),
      '城市道路工程设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'CJJ37-2012',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_municipal_road',
      'standard',
      openStd('CJJ 169-2012'),
      '城镇道路路面设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'CJJ169-2012',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_transport',
      'standard',
      openStd('JTG B01-2014'),
      '公路工程技术标准（国家标准公开检索）',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'JTG B01-2014',
        fallbackIssuer: '交通运输部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_transport',
      'standard',
      openStd('JTG D20-2017'),
      '公路路线设计规范（国家标准公开检索）',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'JTG D20-2017',
        fallbackIssuer: '交通运输部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 55031-2022'),
      '民用建筑通用规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB55031-2022',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 55002-2021'),
      '建筑与市政工程抗震通用规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB55002-2021',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50011-2010'),
      '建筑抗震设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50011-2010',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50010-2010'),
      '混凝土结构设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50010-2010',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50017-2017'),
      '钢结构设计标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50017-2017',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50223-2008'),
      '建筑工程抗震设防分类标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50223-2008',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50352-2019'),
      '民用建筑设计统一标准（国家标准公开检索）',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50352-2019',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50189-2015'),
      '公共建筑节能设计标准（国家标准公开检索）',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50189-2015',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_municipal_road',
      'standard',
      openStd('CJJ 193-2012'),
      '城市道路路线设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'CJJ193-2012',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_municipal_road',
      'standard',
      openStd('CJJ 11-2011'),
      '城市桥梁设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'CJJ11-2011',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_municipal_road',
      'standard',
      openStd('GB 50013-2018'),
      '室外给水设计标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50013-2018',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_municipal_road',
      'standard',
      openStd('GB 50268-2008'),
      '给水排水管道工程施工及验收规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50268-2008',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_transport',
      'standard',
      openStd('JTG D30-2015'),
      '公路路基设计规范（国家标准公开检索）',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'JTG D30-2015',
        fallbackIssuer: '交通运输部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_transport',
      'standard',
      openStd('JTG D50-2017'),
      '公路沥青路面设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'JTG D50-2017',
        fallbackIssuer: '交通运输部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_transport',
      'standard',
      openStd('JTG F80/1-2017'),
      '公路工程质量检验评定标准 第一册 土建工程',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'JTG F80/1-2017',
        fallbackIssuer: '交通运输部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 55038-2025'),
      '住宅项目规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB55038-2025',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50368-2005'),
      '住宅建筑规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50368-2005',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50096-2011'),
      '住宅设计规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50096-2011',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50300-2013'),
      '建筑工程施工质量验收统一标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50300-2013',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 50345-2012'),
      '屋面工程技术规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB50345-2012',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('JGJ 59-2011'),
      '建筑施工安全检查标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'JGJ59-2011',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
    doc(
      'openstd',
      'pack_eng_building',
      'standard',
      openStd('GB 55001-2021'),
      '工程结构通用规范',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'GB55001-2021',
        fallbackIssuer: '住房和城乡建设部',
      },
    ),
  ],
  henan: [
    doc(
      'henan',
      'pack_region_henan',
      'policy',
      'https://www.henan.gov.cn/2021/04-13/2132370.html',
      '河南省国民经济和社会发展第十四个五年规划和二〇三五年远景目标纲要',
      { fallbackIssuer: '河南省人民政府' },
    ),
    doc(
      'henan',
      'pack_region_henan',
      'policy',
      'https://www.henan.gov.cn/zwgk/fgwj/',
      '河南省人民政府法规文件公开专栏',
      { fetchMode: 'catalog', fallbackIssuer: '河南省人民政府' },
    ),
    doc(
      'henan',
      'pack_region_henan',
      'standard',
      'https://www.henan.gov.cn/zwgk/fgwj/#DBJ41-T164',
      '河南省城镇控水防尘海绵型道路技术规程',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'DBJ41/T164-2016',
        fallbackIssuer: '河南省住房和城乡建设厅',
      },
    ),
    doc(
      'henan',
      'pack_region_henan',
      'policy',
      'https://www.henan.gov.cn/zwgk/fgwj/#investment',
      '河南省固定资产投资与项目管理相关政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '河南省发展和改革委员会' },
    ),
    doc(
      'henan',
      'pack_region_henan',
      'policy',
      'https://www.henan.gov.cn/zwgk/fgwj/#housing',
      '河南省住房城乡建设相关政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '河南省住房和城乡建设厅' },
    ),
    doc(
      'henan',
      'pack_region_henan',
      'standard',
      'https://www.henan.gov.cn/zwgk/fgwj/#DBJ41-building',
      '河南省工程建设地方标准公开目录',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '河南省住房和城乡建设厅',
      },
    ),
  ],
  forestry: [
    doc(
      'forestry',
      'pack_industry_forestry_fire',
      'policy',
      'https://www.forestry.gov.cn/c/www/gkml.jhtml',
      '“十四五”全国草原防灭火规划',
      { fetchMode: 'catalog', fallbackIssuer: '国家林业和草原局' },
    ),
    doc(
      'forestry',
      'pack_industry_forestry_fire',
      'policy',
      'https://www.forestry.gov.cn/c/www/gknr.jhtml',
      '国家林业和草原局公开内容专栏',
      { fetchMode: 'catalog', fallbackIssuer: '国家林业和草原局' },
    ),
    doc(
      'forestry',
      'pack_industry_forestry_fire',
      'policy',
      'https://www.forestry.gov.cn/c/www/gkml.jhtml#forest-fire',
      '森林草原火灾防控与应急管理相关政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '国家林业和草原局' },
    ),
    doc(
      'forestry',
      'pack_industry_forestry_fire',
      'policy',
      'https://www.forestry.gov.cn/c/www/gknr.jhtml#infrastructure',
      '林草防火道路与基础设施建设相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '国家林业和草原局' },
    ),
  ],
  shaanxi: [
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://kjt.shaanxi.gov.cn/gk/fdzdgknr/ghjh/zcq/202103/t20210302_3359946.html',
      '陕西省国民经济和社会发展第十四个五年规划和二〇三五年远景目标纲要',
      { fallbackIssuer: '陕西省人民政府' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://sndrc.shaanxi.gov.cn/zfxxgk/zc/fgwj/xzgfxwj/202510/t20251029_3579673.html',
      '陕西省发展和改革委员会关于印发《陕西省固定资产投资项目节能审查和碳排放评价实施办法》的通知',
      {
        fallbackDocCode: '陕发改环资〔2025〕1446号',
        fallbackIssuer: '陕西省发展和改革委员会',
      },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://www.shaanxi.gov.cn/zfxxgk/fdzdgknr/ghxx/ssiwgh/gmjjhshfzgh_2438/',
      '陕西省国民经济和社会发展规划信息公开专栏',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省人民政府' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://www.shaanxi.gov.cn/zfxxgk/fdzdgknr/zcwj/',
      '陕西省人民政府政策文件公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省人民政府' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://sndrc.shaanxi.gov.cn/zfxxgk/zc/fgwj/sfzggwwj/',
      '陕西省发展和改革委员会 · 省发改委文件',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省发展和改革委员会' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://sndrc.shaanxi.gov.cn/zfxxgk/zc/fgwj/xzgfxwj/',
      '陕西省发展和改革委员会 · 行政规范性文件',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省发展和改革委员会' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://js.shaanxi.gov.cn/zfxxgk/fdzdgknr/',
      '陕西省住房和城乡建设厅 · 法定主动公开内容',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省住房和城乡建设厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://js.shaanxi.gov.cn/zfxxgk/gkzd/',
      '陕西省住房和城乡建设厅政府信息公开制度',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省住房和城乡建设厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://sthjt.shaanxi.gov.cn/zfxxgk/',
      '陕西省生态环境厅政府信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省生态环境厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://jtt.shaanxi.gov.cn/zfxxgk/',
      '陕西省交通运输厅政府信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省交通运输厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://sndrc.shaanxi.gov.cn/zfxxgk/zc/fgwj/sfzggwwj/#investment',
      '陕西省发改委 · 固定资产投资与项目管理文件',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省发展和改革委员会' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://js.shaanxi.gov.cn/zfxxgk/fdzdgknr/#standard',
      '陕西省住建厅 · 地方工程建设标准/规范公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省住房和城乡建设厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://js.shaanxi.gov.cn/zfxxgk/fdzdgknr/#urban',
      '陕西省住建厅 · 市政与园林相关政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省住房和城乡建设厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://sthjt.shaanxi.gov.cn/zfxxgk/#eia',
      '陕西省生态环境厅 · 环评与排污许可相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省生态环境厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://www.shaanxi.gov.cn/zfxxgk/fdzdgknr/zcwj/#urbanization',
      '陕西省新型城镇化与县域经济相关政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省人民政府' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://js.shaanxi.gov.cn/sy/zcwj/stwj/',
      '陕西省住房和城乡建设厅 · 省厅文件',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省住房和城乡建设厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://js.shaanxi.gov.cn/zfxxgk/',
      '陕西省住房和城乡建设厅 · 政府信息公开总入口',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省住房和城乡建设厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'standard',
      'https://js.shaanxi.gov.cn/sy/zcwj/stwj/#local-standard',
      '陕西省工程建设地方标准与标准设计公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省住房和城乡建设厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://js.shaanxi.gov.cn/sy/zcwj/stwj/#drawing-review',
      '陕西省房屋建筑与市政工程施工图审查相关文件',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省住房和城乡建设厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://zrzyt.shaanxi.gov.cn/',
      '陕西省自然资源厅 · 建设用地与规划用地公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省自然资源厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://js.shaanxi.gov.cn/sy/zcwj/stwj/202503/t20250331_3468739.html',
      '陕西省住房和城乡建设厅等5部门关于印发《陕西省农村住房建设管理办法（试行）》的通知',
      {
        fallbackDocCode: '陕建发〔2025〕29号',
        fallbackIssuer: '陕西省住房和城乡建设厅',
      },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://zrzyt.shaanxi.gov.cn/zrzygz/tdgl/tdys/202404/t20240412_3260761.html',
      '陕西省自然资源厅关于进一步强化规划许可规范规划实施监督管理的意见（试行）',
      { fallbackIssuer: '陕西省自然资源厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://zrzyt.shaanxi.gov.cn/zfxxgk/fdzdnrgk/ldcy/',
      '陕西省自然资源厅 · 建设用地审批结果公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省自然资源厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://js.shaanxi.gov.cn/zfxxgk/zc/zcjd/202310/t20231023_2856702.html',
      '陕西省建设工程消防设计审查验收管理相关规定政策解读',
      { fallbackIssuer: '陕西省住房和城乡建设厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://js.shaanxi.gov.cn/sy/zcwj/stwj/#fire-acceptance',
      '陕西省住建厅 · 建设工程消防设计审查验收相关文件',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省住房和城乡建设厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://yjt.shaanxi.gov.cn/gk/zcwj/ztfl/hzfz/',
      '陕西省应急管理厅 · 火灾防治管理政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省应急管理厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'standard',
      'https://snamr.shaanxi.gov.cn/',
      '陕西省市场监督管理局 · 地方标准/工程建设相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省市场监督管理局' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://js.shaanxi.gov.cn/sy/zcwj/stwj/#green-building',
      '陕西省住建厅 · 建筑节能与绿色建筑管理文件',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省住房和城乡建设厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://js.shaanxi.gov.cn/sy/zcwj/stwj/#quality-safety',
      '陕西省住建厅 · 房屋市政工程质量安全监管文件',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省住房和城乡建设厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://czt.shaanxi.gov.cn/',
      '陕西省财政厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省财政厅' },
    ),
    doc(
      'shaanxi',
      'pack_finance_eval',
      'policy',
      'https://czt.shaanxi.gov.cn/#special-bond',
      '陕西省财政厅 · 政府投资与专项债券管理公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省财政厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://slt.shaanxi.gov.cn/',
      '陕西省水利厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省水利厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://slt.shaanxi.gov.cn/#water-project',
      '陕西省水利厅 · 水利工程建设与管理公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省水利厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://jyt.shaanxi.gov.cn/',
      '陕西省教育厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省教育厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://jyt.shaanxi.gov.cn/gk/#campus',
      '陕西省教育厅 · 校园建设与教育基建相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省教育厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://whhlyt.shaanxi.gov.cn/',
      '陕西省文化和旅游厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省文化和旅游厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://whhlyt.shaanxi.gov.cn/#cultural-facility',
      '陕西省文旅厅 · 文化旅游设施与小剧场建设相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省文化和旅游厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://nynct.shaanxi.gov.cn/',
      '陕西省农业农村厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省农业农村厅' },
    ),
    doc(
      'shaanxi',
      'pack_region_shaanxi',
      'policy',
      'https://lyj.shaanxi.gov.cn/',
      '陕西省林业局 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '陕西省林业局' },
    ),
  ],
  gansu: [
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://www.gansu.gov.cn/gsszf/c100055/202110/1854437/files/d4f251d912554401804e1769f8019b6b.pdf',
      '甘肃省国民经济和社会发展第十四个五年规划和二〇三五年远景目标纲要（相关公开文件）',
      {
        fetchMode: 'catalog',
        fallbackDocCode: '甘政发〔2021〕18号',
        fallbackIssuer: '甘肃省人民政府',
      },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://www.gansu.gov.cn/gsszf/c100002/zfxxgk.shtml',
      '甘肃省人民政府政府信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省人民政府' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://www.gansu.gov.cn/gsszf/c100054/zfxxgkzn.shtml',
      '甘肃省人民政府政策文件公开专栏',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省人民政府' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://fzgg.gansu.gov.cn/',
      '甘肃省发展和改革委员会门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省发展和改革委员会' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://zjt.gansu.gov.cn/',
      '甘肃省住房和城乡建设厅门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省住房和城乡建设厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://zhzw.zjt.gansu.gov.cn/',
      '甘肃省住建厅智慧政务公开入口',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省住房和城乡建设厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://sthjt.gansu.gov.cn/',
      '甘肃省生态环境厅门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省生态环境厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://jtyst.gansu.gov.cn/',
      '甘肃省交通运输厅门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省交通运输厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://fzgg.gansu.gov.cn/#investment',
      '甘肃省发改委 · 投资项目与预算内投资管理公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省发展和改革委员会' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://zjt.gansu.gov.cn/#standard',
      '甘肃省住建厅 · 工程建设地方标准与规范性文件',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省住房和城乡建设厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://zjt.gansu.gov.cn/#urban-road',
      '甘肃省住建厅 · 市政道路与海绵城市相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省住房和城乡建设厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://sthjt.gansu.gov.cn/#eia',
      '甘肃省生态环境厅 · 环境影响评价相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省生态环境厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://www.gansu.gov.cn/gsszf/c100054/zfxxgkzn.shtml#fyp',
      '甘肃省“十四五”专项规划与重大项目政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省人民政府' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'standard',
      'https://zjt.gansu.gov.cn/zjt/c115381/202109/1798271/files/1b8ccce4631e4e73b1785b74b69e57d0.pdf',
      '甘肃省建筑工程施工图设计文件联合审查技术要点（2021版）',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '甘肃省住房和城乡建设厅',
      },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://zjt.gansu.gov.cn/#drawing-review',
      '甘肃省住建厅 · 施工图审查与勘察设计管理公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省住房和城乡建设厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'standard',
      'https://zjt.gansu.gov.cn/#local-standard-plan',
      '甘肃省工程建设地方标准及标准设计编制计划公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省住房和城乡建设厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://zrzy.gansu.gov.cn/',
      '甘肃省自然资源厅 · 建设用地与规划用地公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省自然资源厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'standard',
      'https://zjt.gansu.gov.cn/zjt/c115381/202109/1798271/files/67d0c079c05d466b8da823ee9d7243fd.pdf',
      '甘肃省市政工程施工图设计文件联合审查技术要点（建筑专业审查要点相关公开）',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '甘肃省住房和城乡建设厅',
      },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://zjt.gansu.gov.cn/#fire-design',
      '甘肃省住建厅 · 建设工程消防设计技术审查要点公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省住房和城乡建设厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://zjt.gansu.gov.cn/#quality-detection',
      '甘肃省住建厅 · 建设工程质量检测与施工许可管理公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省住房和城乡建设厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://zjt.gansu.gov.cn/#green-building',
      '甘肃省住建厅 · 建筑节能与绿色建筑工作要点公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省住房和城乡建设厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://yjgl.gansu.gov.cn/',
      '甘肃省应急管理厅 · 建筑施工与消防安全相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省应急管理厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'standard',
      'https://scjg.gansu.gov.cn/',
      '甘肃省市场监督管理局 · 地方标准与工程建设相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省市场监督管理局' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://czt.gansu.gov.cn/',
      '甘肃省财政厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省财政厅' },
    ),
    doc(
      'gansu',
      'pack_finance_eval',
      'policy',
      'https://czt.gansu.gov.cn/#special-bond',
      '甘肃省财政厅 · 政府投资与专项债券管理公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省财政厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://slt.gansu.gov.cn/',
      '甘肃省水利厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省水利厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://slt.gansu.gov.cn/#water-project',
      '甘肃省水利厅 · 水利工程建设与管理公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省水利厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://jyt.gansu.gov.cn/',
      '甘肃省教育厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省教育厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://jyt.gansu.gov.cn/#campus',
      '甘肃省教育厅 · 校园建设与教育基建相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省教育厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://wlt.gansu.gov.cn/',
      '甘肃省文化和旅游厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省文化和旅游厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://nync.gansu.gov.cn/',
      '甘肃省农业农村厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省农业农村厅' },
    ),
    doc(
      'gansu',
      'pack_region_gansu',
      'policy',
      'https://lycy.gansu.gov.cn/',
      '甘肃省林草局 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '甘肃省林业和草原局' },
    ),
  ],
  qinghai: [
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://www.qinghai.gov.cn/zwgk/system/2021/02/19/010376582.shtml',
      '青海省国民经济和社会发展第十四个五年规划和二〇三五年远景目标纲要',
      { fallbackIssuer: '青海省人民政府' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://www.qinghai.gov.cn/xxgk/xxgk/fd/ghxx/202106/t20210609_185076.html',
      '青海省人民政府办公厅关于印发十四五规划纲要任务分工方案的通知',
      { fallbackIssuer: '青海省人民政府办公厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://www.qinghai.gov.cn/zwgk/',
      '青海省人民政府政务公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省人民政府' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://fgw.qinghai.gov.cn/',
      '青海省发展和改革委员会门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省发展和改革委员会' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://zjt.qinghai.gov.cn/',
      '青海省住房和城乡建设厅门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省住房和城乡建设厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://sthjt.qinghai.gov.cn/',
      '青海省生态环境厅门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省生态环境厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://jtyst.qinghai.gov.cn/',
      '青海省交通运输厅门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省交通运输厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://fgw.qinghai.gov.cn/#investment',
      '青海省发改委 · 投资管理与重大项目公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省发展和改革委员会' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://zjt.qinghai.gov.cn/#standard',
      '青海省住建厅 · 工程建设标准与规范性文件',
      { fetchMode: 'catalog', fallbackIssuer: '青海省住房和城乡建设厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://zjt.qinghai.gov.cn/#municipal',
      '青海省住建厅 · 市政公用与城镇建设公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省住房和城乡建设厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://sthjt.qinghai.gov.cn/#eia',
      '青海省生态环境厅 · 环境影响评价相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省生态环境厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://www.qinghai.gov.cn/zwgk/#urban',
      '青海省城镇建设与公共服务相关政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省人民政府' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'standard',
      'https://zjt.qinghai.gov.cn/#DB63-1382',
      '青海省住宅工程质量分户验收规程',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'DB63/T1382-2024',
        fallbackIssuer: '青海省住房和城乡建设厅',
      },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'standard',
      'https://zjt.qinghai.gov.cn/#DB63-2261',
      '高原地区低碳建筑技术导则',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'DB63/T2261-2024',
        fallbackIssuer: '青海省住房和城乡建设厅',
      },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'standard',
      'https://zjt.qinghai.gov.cn/#DB63-1307',
      '青海省建设工程绿色施工规程',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'DB63/T1307-2024',
        fallbackIssuer: '青海省住房和城乡建设厅',
      },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://zjt.qinghai.gov.cn/#drawing-review',
      '青海省住建厅 · 勘察设计与施工图审查管理公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省住房和城乡建设厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://zrzyt.qinghai.gov.cn/',
      '青海省自然资源厅 · 建设用地与规划用地公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省自然资源厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'standard',
      'https://zjt.qinghai.gov.cn/#DB63-2424',
      '保障性住房建设管理导则',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'DB63/T2424-2025',
        fallbackIssuer: '青海省住房和城乡建设厅',
      },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'standard',
      'https://zjt.qinghai.gov.cn/#DB63-1684',
      '民用建筑外墙外保温系统检验标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'DB63/T1684-2025',
        fallbackIssuer: '青海省住房和城乡建设厅',
      },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'standard',
      'https://zjt.qinghai.gov.cn/#DB63-2425',
      '建筑工程减隔震应用技术规程',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'DB63/T2425-2025',
        fallbackIssuer: '青海省住房和城乡建设厅',
      },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'standard',
      'https://zjt.qinghai.gov.cn/#DB63-2423',
      '房屋建筑和市政工程全过程工程咨询服务标准',
      {
        fetchMode: 'catalog',
        fallbackDocCode: 'DB63/T2423-2025',
        fallbackIssuer: '青海省住房和城乡建设厅',
      },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://yjt.qinghai.gov.cn/',
      '青海省应急管理厅 · 建筑施工与消防安全相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省应急管理厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'standard',
      'https://scjgj.qinghai.gov.cn/',
      '青海省市场监督管理局 · 地方标准与工程建设相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省市场监督管理局' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://czt.qinghai.gov.cn/',
      '青海省财政厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省财政厅' },
    ),
    doc(
      'qinghai',
      'pack_finance_eval',
      'policy',
      'https://czt.qinghai.gov.cn/#special-bond',
      '青海省财政厅 · 政府投资与专项债券管理公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省财政厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://slt.qinghai.gov.cn/',
      '青海省水利厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省水利厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://slt.qinghai.gov.cn/#water-project',
      '青海省水利厅 · 水利工程建设与管理公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省水利厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://jyt.qinghai.gov.cn/',
      '青海省教育厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省教育厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://jyt.qinghai.gov.cn/#campus',
      '青海省教育厅 · 校园建设与教育基建相关公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省教育厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://whhlyt.qinghai.gov.cn/',
      '青海省文化和旅游厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省文化和旅游厅' },
    ),
    doc(
      'qinghai',
      'pack_region_qinghai',
      'policy',
      'https://nynct.qinghai.gov.cn/',
      '青海省农业农村厅 · 门户信息公开',
      { fetchMode: 'catalog', fallbackIssuer: '青海省农业农村厅' },
    ),
  ],
  ningxia: [
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://www.nx.gov.cn/zwgk/qzfwj/202103/t20210309_2620843.html',
      '自治区人民政府关于印发宁夏回族自治区国民经济和社会发展第十四个五年规划和2035年远景目标纲要的通知',
      {
        fallbackDocCode: '宁政发〔2021〕1号',
        fallbackIssuer: '宁夏回族自治区人民政府',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://www.nx.gov.cn/zwgk/qzfwj/202105/t20210524_2853214.html',
      '自治区人民政府办公厅关于建立健全自治区“十四五”规划纲要实施机制的通知',
      { fallbackIssuer: '宁夏回族自治区人民政府办公厅' },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://www.nx.gov.cn/zwgk/zfxxgk/fdzdgknr/ghxx/sswgh/',
      '宁夏回族自治区“十四五”规划专栏',
      { fetchMode: 'catalog', fallbackIssuer: '宁夏回族自治区人民政府' },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://www.nx.gov.cn/zwgk/qzfwj/',
      '宁夏回族自治区人民政府政策文件',
      { fetchMode: 'catalog', fallbackIssuer: '宁夏回族自治区人民政府' },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://jst.nx.gov.cn/xwdt/',
      '宁夏回族自治区住房和城乡建设厅新闻动态/公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区住房和城乡建设厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://fzggw.nx.gov.cn/zxgk/',
      '宁夏回族自治区发展和改革委员会信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区发展和改革委员会',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://sthjt.nx.gov.cn/',
      '宁夏回族自治区生态环境厅门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区生态环境厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://jtyst.nx.gov.cn/',
      '宁夏回族自治区交通运输厅门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区交通运输厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://fzggw.nx.gov.cn/zxgk/#investment',
      '宁夏发改委 · 投资项目与政府投资管理公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区发展和改革委员会',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://jst.nx.gov.cn/xwdt/#standard',
      '宁夏住建厅 · 工程建设标准与规范性文件',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区住房和城乡建设厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://jst.nx.gov.cn/xwdt/#municipal',
      '宁夏住建厅 · 市政与住房保障相关公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区住房和城乡建设厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://sthjt.nx.gov.cn/#eia',
      '宁夏生态环境厅 · 环境影响评价相关公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区生态环境厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://www.nx.gov.cn/zwgk/qzfwj/#urban',
      '宁夏城镇建设与基础设施补短板相关政策',
      { fetchMode: 'catalog', fallbackIssuer: '宁夏回族自治区人民政府' },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://jst.nx.gov.cn/zwgk/zcwjk/gfxwj/',
      '宁夏住房和城乡建设厅 · 规范性文件',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区住房和城乡建设厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'standard',
      'https://jst.nx.gov.cn/zwgk/zcwjk/gcjsbz/',
      '宁夏住房和城乡建设厅 · 工程建设标准',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区住房和城乡建设厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://jst.nx.gov.cn/zwgk/zcwjk/gfxwj/202505/t20250526_4916658.html',
      '宁夏回族自治区工程建设地方标准设计管理办法（试行）',
      {
        fallbackIssuer: '宁夏回族自治区住房和城乡建设厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://jst.nx.gov.cn/zwgk/zcwjk/gfxwj/202511/t20251105_5075793.html',
      '宁夏房屋建筑和市政基础设施工程施工图设计文件审查管理实施细则等修订通知',
      {
        fallbackIssuer: '宁夏回族自治区住房和城乡建设厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://dnr.nx.gov.cn/',
      '宁夏自然资源厅 · 建设用地与规划用地公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区自然资源厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://jst.nx.gov.cn/zwgk/zcwjk/gzwj/',
      '宁夏住房和城乡建设厅 · 工作文件',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区住房和城乡建设厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://jst.nx.gov.cn/zwgk/zcwjk/gfxwj/202310/t20231012_4306180.html',
      '宁夏住建厅涉及市场主体经济活动规范性文件和政策性文件目录',
      {
        fallbackIssuer: '宁夏回族自治区住房和城乡建设厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://jst.nx.gov.cn/zwgk/zcwjk/gfxwj/#fire-acceptance',
      '宁夏住建厅 · 建设工程消防与施工许可相关文件',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区住房和城乡建设厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://nxyjglt.nx.gov.cn/',
      '宁夏应急管理厅 · 建筑施工与消防安全相关公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区应急管理厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'standard',
      'https://scjg.nx.gov.cn/',
      '宁夏市场监督管理厅 · 地方标准与工程建设相关公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区市场监督管理厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://czt.nx.gov.cn/',
      '宁夏财政厅 · 门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区财政厅',
      },
    ),
    doc(
      'ningxia',
      'pack_finance_eval',
      'policy',
      'https://czt.nx.gov.cn/#special-bond',
      '宁夏财政厅 · 政府债券与政府投资管理公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区财政厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://slt.nx.gov.cn/',
      '宁夏水利厅 · 门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区水利厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://slt.nx.gov.cn/#water-project',
      '宁夏水利厅 · 水利工程建设与管理公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区水利厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://jyt.nx.gov.cn/',
      '宁夏教育厅 · 门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区教育厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://jyt.nx.gov.cn/#campus',
      '宁夏教育厅 · 校园建设与教育基建相关公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区教育厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://whhlyt.nx.gov.cn/',
      '宁夏文化和旅游厅 · 门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区文化和旅游厅',
      },
    ),
    doc(
      'ningxia',
      'pack_region_ningxia',
      'policy',
      'https://nynct.nx.gov.cn/',
      '宁夏农业农村厅 · 门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '宁夏回族自治区农业农村厅',
      },
    ),
  ],
  xinjiang: [
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://www.xinjiang.gov.cn/xinjiang/c100012/zfxxgk.shtml',
      '新疆维吾尔自治区国民经济和社会发展第十四个五年规划和二〇三五年远景目标纲要',
      { fetchMode: 'catalog', fallbackIssuer: '新疆维吾尔自治区人民政府' },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://www.xinjiang.gov.cn/xinjiang/c100025/list.shtml',
      '新疆维吾尔自治区人民政府政策文件专栏',
      { fetchMode: 'catalog', fallbackIssuer: '新疆维吾尔自治区人民政府' },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://www.xinjiang.gov.cn/xinjiang/c100002/list.shtml',
      '新疆维吾尔自治区人民政府信息公开目录',
      { fetchMode: 'catalog', fallbackIssuer: '新疆维吾尔自治区人民政府' },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://xjdrc.xinjiang.gov.cn/',
      '新疆维吾尔自治区发展和改革委员会门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区发展和改革委员会',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zjt.xinjiang.gov.cn/xjzjt/c113279/zwgk_list.shtml',
      '新疆维吾尔自治区住房和城乡建设厅政府信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zjt.xinjiang.gov.cn/xjzjt/c113305/zwgk_list.shtml',
      '新疆维吾尔自治区住房和城乡建设厅行政许可公示',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://sthjt.xinjiang.gov.cn/',
      '新疆维吾尔自治区生态环境厅门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区生态环境厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://jtyst.xinjiang.gov.cn/',
      '新疆维吾尔自治区交通运输厅门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区交通运输厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://xjdrc.xinjiang.gov.cn/#investment',
      '新疆发改委 · 投资管理与重大项目公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区发展和改革委员会',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zjt.xinjiang.gov.cn/xjzjt/c113279/zwgk_list.shtml#standard',
      '新疆住建厅 · 工程建设标准与规范性文件',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zjt.xinjiang.gov.cn/xjzjt/c113279/zwgk_list.shtml#municipal',
      '新疆住建厅 · 市政公用与城镇建设公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://sthjt.xinjiang.gov.cn/#eia',
      '新疆生态环境厅 · 环境影响评价相关公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区生态环境厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://www.xinjiang.gov.cn/xinjiang/c100025/list.shtml#urban',
      '新疆城镇建设与基础设施相关政策公开',
      { fetchMode: 'catalog', fallbackIssuer: '新疆维吾尔自治区人民政府' },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zjt.xinjiang.gov.cn/xjzjt/c113382/202510/c46aa6a26e5e4318887be2b5a332ee10.shtml',
      '关于申报2026年度自治区工程建设标准制修订项目计划的通知',
      {
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zjt.xinjiang.gov.cn/xjzjt/c113175/202410/3baafacf3360478eb675dd87145137ab.shtml',
      '关于开展自治区工程建设标准复审工作的通知',
      {
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'standard',
      'https://zjt.xinjiang.gov.cn/xjzjt/c113279/zwgk_list.shtml#local-standard',
      '新疆住建厅 · 工程建设地方标准与标准设计公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zjt.xinjiang.gov.cn/xjzjt/c113279/zwgk_list.shtml#drawing-review',
      '新疆住建厅 · 施工图审查与勘察设计管理公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zrzyt.xinjiang.gov.cn/',
      '新疆自然资源厅 · 建设用地与规划用地公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区自然资源厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zjt.xinjiang.gov.cn/xjzjt/c113442/zwgk_list.shtml',
      '新疆住建厅 · 规划信息（住建领域十四五规划等）',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zjt.xinjiang.gov.cn/xjzjt/c113442/zwgk_list.shtml#housing-14fyp',
      '新疆维吾尔自治区住房和城乡建设事业高质量发展“十四五”规划',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zjt.xinjiang.gov.cn/xjzjt/c113442/zwgk_list.shtml#seismic-14fyp',
      '新疆维吾尔自治区住房和城乡建设系统抗震防灾“十四五”规划',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zjt.xinjiang.gov.cn/xjzjt/c113442/zwgk_list.shtml#municipal-14fyp',
      '新疆维吾尔自治区城镇市政基础设施建设“十四五”规划',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://zjt.xinjiang.gov.cn/#cost-manage',
      '新疆维吾尔自治区建设工程造价管理办法（相关公开）',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区住房和城乡建设厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://yjgl.xinjiang.gov.cn/',
      '新疆应急管理厅 · 建筑施工与消防安全相关公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区应急管理厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'standard',
      'https://scjg.xinjiang.gov.cn/',
      '新疆市场监督管理局 · 地方标准与工程建设相关公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区市场监督管理局',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://czt.xinjiang.gov.cn/',
      '新疆财政厅 · 门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区财政厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_finance_eval',
      'policy',
      'https://czt.xinjiang.gov.cn/#special-bond',
      '新疆财政厅 · 政府投资与专项债券管理公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区财政厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://slt.xinjiang.gov.cn/',
      '新疆水利厅 · 门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区水利厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://slt.xinjiang.gov.cn/#water-project',
      '新疆水利厅 · 水利工程建设与管理公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区水利厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://jyt.xinjiang.gov.cn/',
      '新疆教育厅 · 门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区教育厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://jyt.xinjiang.gov.cn/#campus',
      '新疆教育厅 · 校园建设与教育基建相关公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区教育厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://wlt.xinjiang.gov.cn/',
      '新疆文化和旅游厅 · 门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区文化和旅游厅',
      },
    ),
    doc(
      'xinjiang',
      'pack_region_xinjiang',
      'policy',
      'https://nynct.xinjiang.gov.cn/',
      '新疆农业农村厅 · 门户信息公开',
      {
        fetchMode: 'catalog',
        fallbackIssuer: '新疆维吾尔自治区农业农村厅',
      },
    ),
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
  if (hostname.endsWith('mot.gov.cn')) {
    return 'mot';
  }
  if (hostname.endsWith('mwr.gov.cn')) {
    return 'mwr';
  }
  if (hostname.endsWith('mee.gov.cn')) {
    return 'mee';
  }
  if (hostname.endsWith('mof.gov.cn')) {
    return 'mof';
  }
  if (hostname.endsWith('mem.gov.cn')) {
    return 'mem';
  }
  if (hostname.endsWith('mnr.gov.cn')) {
    return 'mnr';
  }
  if (hostname.endsWith('gov.cn') && hostname.includes('henan')) {
    return 'henan';
  }
  if (hostname.endsWith('shaanxi.gov.cn')) {
    return 'shaanxi';
  }
  if (hostname.endsWith('gansu.gov.cn')) {
    return 'gansu';
  }
  if (hostname.endsWith('qinghai.gov.cn')) {
    return 'qinghai';
  }
  if (hostname.endsWith('nx.gov.cn') || hostname.endsWith('ningxia.gov.cn')) {
    return 'ningxia';
  }
  if (hostname.endsWith('xinjiang.gov.cn')) {
    return 'xinjiang';
  }
  if (hostname.endsWith('forestry.gov.cn')) {
    return 'forestry';
  }
  if (hostname.endsWith('mohurd.gov.cn')) {
    return 'mohurd';
  }
  if (hostname === 'www.gov.cn') {
    return 'gov_cn';
  }
  return null;
}

export function resolveSiteFromUrl(urlString: string): BasisSourceSiteId | null {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
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
    case 'shaanxi':
      return 'pack_region_shaanxi';
    case 'gansu':
      return 'pack_region_gansu';
    case 'qinghai':
      return 'pack_region_qinghai';
    case 'ningxia':
      return 'pack_region_ningxia';
    case 'xinjiang':
      return 'pack_region_xinjiang';
    case 'forestry':
      return 'pack_industry_forestry_fire';
    case 'mohurd':
    case 'openstd':
    case 'mem':
      return 'pack_eng_building';
    case 'mot':
      return 'pack_eng_transport';
    case 'mee':
      return 'pack_eng_environment';
    case 'mof':
      return 'pack_finance_eval';
    case 'mnr':
    case 'mwr':
    case 'ndrc':
    case 'gov_cn':
    default:
      return 'pack_common_gov';
  }
}

export function suggestGroupForUrl(
  urlString: string,
  siteId: BasisSourceSiteId,
): BasisGroup {
  if (
    siteId === 'openstd' ||
    siteId === 'mohurd' ||
    siteId === 'mot' ||
    siteId === 'mee'
  ) {
    return 'standard';
  }
  if (/标准|规范|规程|大纲|导则/.test(urlString)) {
    return 'standard';
  }
  return 'policy';
}

export function isDetailSourceUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
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

export function isListSourceUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return false;
    }
    const siteId = resolveSiteFromUrl(urlString);
    const hostAllowed = (BASIS_SYNC_ALLOWED_HOSTS as readonly string[]).includes(
      url.hostname,
    );
    if (!siteId && !hostAllowed) {
      return false;
    }
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (path === '/') {
      // 厅局子域门户根路径可作栏目；部委/省政府首页禁止整站爬
      const mainHosts = new Set(
        Object.values(BASIS_SOURCE_SITES).map(site => site.host),
      );
      return hostAllowed && !mainHosts.has(url.hostname);
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
  title: string;
};

function listSrc(
  siteId: BasisSourceSiteId,
  packId: string,
  group: BasisGroup,
  title: string,
  listUrl: string,
): BasisAutoListSource {
  return { siteId, packId, group, title, listUrl };
}

/**
 * 栏目列表源：部委约 8 站 + 陕甘青宁新（省政府/发改/住建/生态/交通）≈ 30+ 站/栏目，
 * 供 basis:sync 发现详情页入库。不做全网爬，只维护白名单栏目。
 */
export const BASIS_AUTO_LIST_SOURCES: BasisAutoListSource[] = [
  // —— 部委（约 8 站）——
  listSrc(
    'ndrc',
    'pack_common_gov',
    'policy',
    '国家发展改革委 · 规划司文件',
    'https://www.ndrc.gov.cn/xxgk/zcfb/ghxwj/',
  ),
  listSrc(
    'ndrc',
    'pack_common_gov',
    'policy',
    '国家发展改革委 · 通知公告',
    'https://www.ndrc.gov.cn/xxgk/zcfb/tz/',
  ),
  listSrc(
    'gov_cn',
    'pack_common_gov',
    'policy',
    '中国政府网 · 最新政策',
    'https://www.gov.cn/zhengce/zuixin/',
  ),
  listSrc(
    'mohurd',
    'pack_eng_building',
    'standard',
    '住建部 · 公开文件',
    'https://www.mohurd.gov.cn/gongkai/fdzdgknr/zfhcxjsbwj/index.html',
  ),
  listSrc(
    'mohurd',
    'pack_eng_building',
    'policy',
    '住建部 · 通知公告',
    'https://www.mohurd.gov.cn/gongkai/fdzdgknr/tzgg/index.html',
  ),
  listSrc(
    'mohurd',
    'pack_eng_building',
    'standard',
    '住建部 · 标准公告/强制性工程建设规范',
    'https://www.mohurd.gov.cn/ztbd/zyglgd/zyglgdbz/index.html',
  ),
  listSrc(
    'openstd',
    'pack_eng_building',
    'standard',
    '国家标准公开系统 · 工程建设标准检索入口',
    'https://openstd.samr.gov.cn/bzgk/gb/std_list?p.p1=7',
  ),
  listSrc(
    'mem',
    'pack_eng_building',
    'policy',
    '应急管理部 · 法定主动公开（消防/应急）',
    'https://www.mem.gov.cn/gk/zfxxgkpt/fdzdgknr/',
  ),
  listSrc(
    'mnr',
    'pack_eng_building',
    'policy',
    '自然资源部 · 政府信息公开（用地/规划）',
    'https://www.mnr.gov.cn/gk/',
  ),
  listSrc(
    'mot',
    'pack_eng_transport',
    'policy',
    '交通运输部 · 政策',
    'https://www.mot.gov.cn/zhengce/',
  ),
  listSrc(
    'mot',
    'pack_eng_transport',
    'standard',
    '交通运输部 · 公路局信息公开',
    'https://xxgk.mot.gov.cn/jigou/glj/',
  ),
  listSrc(
    'mwr',
    'pack_common_gov',
    'policy',
    '水利部 · 政策法规',
    'https://www.mwr.gov.cn/zw/zcfg/',
  ),
  listSrc(
    'mee',
    'pack_eng_environment',
    'standard',
    '生态环境部 · 环评技术导则',
    'https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/other/pjjsdz/',
  ),
  listSrc(
    'mee',
    'pack_eng_environment',
    'policy',
    '生态环境部 · 法律法规',
    'https://www.mee.gov.cn/ywgz/fgbz/fl/',
  ),
  listSrc(
    'mof',
    'pack_finance_eval',
    'policy',
    '财政部 · 政策发布',
    'https://www.mof.gov.cn/zhengwuxinxi/zhengcefabu/',
  ),
  listSrc(
    'forestry',
    'pack_industry_forestry_fire',
    'policy',
    '国家林草局 · 公开目录',
    'https://www.forestry.gov.cn/c/www/gkml.jhtml',
  ),

  // —— 陕西：省政府 + 发改 + 住建 + 生态 + 交通 ——
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省人民政府 · 十四五国民经济规划',
    'https://www.shaanxi.gov.cn/zfxxgk/fdzdgknr/ghxx/ssiwgh/gmjjhshfzgh_2438/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省人民政府 · 政策文件',
    'https://www.shaanxi.gov.cn/zfxxgk/fdzdgknr/zcwj/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省发改委 · 省发改委文件',
    'https://sndrc.shaanxi.gov.cn/zfxxgk/zc/fgwj/sfzggwwj/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省发改委 · 行政规范性文件',
    'https://sndrc.shaanxi.gov.cn/zfxxgk/zc/fgwj/xzgfxwj/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省住建厅 · 法定主动公开内容',
    'https://js.shaanxi.gov.cn/zfxxgk/fdzdgknr/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省住建厅 · 省厅文件（建筑政策）',
    'https://js.shaanxi.gov.cn/sy/zcwj/stwj/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省自然资源厅 · 建设用地审批结果',
    'https://zrzyt.shaanxi.gov.cn/zfxxgk/fdzdnrgk/ldcy/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省应急管理厅 · 火灾防治管理',
    'https://yjt.shaanxi.gov.cn/gk/zcwj/ztfl/hzfz/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'standard',
    '陕西省市场监督管理局 · 地方标准公开',
    'https://snamr.shaanxi.gov.cn/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省生态环境厅 · 政府信息公开',
    'https://sthjt.shaanxi.gov.cn/zfxxgk/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省交通运输厅 · 政府信息公开',
    'https://jtt.shaanxi.gov.cn/zfxxgk/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省财政厅 · 门户信息公开',
    'https://czt.shaanxi.gov.cn/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省水利厅 · 门户信息公开',
    'https://slt.shaanxi.gov.cn/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省教育厅 · 门户信息公开',
    'https://jyt.shaanxi.gov.cn/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省文化和旅游厅 · 门户信息公开',
    'https://whhlyt.shaanxi.gov.cn/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省农业农村厅 · 门户信息公开',
    'https://nynct.shaanxi.gov.cn/',
  ),
  listSrc(
    'shaanxi',
    'pack_region_shaanxi',
    'policy',
    '陕西省林业局 · 门户信息公开',
    'https://lyj.shaanxi.gov.cn/',
  ),

  // —— 甘肃 ——
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省人民政府 · 政府信息公开',
    'https://www.gansu.gov.cn/gsszf/c100002/zfxxgk.shtml',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省人民政府 · 政策文件',
    'https://www.gansu.gov.cn/gsszf/c100054/zfxxgkzn.shtml',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省发改委 · 门户信息公开',
    'https://fzgg.gansu.gov.cn/',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省住建厅 · 门户信息公开',
    'https://zjt.gansu.gov.cn/',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省自然资源厅 · 门户信息公开',
    'https://zrzy.gansu.gov.cn/',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省应急管理厅 · 门户信息公开',
    'https://yjgl.gansu.gov.cn/',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'standard',
    '甘肃省市场监督管理局 · 地方标准公开',
    'https://scjg.gansu.gov.cn/',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省生态环境厅 · 门户信息公开',
    'https://sthjt.gansu.gov.cn/',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省交通运输厅 · 门户信息公开',
    'https://jtyst.gansu.gov.cn/',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省财政厅 · 门户信息公开',
    'https://czt.gansu.gov.cn/',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省水利厅 · 门户信息公开',
    'https://slt.gansu.gov.cn/',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省教育厅 · 门户信息公开',
    'https://jyt.gansu.gov.cn/',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省文化和旅游厅 · 门户信息公开',
    'https://wlt.gansu.gov.cn/',
  ),
  listSrc(
    'gansu',
    'pack_region_gansu',
    'policy',
    '甘肃省农业农村厅 · 门户信息公开',
    'https://nync.gansu.gov.cn/',
  ),

  // —— 青海 ——
  listSrc(
    'qinghai',
    'pack_region_qinghai',
    'policy',
    '青海省人民政府 · 政务公开',
    'https://www.qinghai.gov.cn/zwgk/',
  ),
  listSrc(
    'qinghai',
    'pack_region_qinghai',
    'policy',
    '青海省发改委 · 门户信息公开',
    'https://fgw.qinghai.gov.cn/',
  ),
  listSrc(
    'qinghai',
    'pack_region_qinghai',
    'policy',
    '青海省住建厅 · 门户信息公开',
    'https://zjt.qinghai.gov.cn/',
  ),
  listSrc(
    'qinghai',
    'pack_region_qinghai',
    'policy',
    '青海省自然资源厅 · 门户信息公开',
    'https://zrzyt.qinghai.gov.cn/',
  ),
  listSrc(
    'qinghai',
    'pack_region_qinghai',
    'policy',
    '青海省应急管理厅 · 门户信息公开',
    'https://yjt.qinghai.gov.cn/',
  ),
  listSrc(
    'qinghai',
    'pack_region_qinghai',
    'standard',
    '青海省市场监督管理局 · 地方标准公开',
    'https://scjgj.qinghai.gov.cn/',
  ),
  listSrc(
    'qinghai',
    'pack_region_qinghai',
    'policy',
    '青海省生态环境厅 · 门户信息公开',
    'https://sthjt.qinghai.gov.cn/',
  ),
  listSrc(
    'qinghai',
    'pack_region_qinghai',
    'policy',
    '青海省交通运输厅 · 门户信息公开',
    'https://jtyst.qinghai.gov.cn/',
  ),
  listSrc(
    'qinghai',
    'pack_region_qinghai',
    'policy',
    '青海省财政厅 · 门户信息公开',
    'https://czt.qinghai.gov.cn/',
  ),
  listSrc(
    'qinghai',
    'pack_region_qinghai',
    'policy',
    '青海省水利厅 · 门户信息公开',
    'https://slt.qinghai.gov.cn/',
  ),
  listSrc(
    'qinghai',
    'pack_region_qinghai',
    'policy',
    '青海省教育厅 · 门户信息公开',
    'https://jyt.qinghai.gov.cn/',
  ),
  listSrc(
    'qinghai',
    'pack_region_qinghai',
    'policy',
    '青海省文化和旅游厅 · 门户信息公开',
    'https://whhlyt.qinghai.gov.cn/',
  ),

  // —— 宁夏 ——
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'policy',
    '宁夏 · 十四五规划专栏',
    'https://www.nx.gov.cn/zwgk/zfxxgk/fdzdgknr/ghxx/sswgh/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'policy',
    '宁夏人民政府 · 政策文件',
    'https://www.nx.gov.cn/zwgk/qzfwj/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'policy',
    '宁夏发改委 · 信息公开',
    'https://fzggw.nx.gov.cn/zxgk/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'policy',
    '宁夏住建厅 · 规范性文件（建筑）',
    'https://jst.nx.gov.cn/zwgk/zcwjk/gfxwj/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'standard',
    '宁夏住建厅 · 工程建设标准',
    'https://jst.nx.gov.cn/zwgk/zcwjk/gcjsbz/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'policy',
    '宁夏自然资源厅 · 门户信息公开',
    'https://dnr.nx.gov.cn/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'policy',
    '宁夏应急管理厅 · 门户信息公开',
    'https://nxyjglt.nx.gov.cn/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'standard',
    '宁夏市场监督管理厅 · 地方标准公开',
    'https://scjg.nx.gov.cn/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'policy',
    '宁夏生态环境厅 · 门户信息公开',
    'https://sthjt.nx.gov.cn/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'policy',
    '宁夏交通运输厅 · 门户信息公开',
    'https://jtyst.nx.gov.cn/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'policy',
    '宁夏财政厅 · 门户信息公开',
    'https://czt.nx.gov.cn/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'policy',
    '宁夏水利厅 · 门户信息公开',
    'https://slt.nx.gov.cn/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'policy',
    '宁夏教育厅 · 门户信息公开',
    'https://jyt.nx.gov.cn/',
  ),
  listSrc(
    'ningxia',
    'pack_region_ningxia',
    'policy',
    '宁夏文化和旅游厅 · 门户信息公开',
    'https://whhlyt.nx.gov.cn/',
  ),

  // —— 新疆 ——
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆人民政府 · 政府信息公开',
    'https://www.xinjiang.gov.cn/xinjiang/c100012/zfxxgk.shtml',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆人民政府 · 政策文件',
    'https://www.xinjiang.gov.cn/xinjiang/c100025/list.shtml',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆发改委 · 门户信息公开',
    'https://xjdrc.xinjiang.gov.cn/',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆住建厅 · 政府信息公开',
    'https://zjt.xinjiang.gov.cn/xjzjt/c113279/zwgk_list.shtml',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆住建厅 · 规划信息（建筑/市政十四五）',
    'https://zjt.xinjiang.gov.cn/xjzjt/c113442/zwgk_list.shtml',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆自然资源厅 · 门户信息公开',
    'https://zrzyt.xinjiang.gov.cn/',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆应急管理厅 · 门户信息公开',
    'https://yjgl.xinjiang.gov.cn/',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'standard',
    '新疆市场监督管理局 · 地方标准公开',
    'https://scjg.xinjiang.gov.cn/',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆生态环境厅 · 门户信息公开',
    'https://sthjt.xinjiang.gov.cn/',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆交通运输厅 · 门户信息公开',
    'https://jtyst.xinjiang.gov.cn/',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆财政厅 · 门户信息公开',
    'https://czt.xinjiang.gov.cn/',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆水利厅 · 门户信息公开',
    'https://slt.xinjiang.gov.cn/',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆教育厅 · 门户信息公开',
    'https://jyt.xinjiang.gov.cn/',
  ),
  listSrc(
    'xinjiang',
    'pack_region_xinjiang',
    'policy',
    '新疆文化和旅游厅 · 门户信息公开',
    'https://wlt.xinjiang.gov.cn/',
  ),

  // —— 河南（对照样例）——
  listSrc(
    'henan',
    'pack_region_henan',
    'policy',
    '河南省人民政府 · 法规文件',
    'https://www.henan.gov.cn/zwgk/fgwj/',
  ),
];
