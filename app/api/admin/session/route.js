import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, createAdminSessionValue, isAdmin, jsonError, rateLimit, safeEqual, sameOrigin } from '@/lib/server/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  return NextResponse.json({ authenticated: isAdmin(request) });
}

export async function POST(request) {
  try {
    if (!sameOrigin(request)) return jsonError('Cross-site request blocked.', 403);
    if (!(await rateLimit(request, 'admin-login', 8, 900))) return jsonError('Too many attempts. Try again in 15 minutes.', 429);
    const expected = process.env.ADMIN_ACCESS_CODE || '';
    if (expected.length < 12) return jsonError('ADMIN_ACCESS_CODE is not configured (12+ characters required).', 503);
    const { code } = await request.json().catch(() => ({}));
    if (!code || !safeEqual(String(code), expected)) return jsonError('Incorrect access code.', 401);

    const { value, maxAge } = createAdminSessionValue();
    const res = NextResponse.json({ authenticated: true });
    res.cookies.set(ADMIN_COOKIE, value, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge,
    });
    return res;
  } catch (error) {
    return jsonError(error?.message || 'Login failed.', 500);
  }
}

export async function DELETE() {
  const res = NextResponse.json({ authenticated: false });
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
