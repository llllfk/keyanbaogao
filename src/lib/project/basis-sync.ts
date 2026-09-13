import {
  BASIS_AUTO_LIST_SOURCES,
  BASIS_AUTO_PACKS,
  BASIS_SOURCE_SITES,
  BASIS_SYNC_ALLOWED_HOSTS,
  getSourceSite,
  isDetailSourceUrl,
  resolveSiteIdByHost,
  type BasisAutoDocument,
  type BasisAutoListSource,
  type BasisSourceSiteId,
} from '@/lib/project/basis-auto-sources';
import type { BasisGroup, BasisPackItem } from '@/lib/project/basis-packs';

const DOC_CODE_RE =
  /[\u4e00-\u9fa5A-Za-z0-9]{2,24}〔\d{4}〕\d+号|国务院令第\d+号|(?:GB\/T|GB|CJJ\/T|CJJ|JGJ\/T|JGJ|DBJ?\d{0,2}\/?T?)[\s\-]?\d+(?:[\-\.]\d+)*/gi;

const USER_AGENT =
  'KeyanBaogaoBasisSync/1.0 (+metadata-only; allowlisted official list/detail pages)';

const MAX_LINKS_PER_LIST = 50;
const FETCH_GAP_MS = 250;

export type SyncedBasisItem = BasisPackItem & {
  sourceUrl: string;
  sourceSiteId: BasisSourceSiteId;
  sourceSite: string;
  syncStatus: 'fetched' | 'fallback';
};

function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') {
      return false;
    }
    if ((BASIS_SYNC_ALLOWED_HOSTS as readonly string[]).includes(url.hostname)) {
      return true;
    }
    return resolveSiteIdByHost(url.hostname) !== null;
  } catch {
    return false;
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html: string): string | undefined {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    const raw = stripTags(titleMatch[1]);
    const parts = raw
      .replace(/^【|】$/g, '')
      .split(/[-_|｜]/)
      .map(part => part.trim())
      .filter(part => part.length >= 4);
    const title = parts[0];
    if (title) {
      return title.slice(0, 300);
    }
  }
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match?.[1]) {
    const h1 = stripTags(h1Match[1]);
    if (h1.length >= 4) {
      return h1.slice(0, 300);
    }
  }
  return undefined;
}

function extractDocCode(text: string): string | undefined {
  const matches = text.match(DOC_CODE_RE);
  if (!matches || matches.length === 0) {
    return undefined;
  }
  return matches[0].replace(/\s+/g, '').slice(0, 100);
}

function extractIssuerHint(text: string): string | undefined {
  const patterns = [
    /发布机关[：:]\s*([^\s，。；;]{2,40})/,
    /发文机关[：:]\s*([^\s，。；;]{2,40})/,
    /(国务院|国家发展和改革委员会|国家发展改革委|住房和城乡建设部|河南省人民政府|国家林业和草原局)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].slice(0, 100);
    }
  }
  return undefined;
}

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    if (!response.ok) {
      return null;
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (
      contentType &&
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml') &&
      !contentType.includes('text/plain')
    ) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 抓取栏目列表页中文标题（失败返回 null） */
export async function resolveListPageTitle(
  listUrl: string,
): Promise<string | null> {
  if (!isAllowedUrl(listUrl)) {
    return null;
  }
  const html = await fetchHtml(listUrl);
  if (!html) {
    return null;
  }
  const title = extractTitle(html);
  return title ? title.slice(0, 200) : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function assertDocumentUrl(doc: BasisAutoDocument): void {
  if (!isAllowedUrl(doc.sourceUrl)) {
    throw new Error(`URL 不在白名单: ${doc.sourceUrl}`);
  }
  if (!isDetailSourceUrl(doc.sourceUrl)) {
    throw new Error(`必须使用原文详情链接，禁止门户首页: ${doc.sourceUrl}`);
  }
  const host = new URL(doc.sourceUrl).hostname;
  const site = getSourceSite(doc.siteId);
  if (host !== site.host && !host.endsWith(`.${site.host}`)) {
    const related =
      (doc.siteId === 'ndrc' && host.includes('ndrc.gov.cn')) ||
      (doc.siteId === 'openstd' && host.includes('samr.gov.cn'));
    if (!related && host !== site.host) {
      throw new Error(
        `URL 主机与来源站不匹配: ${doc.siteId} vs ${host}`,
      );
    }
  }
}

function fromFallback(
  doc: BasisAutoDocument,
  status: SyncedBasisItem['syncStatus'],
): SyncedBasisItem {
  const site = getSourceSite(doc.siteId);
  return {
    group: doc.group,
    title: doc.fallbackTitle,
    docCode: doc.fallbackDocCode,
    issuer: doc.fallbackIssuer,
    sourceUrl: doc.sourceUrl,
    sourceSiteId: doc.siteId,
    sourceSite: site.name,
    syncStatus: status,
  };
}

/**
 * 从白名单原文链接抽取元数据。
 * document：解析详情页；catalog：保留带标准号/栏目的原文链接 + 可核对元数据。
 */
export async function resolveAutoDocument(
  doc: BasisAutoDocument,
): Promise<SyncedBasisItem> {
  assertDocumentUrl(doc);

  if (doc.fetchMode === 'catalog') {
    return fromFallback(doc, 'fallback');
  }

  const html = await fetchHtml(doc.sourceUrl);
  if (html) {
    const text = stripTags(html);
    const title = extractTitle(html) ?? doc.fallbackTitle;
    const docCode = extractDocCode(text) ?? doc.fallbackDocCode;
    const issuer = extractIssuerHint(text) ?? doc.fallbackIssuer;
    const site = getSourceSite(doc.siteId);
    return {
      group: doc.group,
      title,
      docCode,
      issuer,
      sourceUrl: doc.sourceUrl,
      sourceSiteId: doc.siteId,
      sourceSite: site.name,
      syncStatus: 'fetched',
    };
  }

  return fromFallback(doc, 'fallback');
}

/** 页脚/导航等非政策文件标题 */
const JUNK_TITLE_RE =
  /^(国务院部门网站|地方政府网站|驻港澳机构网站|驻外机构|中国政府网简介|网站声明|隐私声明|版权声明|网站地图|首页|返回首页|返回顶部|登录|注册|搜索|更多|下一页|上一页|末页|打印|分享|收藏|关闭|无障碍|老龄模式|关怀版|English|RSS|APP下载|联系我们|关于我们|网站纠错)$/i;

const JUNK_PATH_RE =
  /\/(about|aboutus|map|sitemap|statement|declare|privacy|copyright|wza|login|register|search|help|contact|footer|header|nav|index)(\/|\.|$)/i;

function isJunkTitle(title: string): boolean {
  const t = title.replace(/\s+/g, '').trim();
  if (!t || t.length < 6) {
    return true;
  }
  if (JUNK_TITLE_RE.test(t)) {
    return true;
  }
  if (/^(网站|网页|栏目|频道|导航)/.test(t) && t.length < 12) {
    return true;
  }
  return false;
}

function sameSiteFamily(a: string, b: string): boolean {
  if (a === b) {
    return true;
  }
  const siteA = resolveSiteIdByHost(a);
  const siteB = resolveSiteIdByHost(b);
  return Boolean(siteA && siteB && siteA === siteB);
}

/**
 * 判断列表页上的链接是否像「文件详情页」。
 * 只认带内容 ID / 日期路径的文章链，排除栏目导航与页脚。
 */
export function isLikelyDetailUrl(
  href: string,
  listUrl: string,
  linkText?: string,
): boolean {
  try {
    const url = new URL(href);
    const list = new URL(listUrl);
    if (url.protocol !== 'https:') {
      return false;
    }
    if (!isAllowedUrl(url.href)) {
      return false;
    }
    if (!sameSiteFamily(url.hostname, list.hostname)) {
      return false;
    }
    if (!isDetailSourceUrl(url.href)) {
      return false;
    }
    const path = url.pathname;
    if (/\/index(\.s?html?)?$/i.test(path)) {
      return false;
    }
    if (JUNK_PATH_RE.test(path)) {
      return false;
    }
    if (/\.(pdf|doc|docx|xls|xlsx|zip|rar)(\?|$)/i.test(path)) {
      return false;
    }
    if (linkText && isJunkTitle(linkText)) {
      return false;
    }

    // 各站常见正文详情路径
    if (/content[_-]?\d+/i.test(path)) {
      return true;
    }
    if (/\/t\d{8}_/i.test(path)) {
      return true;
    }
    if (/\/gongbao\/content\//i.test(path)) {
      return true;
    }
    if (/\/zhengceku\//i.test(path) && /\.(s?html?)$/i.test(path)) {
      return true;
    }
    if (/\/\d{4}\/\d{2}-\d{2}\/\d+\.(s?html?)$/i.test(path)) {
      return true;
    }
    if (/\/\d{4}\/\d{2}\/\d{2}\//.test(path) && /\.(s?html?)$/i.test(path)) {
      return true;
    }
    // 发改委/林草等：目录下 tYYYYMMDD_xxx.html
    if (/\/[a-z0-9_-]+\/t\d{6,8}_.+\.(s?html?)$/i.test(path)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

type AnchorHit = { href: string; text: string };

function extractAnchors(html: string, baseUrl: string): AnchorHit[] {
  const hits: AnchorHit[] = [];
  const re =
    /<a\b([^>]*)\bhref\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null = re.exec(html);
  while (match) {
    const raw = (match[2] ?? '').trim();
    const inner = match[4] ?? '';
    match = re.exec(html);
    if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) {
      continue;
    }
    try {
      const abs = new URL(raw, baseUrl).href.split('#')[0] ?? '';
      const text = stripTags(inner).replace(/\s+/g, ' ').trim();
      hits.push({ href: abs, text });
    } catch {
      // ignore
    }
  }
  return hits;
}

export type ListDiscoveryResult = {
  listUrl: string;
  siteId: BasisSourceSiteId;
  packId: string;
  group: BasisGroup;
  documents: BasisAutoDocument[];
  error?: string;
};

/** 从单个栏目列表页发现详情链接（最多 MAX_LINKS_PER_LIST） */
export async function discoverDocumentsFromList(
  source: BasisAutoListSource,
): Promise<ListDiscoveryResult> {
  const html = await fetchHtml(source.listUrl);
  if (!html) {
    return {
      ...source,
      documents: [],
      error: '无法抓取栏目页',
    };
  }

  const anchors = extractAnchors(html, source.listUrl);
  const seen = new Set<string>();
  const documents: BasisAutoDocument[] = [];

  for (const anchor of anchors) {
    if (seen.has(anchor.href)) {
      continue;
    }
    if (!isLikelyDetailUrl(anchor.href, source.listUrl, anchor.text)) {
      continue;
    }
    seen.add(anchor.href);
    const fallbackTitle =
      anchor.text && !isJunkTitle(anchor.text)
        ? anchor.text.slice(0, 300)
        : '（栏目发现，待确认标题）';
    documents.push({
      siteId: source.siteId,
      packId: source.packId,
      group: source.group,
      sourceUrl: anchor.href,
      fetchMode: 'document',
      fallbackTitle,
      fallbackIssuer: getSourceSite(source.siteId).name,
    });
    if (documents.length >= MAX_LINKS_PER_LIST) {
      break;
    }
  }

  return { ...source, documents };
}

export type BasisSyncResult = {
  packs: typeof BASIS_AUTO_PACKS;
  sites: typeof BASIS_SOURCE_SITES;
  itemsByPack: Record<string, SyncedBasisItem[]>;
  itemsBySite: Record<BasisSourceSiteId, SyncedBasisItem[]>;
  fetched: number;
  fallback: number;
  discovered: number;
  listResults: Array<{
    listUrl: string;
    found: number;
    error?: string;
  }>;
  failed: Array<{
    siteId: BasisSourceSiteId;
    sourceUrl: string;
    title: string;
    error: string;
  }>;
};

function emptySyncBuckets(): {
  itemsByPack: Record<string, SyncedBasisItem[]>;
  itemsBySite: Record<BasisSourceSiteId, SyncedBasisItem[]>;
} {
  const itemsByPack: Record<string, SyncedBasisItem[]> = {};
  const itemsBySite = {} as Record<BasisSourceSiteId, SyncedBasisItem[]>;
  for (const pack of BASIS_AUTO_PACKS) {
    itemsByPack[pack.id] = [];
  }
  for (const siteId of Object.keys(BASIS_SOURCE_SITES) as BasisSourceSiteId[]) {
    itemsBySite[siteId] = [];
  }
  return { itemsByPack, itemsBySite };
}

/** 拉取白名单 + 栏目发现文档元数据（不写库） */
export async function collectBasisSyncPayload(options?: {
  /** 只同步指定栏目列表页 */
  listUrl?: string;
}): Promise<BasisSyncResult> {
  const { listAllAutoDocuments, listAllListSources } =
    await import('@/lib/project/basis-import');

  const listUrlFilter = options?.listUrl?.trim();
  const allLists = await listAllListSources();
  const listSources = listUrlFilter
    ? allLists.filter(item => item.listUrl === listUrlFilter)
    : allLists;

  if (listUrlFilter && listSources.length === 0) {
    throw new Error('未找到该栏目，请先添加后再同步');
  }

  const listResults: BasisSyncResult['listResults'] = [];
  const discoveredDocs: BasisAutoDocument[] = [];

  for (const listSource of listSources) {
    const discovered = await discoverDocumentsFromList(listSource);
    listResults.push({
      listUrl: discovered.listUrl,
      found: discovered.documents.length,
      error: discovered.error,
    });
    discoveredDocs.push(...discovered.documents);
    await sleep(FETCH_GAP_MS);
  }

  // 单栏目同步：只处理发现结果，不重跑全部固定详情白名单
  const documents: BasisAutoDocument[] = listUrlFilter
    ? []
    : await listAllAutoDocuments();
  const seenUrls = new Set(documents.map(doc => doc.sourceUrl));
  let discovered = 0;
  for (const doc of discoveredDocs) {
    if (seenUrls.has(doc.sourceUrl)) {
      continue;
    }
    seenUrls.add(doc.sourceUrl);
    documents.push(doc);
    discovered += 1;
  }

  const { itemsByPack, itemsBySite } = emptySyncBuckets();
  let fetched = 0;
  let fallback = 0;
  const failed: BasisSyncResult['failed'] = [];

  for (const doc of documents) {
    try {
      const item = await resolveAutoDocument(doc);
      if (isJunkTitle(item.title)) {
        continue;
      }
      if (!itemsByPack[doc.packId]) {
        itemsByPack[doc.packId] = [];
      }
      const exists = itemsByPack[doc.packId].some(
        row => row.sourceUrl === item.sourceUrl,
      );
      if (!exists) {
        itemsByPack[doc.packId].push(item);
        itemsBySite[doc.siteId].push(item);
      }
      if (item.syncStatus === 'fetched') {
        fetched += 1;
      } else {
        fallback += 1;
      }
    } catch (error) {
      failed.push({
        siteId: doc.siteId,
        sourceUrl: doc.sourceUrl,
        title: doc.fallbackTitle,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await sleep(FETCH_GAP_MS);
  }

  return {
    packs: BASIS_AUTO_PACKS,
    sites: BASIS_SOURCE_SITES,
    itemsByPack,
    itemsBySite,
    fetched,
    fallback,
    discovered,
    listResults,
    failed,
  };
}

export function toWritableItem(item: SyncedBasisItem): {
  group: BasisGroup;
  title: string;
  docCode: string;
  issuer: string;
  sourceUrl: string;
  sourceSite: string;
} {
  return {
    group: item.group,
    title: item.title,
    docCode: item.docCode ?? '',
    issuer: item.issuer ?? '',
    sourceUrl: item.sourceUrl,
    sourceSite: item.sourceSite,
  };
}

/** 预置栏目（无库时也可发现） */
export function getBuiltinListSources(): BasisAutoListSource[] {
  return [...BASIS_AUTO_LIST_SOURCES];
}
