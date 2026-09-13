import { z } from 'zod';

import { fail, ok } from '@/lib/api/response';
import { formatZodError, httpsUrlSchema } from '@/lib/api/zod-error';
import { getSessionUser } from '@/lib/auth/session';
import {
  addBasisListSource,
  deleteBasisListSource,
  importBasisFromUrl,
  listDisabledListSourcesForUi,
  listListSourcesForUi,
  previewBasisImport,
  previewBasisListSource,
  restoreBasisListSource,
  runBasisLibrarySync,
} from '@/lib/project/basis-import';
import {
  deleteBasisPackItem,
  deleteBasisPackItems,
  listBasisPackSummaries,
} from '@/lib/project/basis-library';

const previewSchema = z.object({
  sourceUrl: httpsUrlSchema('原文链接'),
});

const importSchema = z.object({
  sourceUrl: httpsUrlSchema('原文链接'),
  packId: z.string().trim().min(1, '请选择依据包').max(64),
  group: z.enum(['policy', 'standard', 'project']),
  title: z.string().trim().min(1, '请填写标题').max(300),
  docCode: z.string().trim().max(100).optional(),
  issuer: z.string().trim().max(100).optional(),
  fetchMode: z.enum(['document', 'catalog']).optional(),
});

const addListSchema = z.object({
  listUrl: httpsUrlSchema('栏目列表页链接'),
  packId: z.string().trim().min(1).max(64).optional(),
  group: z.enum(['policy', 'standard', 'project']).optional(),
  title: z.string().trim().max(200).optional(),
});

const previewListSchema = z.object({
  listUrl: httpsUrlSchema('栏目列表页链接'),
});

/** POST { action: 'preview' | 'import' | 'addList' | 'previewList' | 'deleteList' | 'deleteItem' | 'runSync' | 'listSources', ... } */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }

  try {
    const body: unknown = await request.json();
    if (typeof body !== 'object' || body === null || !('action' in body)) {
      return fail('缺少 action');
    }

    const action = (body as { action: unknown }).action;
    if (action === 'preview') {
      const input = previewSchema.parse(body);
      const preview = await previewBasisImport(input.sourceUrl);
      return ok({ preview });
    }

    if (action === 'import') {
      const input = importSchema.parse(body);
      const result = await importBasisFromUrl(input);
      return ok({ item: result });
    }

    if (action === 'previewList') {
      const input = previewListSchema.parse(body);
      const preview = await previewBasisListSource(input.listUrl);
      return ok({ preview });
    }

    if (action === 'addList') {
      const input = addListSchema.parse(body);
      const result = await addBasisListSource(input);
      return ok({ listSource: result });
    }

    if (action === 'deleteList') {
      const listUrl = z
        .object({ listUrl: httpsUrlSchema('栏目列表页链接') })
        .parse(body).listUrl;
      const result = await deleteBasisListSource(listUrl);
      return ok({ deleted: result });
    }

    if (action === 'restoreList') {
      const listUrl = z
        .object({ listUrl: httpsUrlSchema('栏目列表页链接') })
        .parse(body).listUrl;
      const result = await restoreBasisListSource(listUrl);
      return ok({ restored: result });
    }

    if (action === 'deleteItem') {
      const itemId = z
        .object({ itemId: z.string().uuid('条目 ID 无效') })
        .parse(body).itemId;
      await deleteBasisPackItem(itemId);
      return ok({ deleted: itemId });
    }

    if (action === 'deleteItems') {
      const itemIds = z
        .object({
          itemIds: z
            .array(z.string().uuid('条目 ID 无效'))
            .min(1, '请选择要删除的条目')
            .max(200),
        })
        .parse(body).itemIds;
      const deleted = await deleteBasisPackItems(itemIds);
      return ok({ deleted });
    }

    if (action === 'listSources') {
      const [sources, disabledSources, packRows] = await Promise.all([
        listListSourcesForUi(),
        listDisabledListSourcesForUi(),
        listBasisPackSummaries(),
      ]);
      return ok({
        sources,
        disabledSources,
        packs: packRows.map(pack => ({
          id: pack.id,
          name: pack.name,
        })),
      });
    }

    if (action === 'runSync') {
      const listUrl =
        typeof body === 'object' &&
        body !== null &&
        'listUrl' in body &&
        typeof (body as { listUrl: unknown }).listUrl === 'string'
          ? (body as { listUrl: string }).listUrl.trim()
          : undefined;
      const result = await runBasisLibrarySync(
        listUrl ? { listUrl } : undefined,
      );
      return ok({ sync: result });
    }

    return fail('未知 action');
  } catch (error) {
    const zodMessage = formatZodError(error);
    const message =
      zodMessage ??
      (error instanceof Error ? error.message : '操作失败');
    return fail(message, 400);
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }
  try {
    const [sources, disabledSources, packRows] = await Promise.all([
      listListSourcesForUi(),
      listDisabledListSourcesForUi(),
      listBasisPackSummaries(),
    ]);
    return ok({
      sources,
      disabledSources,
      packs: packRows.map(pack => ({
        id: pack.id,
        name: pack.name,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '加载失败';
    return fail(message, 400);
  }
}
