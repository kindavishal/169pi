import { NextResponse } from 'next/server';
import { buildClearCookie } from '../../../../lib/session';

export const runtime = 'nodejs';

export async function POST(req) {
  const res = NextResponse.json({ ok: true });
  res.headers.append('Set-Cookie', buildClearCookie());
  return res;
}
