import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'ky_session';
export const SESSION_DAYS = 14;

export type SessionUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
};

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('缺少有效的 AUTH_SECRET');
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (typeof payload.sub !== 'string') {
      return null;
    }
    if (typeof payload.tenantId !== 'string') {
      return null;
    }
    return {
      id: payload.sub,
      tenantId: payload.tenantId,
      email: typeof payload.email === 'string' ? payload.email : '',
      name: typeof payload.name === 'string' ? payload.name : '',
    };
  } catch {
    return null;
  }
}
