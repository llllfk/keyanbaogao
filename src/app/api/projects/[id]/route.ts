import { fail, ok } from '@/lib/api/response';
import { getSessionUser } from '@/lib/auth/session';
import { financeSaveSchema } from '@/lib/finance/schema';
import {
  basicInfoDraftSchema,
  basicInfoSchema,
  basisSaveSchema,
} from '@/lib/project/schema';
import {
  deleteProject,
  getProject,
  saveProjectBasis,
  saveProjectDraft,
  saveProjectFinance,
  setProjectFinancialAnalysis,
  updateProjectBasicInfo,
} from '@/lib/project/store';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function scopeOf(user: { tenantId: string; id: string }) {
  return { tenantId: user.tenantId, userId: user.id };
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }
  const { id } = await context.params;
  const project = await getProject(scopeOf(user), id);
  if (!project) {
    return fail('项目不存在', 404);
  }
  return ok({ project });
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }

  const { id } = await context.params;
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode');
  const scope = scopeOf(user);

  try {
    const body: unknown = await request.json();

    if (mode === 'draft') {
      const partial = basicInfoDraftSchema.parse(body);
      const project = await saveProjectDraft(scope, id, partial);
      if (!project) {
        return fail('项目不存在', 404);
      }
      return ok({ project });
    }

    if (mode === 'basis') {
      const payload = basisSaveSchema.parse(body);
      const project = await saveProjectBasis(
        scope,
        id,
        payload.items,
        payload.confirm === true,
      );
      if (!project) {
        return fail('项目不存在', 404);
      }
      return ok({ project });
    }

    if (mode === 'financeFlag') {
      const enabled =
        typeof body === 'object' &&
        body !== null &&
        'doFinancialAnalysis' in body &&
        (body as { doFinancialAnalysis: unknown }).doFinancialAnalysis === true;
      const project = await setProjectFinancialAnalysis(scope, id, enabled);
      if (!project) {
        return fail('项目不存在', 404);
      }
      return ok({
        project,
        doFinancialAnalysis: project.basicInfo.doFinancialAnalysis === true,
      });
    }

    if (mode === 'finance') {
      const payload = financeSaveSchema.parse(body);
      const project = await saveProjectFinance(scope, id, {
        input: payload.input,
        confirm: payload.confirm === true,
        skip: payload.skip === true,
      });
      if (!project) {
        return fail('项目不存在', 404);
      }
      return ok({ project });
    }

    const basicInfo = basicInfoSchema.parse(body);
    const project = await updateProjectBasicInfo(scope, id, basicInfo);
    if (!project) {
      return fail('项目不存在', 404);
    }
    return ok({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败';
    return fail(message, 400);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }
  const { id } = await context.params;
  const deleted = await deleteProject(scopeOf(user), id);
  if (!deleted) {
    return fail('项目不存在', 404);
  }
  return ok({ ok: true });
}
