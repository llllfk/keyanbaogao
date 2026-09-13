import { fail, ok } from '@/lib/api/response';
import { getSessionUser } from '@/lib/auth/session';
import { basicInfoSchema } from '@/lib/project/schema';
import { createProject, listProjects } from '@/lib/project/store';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }
  const projects = await listProjects({
    tenantId: user.tenantId,
    userId: user.id,
  });
  return ok({ projects });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }

  try {
    const body: unknown = await request.json().catch(() => ({}));
    const parsed =
      body && typeof body === 'object' && Object.keys(body).length > 0
        ? basicInfoSchema.partial().parse(body)
        : undefined;
    const project = await createProject(
      { tenantId: user.tenantId, userId: user.id },
      parsed,
    );
    return ok({ project }, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '创建项目失败';
    return fail(message, 400);
  }
}
