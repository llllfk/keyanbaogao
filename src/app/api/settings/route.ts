import { z } from 'zod';

import { fail, ok } from '@/lib/api/response';
import { getSessionUser } from '@/lib/auth/session';
import {
  getLlmSettingsPublic,
  updateDeepseekApiKey,
} from '@/lib/settings/llm';

const updateSchema = z.object({
  deepseekApiKey: z.string().max(200).optional(),
  clearDeepseekApiKey: z.boolean().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }
  const settings = await getLlmSettingsPublic(user.id);
  return ok({ settings });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return fail('请先登录', 401);
  }

  try {
    const body: unknown = await request.json();
    const input = updateSchema.parse(body);
    const settings = await updateDeepseekApiKey(
      user.id,
      input.deepseekApiKey ?? '',
      { clear: input.clearDeepseekApiKey === true },
    );
    return ok({ settings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '保存设置失败';
    return fail(message, 400);
  }
}
