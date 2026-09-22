import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function GET(req) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'GitHub OAuth is not configured (GITHUB_CLIENT_ID / GITHUB_REDIRECT_URI missing).' },
      { status: 500 }
    );
  }
  const state = crypto.randomBytes(16).toString('base64url');
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'public_repo read:user');
  url.searchParams.set('state', state);

  const res = NextResponse.redirect(url.toString());
  res.headers.append(
    'Set-Cookie',
    `preptember_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`
  );
  return res;
}
