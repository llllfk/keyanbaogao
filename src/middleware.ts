import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 已下线注册入口
  if (
    pathname === '/register' ||
    pathname.startsWith('/register/') ||
    pathname.startsWith('/api/auth/register')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/health')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isLogin =
    pathname === '/login' || pathname.startsWith('/login/');

  if (!session && (pathname.startsWith('/projects') || pathname.startsWith('/settings') || pathname.startsWith('/basis') || pathname === '/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (
    !session &&
    (pathname.startsWith('/api/projects') ||
      pathname.startsWith('/api/settings') ||
      pathname.startsWith('/api/basis'))
  ) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  if (session && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/projects';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/projects/:path*',
    '/settings',
    '/settings/:path*',
    '/basis',
    '/basis/:path*',
    '/login',
    '/register',
    '/register/:path*',
    '/api/projects/:path*',
    '/api/settings',
    '/api/settings/:path*',
    '/api/basis/:path*',
    '/api/auth/register',
  ],
};
