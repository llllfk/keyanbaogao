import { fail, ok } from '@/lib/api/response';
import {
  findUserByEmail,
  setSessionCookie,
  toSessionUser,
  verifyPassword,
} from '@/lib/auth/session';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('请输入有效邮箱'),
  password: z.string().min(1, '请输入密码'),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const input = loginSchema.parse(body);
    const user = await findUserByEmail(input.email);
    if (!user) {
      return fail('邮箱或密码错误', 401);
    }
    const matched = await verifyPassword(input.password, user.passwordHash);
    if (!matched) {
      return fail('邮箱或密码错误', 401);
    }
    await setSessionCookie(toSessionUser(user));
    return ok({
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败';
    return fail(message, 400);
  }
}
