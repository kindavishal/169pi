import { NextResponse } from 'next/server';
import { verify, sessionCookieName } from '../../../../lib/session';

export const runtime = 'nodejs';

function readSession(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const raw = cookieHeader
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${sessionCookieName()}=`));
  if (!raw) return null;
  const token = raw.slice(sessionCookieName().length + 1);
  return verify(token);
}

async function gh(path, token) {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'preptember-app',
    },
    cache: 'no-store',
  });
}

export async function GET(req) {
  const session = readSession(req);
  if (!session) return NextResponse.json({ authenticated: false });

  const owner = process.env.GITHUB_OWNER || '169Pi';
  const repo = process.env.GITHUB_REPO || 'Alpie-Core';
  const login = session.login;
  const token = session.t;

  const [starRes, forksRes, prsRes] = await Promise.all([
    gh(`/user/starred/${owner}/${repo}`, token),
    gh(`/repos/${owner}/${repo}/forks?per_page=100&sort=newest`, token),
    gh(`/repos/${owner}/${repo}/pulls?state=all&per_page=100&sort=created&direction=desc`, token),
  ]);

  const starred = starRes.status === 204;

  let forked = false;
  if (forksRes.ok) {
    const forks = await forksRes.json();
    forked = forks.some((f) => f.owner && f.owner.login === login);
  }

  let openPr = false;
  let mergedPr = false;
  if (prsRes.ok) {
    const prs = await prsRes.json();
    for (const pr of prs) {
      if (pr.user && pr.user.login === login) {
        if (pr.merged_at) mergedPr = true;
        else if (pr.state === 'open') openPr = true;
      }
    }
  }

  return NextResponse.json({
    authenticated: true,
    login,
    starred,
    forked,
    openPr,
    mergedPr,
  });
}
