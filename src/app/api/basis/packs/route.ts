import { z } from 'zod';

import { fail, ok } from '@/lib/api/response';
import { formatZodError } from '@/lib/api/zod-error';
import { getSessionUser } from '@/lib/auth/session';
import {
  createBasisPack,
  deleteBasisPack,
  listBasisPackSummaries,
  updateBasisPack,
} from '@/lib/project/basis-library';

const upsertSchema = z.object({
  name: z.string().trim().min(1, '请填写名称').max(100),
  description: z.string().trim().max(500).optional(),
  matchAlways: z.boolean().optional(),
  matchKeywords: z.string().trim().max(200).optional(),
});

const createSchema = upsertSchema.extend({
  id: z
    .string()
    .trim()
    .regex(/^pack_[a-z0-9_]+$/i, 'ID 需形如 pack_xxx')
    .max(64)
    .optional(),
});

/** GET 列出依据包；POST { action: create|update|delete } */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }
  try {
    const packs = await listBasisPackSummaries();
    return ok({ packs });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '加载失败', 400);
  }
}

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

    if (action === 'create') {
      const input = createSchema.parse(body);
      const pack = await createBasisPack(input);
      return ok({ pack });
    }

    if (action === 'update') {
      const packId = z
        .object({ packId: z.string().trim().min(1).max(64) })
        .parse(body).packId;
      const input = upsertSchema.parse(body);
      const pack = await updateBasisPack(packId, input);
      return ok({ pack });
    }

    if (action === 'delete') {
      const packId = z
        .object({ packId: z.string().trim().min(1).max(64) })
        .parse(body).packId;
      await deleteBasisPack(packId);
      return ok({ deleted: packId });
    }

    return fail('未知 action');
  } catch (error) {
    const zodMessage = formatZodError(error);
    return fail(
      zodMessage ?? (error instanceof Error ? error.message : '操作失败'),
      400,
    );
  }
}
