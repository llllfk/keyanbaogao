import { z } from 'zod';

import { fail, ok } from '@/lib/api/response';
import { getSessionUser } from '@/lib/auth/session';
import { aiRecommendBasisSelection } from '@/lib/project/ai-recommend-basis';
import { buildRecommendedBasisItems } from '@/lib/project/match-basis';
import { basisItemSchema } from '@/lib/project/schema';
import { getProject } from '@/lib/project/store';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function scopeOf(user: { tenantId: string; id: string }) {
  return { tenantId: user.tenantId, userId: user.id };
}

const bodySchema = z
  .object({
    /** 前端当前列表；不传则服务端按规则重新召回 */
    items: z.array(basisItemSchema).optional(),
  })
  .optional();

/** DeepSeek 勾选可能较久 */
export const maxDuration = 120;

export async function POST(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }

  const { id } = await context.params;
  const project = await getProject(scopeOf(user), id);
  if (!project) {
    return fail('项目不存在', 404);
  }

  try {
    const raw: unknown = await request.json().catch(() => ({}));
    const body = bodySchema.parse(raw);
    const candidates =
      body?.items && body.items.length > 0
        ? body.items
        : await buildRecommendedBasisItems(
            project.basicInfo,
            project.basisItems,
          );

    const result = await aiRecommendBasisSelection({
      userId: user.id,
      basic: project.basicInfo,
      candidates,
    });

    return ok({
      selectedIds: result.selectedIds,
      reason: result.reason,
      candidateCount: candidates.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'AI 勾选失败，请稍后重试';
    return fail(message, 400);
  }
}
