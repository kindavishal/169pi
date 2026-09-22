import { NextResponse } from 'next/server';
import { verify, sessionCookieName } from '../../../../lib/session';

export const runtime = 'nodejs';

export async function GET(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const raw = cookieHeader
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${sessionCookieName()}=`));
  if (!raw) return NextResponse.json({ user: null });
  const token = raw.slice(sessionCookieName().length + 1);
  const session = verify(token);
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: { login: session.login, name: session.name, avatar: session.avatar },
  });
}
