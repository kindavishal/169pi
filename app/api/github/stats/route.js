import { NextResponse } from 'next/server';
import { verify, sessionCookieName } from '../../../../lib/session';

export const runtime = 'nodejs';
export const revalidate = 60;

const CACHE_TTL_MS = 60 * 1000;
let cache = { at: 0, data: null };

function sessionToken(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const raw = cookieHeader
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${sessionCookieName()}=`));
  if (!raw) return null;
  const s = verify(raw.slice(sessionCookieName().length + 1));
  return s ? s.t : null;
}

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(iso).toLocaleDateString();
}

async function gh(path, token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'preptember-app',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`https://api.github.com${path}`, { headers, cache: 'no-store' });
}

export async function GET(req) {
  const token = process.env.GITHUB_TOKEN || sessionToken(req) || null;

  if (cache.data && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache.data, cached: true });
  }

  const owner = process.env.GITHUB_OWNER || '169Pi';
  const repo = process.env.GITHUB_REPO || 'Alpie-Core';

  const [repoRes, prsRes, contribRes] = await Promise.all([
    gh(`/repos/${owner}/${repo}`, token),
    gh(`/repos/${owner}/${repo}/pulls?state=all&per_page=8&sort=created&direction=desc`, token),
    gh(`/repos/${owner}/${repo}/contributors?per_page=100&anon=1`, token),
  ]);

  const errors = [];
  let stars = null;
  let forks = null;
  if (repoRes.ok) {
    const j = await repoRes.json();
    stars = j.stargazers_count ?? 0;
    forks = j.forks_count ?? 0;
  } else {
    errors.push({ endpoint: 'repo', status: repoRes.status });
  }

  let prsCount = null;
  let recentPRs = [];
  if (prsRes.ok) {
    const j = await prsRes.json();
    prsCount = j.length;
    recentPRs = j.slice(0, 4).map((p) => ({
      user: p.user?.login || 'unknown',
      avatar: p.user?.avatar_url || null,
      when: relTime(p.created_at),
      href: p.html_url,
    }));
  } else {
    errors.push({ endpoint: 'pulls', status: prsRes.status });
  }

  let contributorsCount = null;
  let contributors = [];
  if (contribRes.ok) {
    const j = await contribRes.json();
    if (Array.isArray(j)) {
      contributorsCount = j.length;
      contributors = j
        .filter((c) => c && c.login)
        .map((c) => ({
          login: c.login,
          avatar: c.avatar_url || null,
          contributions: c.contributions || 0,
          href: c.html_url || `https://github.com/${c.login}`,
        }))
        .sort((a, b) => b.contributions - a.contributions);
    } else {
      contributorsCount = 0;
    }
  } else {
    errors.push({ endpoint: 'contributors', status: contribRes.status });
  }

  const data = {
    owner, repo,
    stars, forks, prsCount, contributorsCount, contributors, recentPRs,
    fetchedAt: new Date().toISOString(),
    errors: errors.length ? errors : undefined,
  };

  if (stars !== null || prsCount !== null || contributorsCount !== null) {
    cache = { at: Date.now(), data };
  }

  return NextResponse.json({ ...data, cached: false });
}
