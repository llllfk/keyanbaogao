import { fail, ok } from '@/lib/api/response';
import { getSessionUser } from '@/lib/auth/session';
import { aiRecommendBasisSelection } from '@/lib/project/ai-recommend-basis';
import { buildCandidateBasisItems } from '@/lib/project/match-basis';
import { getProject } from '@/lib/project/store';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function scopeOf(user: { tenantId: string; id: string }) {
  return { tenantId: user.tenantId, userId: user.id };
}

/** 勾选可能较久 */
export const maxDuration = 180;

/**
 * 进入编制依据页：按来源/地点/行业召回候选，大模型勾选条目。
 * 不再选「文件分组」。
 */
export async function POST(_request: Request, context: RouteContext) {
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
    const candidates = await buildCandidateBasisItems(
      project.basicInfo,
      project.basisItems,
    );

    let items = candidates;
    let reason = '';
    try {
      const selection = await aiRecommendBasisSelection({
        userId: user.id,
        basic: project.basicInfo,
        candidates,
      });
      const idSet = new Set(selection.selectedIds);
      items = candidates.map(item => {
        if (item.group === 'project') {
          return item;
        }
        return { ...item, selected: idSet.has(item.id) };
      });
      reason = selection.reason;
    } catch (error) {
      reason =
        error instanceof Error
          ? `已召回候选，勾选回退手工：${error.message}`
          : '已召回候选，请手工勾选';
    }

    return ok({
      items,
      reason,
      selectedCount: items.filter(item => item.selected).length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'AI 识别依据失败，请稍后重试';
    return fail(message, 400);
  }
}
