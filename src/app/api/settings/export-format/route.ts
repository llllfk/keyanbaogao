import { fail, ok } from '@/lib/api/response';
import { getSessionUser } from '@/lib/auth/session';
import {
  getExportFormat,
  saveExportFormat,
} from '@/lib/settings/export-format';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }
  const format = await getExportFormat(user.tenantId);
  return ok({ format });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }

  try {
    const body: unknown = await request.json();
    const format = await saveExportFormat(user.tenantId, body);
    return ok({ format });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '保存格式失败';
    return fail(message, 400);
  }
}
