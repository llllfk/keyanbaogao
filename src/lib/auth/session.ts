import { compare, hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

import { getDb } from '@/lib/db';
import { tenants, users, type UserRow } from '@/lib/db/schema';
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  createSessionToken,
  verifySessionToken,
  type SessionUser,
} from '@/lib/auth/token';

export { SESSION_COOKIE, verifySessionToken, type SessionUser };

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    tenantId: row.tenantId,
    email: row.email,
    name: row.name,
  };
}

/** 项目读写作用域（多租户隔离） */
export function toProjectScope(user: SessionUser) {
  return { tenantId: user.tenantId, userId: user.id };
}

export async function findUserByEmail(
  email: string,
): Promise<UserRow | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return row;
}

/** 管理员开通账号：创建个人租户 + 用户（一期一用户一租户） */
export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<UserRow> {
  const db = getDb();
  const passwordHash = await hashPassword(input.password);
  const displayName =
    input.name.trim() || input.email.split('@')[0] || '用户';

  const result = await db.transaction(async tx => {
    const [tenant] = await tx
      .insert(tenants)
      .values({
        name: `${displayName}的工作区`,
        config: {},
      })
      .returning();
    if (!tenant) {
      throw new Error('创建租户失败');
    }

    const [user] = await tx
      .insert(users)
      .values({
        tenantId: tenant.id,
        email: input.email.toLowerCase(),
        name: displayName,
        passwordHash,
      })
      .returning();
    if (!user) {
      throw new Error('创建用户失败');
    }
    return user;
  });

  return result;
}
