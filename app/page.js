'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePresence } from '../lib/usePresence';

const OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || '169Pi';
const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || 'Alpie-Core';
const PROFILE_OWNER = process.env.NEXT_PUBLIC_GITHUB_PROFILE_OWNER || '169Pi';
const PROFILE_REPO = process.env.NEXT_PUBLIC_GITHUB_PROFILE_REPO || '.github';
const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/QqkrMmvt4';
const NEXT_MERGE_DATE = 'October 6, 2026';
const STORAGE_KEY = 'preptember.progress.v3';

const STEPS = [
  { id: 'github', tag: '00', title: 'Create your free GitHub account', desc: 'brand new? start here', help: true, ctaText: 'Sign up free ↗', ctaHref: 'https://github.com/signup',
    guide: 'GitHub is the platform where developers host and share project files — think of it as Google Drive for code and content. It is free, and you need an account before anything else here. Signing up takes about a minute: enter an email, pick a password and a username, confirm the email, and you are in. Once you sign in above, this step checks itself off.',
    mock: 'signup' },
  { id: 'star', tag: '01', title: `Star ${REPO}`, desc: 'takes 2 seconds', ctaText: 'Star it ↗', ctaHref: `https://github.com/${OWNER}/${REPO}` },
  { id: 'discord', tag: '02', title: 'Join the Discord', desc: 'where you get help', ctaText: 'Join ↗', ctaHref: DISCORD_URL },
  { id: 'fork', tag: '03', title: `Fork ${PROFILE_OWNER}/${PROFILE_REPO}`, desc: 'make your own copy', help: true, ctaText: 'Open repo ↗', ctaHref: `https://github.com/${PROFILE_OWNER}/${PROFILE_REPO}`,
    guide: `A <term:fork>fork</term:fork> is your personal copy of the <term:repository>repo</term:repository>. You are forking ${PROFILE_OWNER}/${PROFILE_REPO} — the 169pi org profile — because that is where your entry gets published. On the repo page, click the Fork button (top-right), then Create fork. You will make your change in your copy, then offer it back — all in your browser.`,
    mock: 'fork' },
  { id: 'add', tag: '04', title: 'Add your entry to the profile README', desc: 'your creative bit', help: true,
    guide: 'In your fork, open profile/README.md — the one inside the profile/ folder, not the repo\'s top-level README.md — click the pencil (Edit) icon, scroll to the "Make this README yours" section, and paste your entry as its own block. Keep the surrounding structure intact. Not sure what to make? Open the Creation Studio for a 1-click SVG, use the drafter, or tap Ask Alpie in the bottom-right corner.',
    cmd: 'profile/README.md  →  ## 🎨 Make this README yours',
    webSteps: [
      'Click the pencil (Edit) icon on profile/README.md.',
      'Scroll to the "Make this README yours" heading.',
      'Paste your entry as a new block under it.',
      'Scroll down and click Commit changes.',
    ],
    mock: 'commit', drafter: true, studio: true },
  { id: 'pr', tag: '05', title: 'Open your pull request', desc: 'offer your change back', help: true, ctaText: 'Open a PR ↗', ctaHref: `https://github.com/${PROFILE_OWNER}/${PROFILE_REPO}/compare`,
    guide: 'A <term:pull request>pull request</term:pull request> asks 169pi to add your change to their repo. From your fork, click Contribute then Open pull request, and name it exactly like this:',
    cmd: '@your-github-handle: <what you’re calling it>',
    mock: 'pr',
    rules: [
      'One open PR per person at a time — put your best foot forward.',
      'Your entry must be original (your own work, or clearly attributed).',
      'It has to reflect something real about 169pi — a model, capability, or benchmark.',
      'Entries stay in the repo permanently; older ones may rotate out of the visible section but nothing gets deleted.',
    ] },
  { id: 'review', tag: '06', title: 'Wait for the review', desc: 'bi-weekly merges', help: true, ctaText: 'Discuss in Discord ↗', ctaHref: DISCORD_URL,
    guide: 'The team merges every two weeks — next merge is October 6, 2026. If they suggest a tweak, just commit again to the same branch and your PR updates itself.' },
  { id: 'merged', tag: '07', title: 'Merged → you did it', desc: 'first contribution done', help: true,
    guide: 'When it is merged, your entry is live on the 169pi org profile and 169pi ships you swag. You just made your first open-source contribution.' },
];

// Renders guide text that contains <term:key>label</term:key> markers as inline
// tooltip terms, leaving the rest as plain text.
function renderGuide(text) {
  const parts = String(text).split(/(<term:[^>]+>.*?<\/term:[^>]+>)/g);
  return parts.map((part, i) => {
    const m = part.match(/^<term:([^>]+)>(.*?)<\/term:[^>]+>$/);
    if (m) return <Term key={i} k={m[1]}>{m[2]}</Term>;
    return part ? <span key={i}>{part}</span> : null;
  });
}

function pad(n) { return (n < 10 ? '0' : '') + n; }

function useCountdown(target) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return { days: '—', clock: '--:--:--' };
  const ms = Math.max(0, new Date(target).getTime() - now);
  const day = 86400000;
  const days = Math.floor(ms / day);
  const hrs = Math.floor((ms % day) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return { days, clock: `${pad(hrs)}:${pad(mins)}:${pad(secs)}` };
}

function initialsColor(login) {
  const palette = ['#1B7A6E', '#C64B8C', '#E8A317', '#37555d', '#8b5cf6', '#0ea5e9'];
  let h = 0;
  for (let i = 0; i < login.length; i++) h = (h * 31 + login.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function relTime(iso) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// Plain-language definitions for the jargon-buster tooltips and the glossary.
const GLOSSARY = [
  { term: 'Repository', short: 'Repo', def: 'A digital project folder that holds all of a project’s code and content. 169Pi/.github is one.' },
  { term: 'Fork', def: 'Your own personal copy of 169Pi’s folder, so you can make changes without touching the original.' },
  { term: 'Pull Request', short: 'PR', def: 'A polite request to add your changes back to 169Pi so they show up on their main page. Nothing happens until they approve it.' },
  { term: 'Commit', def: 'Saving a change. Each commit is a snapshot of what you edited, with a short note describing it.' },
  { term: 'Branch', def: 'A separate line of work. Your edits live on their own branch until the PR is merged.' },
  { term: 'Merge', def: 'When 169Pi accepts your PR and your entry becomes part of their real page.' },
  { term: 'README', def: 'The welcome page of a repo (README.md). Yours goes in profile/README.md.' },
  { term: 'SVG', def: 'A lightweight image made of text/shapes instead of pixels — it stays crisp at any size and you can make one right here, no drawing app needed.' },
  { term: 'Markdown', def: 'A simple way to format text with plain symbols (# for a heading, ** for bold). GitHub turns it into a nice-looking page.' },
];
const GLOSSARY_MAP = Object.fromEntries(
  GLOSSARY.flatMap((g) => {
    const entries = [[g.term.toLowerCase(), g]];
    if (g.short) entries.push([g.short.toLowerCase(), g]);
    return entries;
  })
);

// Inline jargon term: dotted underline + accessible tooltip on hover/focus.
function Term({ children, k }) {
  const key = (k || (typeof children === 'string' ? children : '')).toLowerCase();
  const g = GLOSSARY_MAP[key];
  if (!g) return <>{children}</>;
  return (
    <span className="term" tabIndex={0} role="note" aria-label={`${g.term}: ${g.def}`}>
      {children}
      <span className="term-tip" role="tooltip">
        <strong>{g.term}{g.short ? ` (${g.short})` : ''}</strong>
        {g.def}
      </span>
    </span>
  );
}

// Stylized "screenshot" of the relevant GitHub screen, with the exact button a
// beginner needs to click highlighted by a pulsing ring. Pure inline SVG so it
// stays crisp and needs no image assets.
function GhMock({ kind }) {
  const frame = (addr, children) => (
    <svg className="ghmock" viewBox="0 0 320 172" role="img" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="319" height="171" rx="10" fill="#fff" stroke="#e4e0d6" />
      <rect x="0.5" y="0.5" width="319" height="30" rx="10" fill="#f3f1ea" />
      <rect x="0.5" y="20" width="319" height="11" fill="#f3f1ea" />
      <circle cx="16" cy="15" r="4" fill="#e06c5b" />
      <circle cx="30" cy="15" r="4" fill="#e8b84b" />
      <circle cx="44" cy="15" r="4" fill="#57b877" />
      <rect x="60" y="8" width="248" height="15" rx="7.5" fill="#fff" stroke="#e4e0d6" />
      <text x="70" y="19" fontSize="9" fill="#8a8578" fontFamily="ui-monospace, monospace">{addr}</text>
      {children}
    </svg>
  );
  const target = (x, y, w, h) => (
    <g>
      <rect className="mock-pulse" x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={(h + 6) / 2} fill="none" stroke="#1B7A6E" strokeWidth="2" />
    </g>
  );
  if (kind === 'signup') {
    return frame('github.com/signup', (
      <g>
        <text x="20" y="52" fontSize="11" fontWeight="700" fill="#171717">Create your account</text>
        <rect x="20" y="60" width="280" height="20" rx="5" fill="#fff" stroke="#d9d5cb" />
        <text x="27" y="73" fontSize="8" fill="#a8a396">Email</text>
        <rect x="20" y="86" width="280" height="20" rx="5" fill="#fff" stroke="#d9d5cb" />
        <text x="27" y="99" fontSize="8" fill="#a8a396">Password</text>
        <rect x="20" y="112" width="280" height="20" rx="5" fill="#fff" stroke="#d9d5cb" />
        <text x="27" y="125" fontSize="8" fill="#a8a396">Username</text>
        <rect x="20" y="142" width="280" height="22" rx="6" fill="#1f883d" />
        <text x="160" y="156" fontSize="9" fontWeight="700" fill="#fff" textAnchor="middle">Create account</text>
        {target(20, 142, 280, 22)}
      </g>
    ));
  }
  if (kind === 'fork') {
    return frame('github.com/169Pi/.github', (
      <g>
        <text x="20" y="56" fontSize="11" fontWeight="700" fill="#1B7A6E">169Pi / .github</text>
        <rect x="150" y="66" width="46" height="22" rx="6" fill="#f3f1ea" stroke="#d9d5cb" />
        <text x="173" y="80" fontSize="8" fill="#5c5850" textAnchor="middle">Watch</text>
        <rect x="202" y="66" width="46" height="22" rx="6" fill="#f3f1ea" stroke="#d9d5cb" />
        <text x="225" y="80" fontSize="8" fill="#5c5850" textAnchor="middle">★ Star</text>
        <rect x="254" y="66" width="46" height="22" rx="6" fill="#f3f1ea" stroke="#d9d5cb" />
        <text x="277" y="80" fontSize="8" fontWeight="700" fill="#171717" textAnchor="middle">⑂ Fork</text>
        {target(254, 66, 46, 22)}
        <rect x="20" y="104" width="280" height="52" rx="6" fill="#faf9f5" stroke="#eae7dd" />
        <text x="30" y="124" fontSize="8" fill="#a8a396">profile/README.md</text>
        <rect x="30" y="132" width="180" height="6" rx="3" fill="#e4e0d6" />
        <rect x="30" y="143" width="130" height="6" rx="3" fill="#e4e0d6" />
      </g>
    ));
  }
  if (kind === 'edit') {
    return frame('github.com/YOU/.github/profile/README.md', (
      <g>
        <rect x="20" y="46" width="280" height="24" rx="6" fill="#faf9f5" stroke="#eae7dd" />
        <text x="30" y="61" fontSize="8" fill="#5c5850" fontFamily="ui-monospace, monospace">profile/README.md</text>
        <rect x="268" y="50" width="24" height="16" rx="4" fill="#fff" stroke="#d9d5cb" />
        <path d="M274 62 l10 -10 3 3 -10 10 -4 1 1 -4z" fill="#5c5850" />
        {target(266, 48, 28, 20)}
        <text x="278" y="82" fontSize="7.5" fill="#1B7A6E" textAnchor="middle">Pencil = Edit</text>
        <rect x="20" y="92" width="280" height="66" rx="6" fill="#faf9f5" stroke="#eae7dd" />
        <rect x="30" y="104" width="200" height="6" rx="3" fill="#e4e0d6" />
        <rect x="30" y="118" width="240" height="6" rx="3" fill="#e4e0d6" />
        <rect x="30" y="132" width="160" height="6" rx="3" fill="#e4e0d6" />
      </g>
    ));
  }
  if (kind === 'commit') {
    return frame('github.com/YOU/.github  ·  editing', (
      <g>
        <rect x="20" y="44" width="280" height="60" rx="6" fill="#faf9f5" stroke="#eae7dd" />
        <text x="30" y="58" fontSize="8" fill="#a8a396" fontFamily="ui-monospace, monospace">## 🎨 Make this README yours</text>
        <rect x="30" y="66" width="150" height="6" rx="3" fill="#cfe6df" />
        <rect x="30" y="78" width="220" height="6" rx="3" fill="#cfe6df" />
        <rect x="30" y="90" width="120" height="6" rx="3" fill="#cfe6df" />
        <text x="20" y="122" fontSize="8" fill="#5c5850">Commit message</text>
        <rect x="20" y="128" width="180" height="20" rx="5" fill="#fff" stroke="#d9d5cb" />
        <rect x="210" y="128" width="90" height="22" rx="6" fill="#1f883d" />
        <text x="255" y="142" fontSize="8" fontWeight="700" fill="#fff" textAnchor="middle">Commit changes</text>
        {target(210, 128, 90, 22)}
      </g>
    ));
  }
  if (kind === 'pr') {
    return frame('github.com/169Pi/.github/compare', (
      <g>
        <text x="20" y="54" fontSize="10" fontWeight="700" fill="#171717">Comparing changes</text>
        <text x="20" y="70" fontSize="8" fill="#5c5850">base: 169Pi/.github  ←  compare: YOU/.github</text>
        <rect x="20" y="82" width="280" height="34" rx="6" fill="#eafaf0" stroke="#bfe6cf" />
        <text x="30" y="102" fontSize="8" fill="#1f883d">✓ Able to merge. These branches can be combined.</text>
        <rect x="20" y="128" width="130" height="24" rx="6" fill="#1f883d" />
        <text x="85" y="143" fontSize="8.5" fontWeight="700" fill="#fff" textAnchor="middle">Create pull request</text>
        {target(20, 128, 130, 24)}
      </g>
    ));
  }
  return null;
}

// No-code SVG generator: turns a name + message into a self-contained SVG the
// user can paste straight into their README. Runs entirely in the browser.
const STUDIO_THEMES = {
  teal: { bg: '#0f2b30', panel: '#132B33', accent: '#2fd6b6', text: '#eafaf5', sub: '#8fc7bd' },
  amber: { bg: '#2a1e08', panel: '#3a2a0a', accent: '#E8A317', text: '#fff7e6', sub: '#e8cf9a' },
  violet: { bg: '#1e1633', panel: '#271b45', accent: '#a78bfa', text: '#f2ecff', sub: '#c9b8f5' },
  paper: { bg: '#f4f1ea', panel: '#fbfaf7', accent: '#1B7A6E', text: '#171717', sub: '#5c5850' },
};
function esc(s) {
  return String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}
function buildStudioSvg({ handle, message, theme }) {
  const t = STUDIO_THEMES[theme] || STUDIO_THEMES.teal;
  const name = esc((handle || 'your-handle').trim() || 'your-handle');
  const msg = esc((message || 'Reasoning, in 4 bits.').trim() || 'Reasoning, in 4 bits.');
  const lines = msg.length > 42 ? [msg.slice(0, 42), msg.slice(42, 84)] : [msg];
  const bodyLines = lines
    .map((ln, i) => `<text x="40" y="${132 + i * 30}" font-family="Georgia, serif" font-size="26" fill="${t.text}">${ln}</text>`)
    .join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 220" width="640" height="220" role="img" aria-label="${name} — Alpie-Core">
  <rect width="640" height="220" rx="18" fill="${t.bg}"/>
  <rect x="16" y="16" width="608" height="188" rx="14" fill="${t.panel}"/>
  <circle cx="52" cy="52" r="10" fill="${t.accent}"/>
  <text x="72" y="57" font-family="ui-monospace, monospace" font-size="14" fill="${t.sub}">Alpie-Core · 32B · 4-bit · built in India</text>
  ${bodyLines}
  <rect x="40" y="168" width="${Math.min(560, 20 + name.length * 9)}" height="24" rx="12" fill="${t.accent}" opacity="0.16"/>
  <text x="52" y="185" font-family="ui-monospace, monospace" font-size="13" fill="${t.accent}">@${name}</text>
</svg>`;
}

const THEME_KEY = 'preptember.theme';
function applyTheme(pref) {
  try {
    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = pref === 'system' ? (sysDark ? 'dark' : 'light') : pref;
    document.documentElement.setAttribute('data-theme', resolved);
  } catch {}
}
const THEME_OPTIONS = [
  {
    id: 'light', label: 'Light',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2v2.5M12 19.5V22M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M2 12h2.5M19.5 12H22M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8" />
      </svg>
    ),
  },
  {
    id: 'system', label: 'System',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
    ),
  },
  {
    id: 'dark', label: 'Dark',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    ),
  },
];
function ThemeToggle() {
  const [pref, setPref] = useState('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let p = 'system';
    try { p = localStorage.getItem(THEME_KEY) || 'system'; } catch {}
    setPref(p);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(pref);
    try { localStorage.setItem(THEME_KEY, pref); } catch {}
    if (pref !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref, mounted]);

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Color theme">
      {THEME_OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={mounted && pref === o.id}
          aria-label={`${o.label} theme`}
          title={`${o.label} theme`}
          className={mounted && pref === o.id ? 'active' : ''}
          onClick={() => setPref(o.id)}
        >
          {o.icon}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [done, setDone] = useState({});
  const [openId, setOpenId] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const [stars, setStars] = useState(null);
  const [contributorsCount, setContributorsCount] = useState(null);
  const [prsCount, setPrsCount] = useState(null);
  const [contributors, setContributors] = useState(null);
  const [statsRepo, setStatsRepo] = useState({ owner: '169Pi', repo: '.github' });
  const [starsRepoInfo, setStarsRepoInfo] = useState({ owner: '169Pi', repo: 'Alpie-Core' });

  const [user, setUser] = useState(null);
  const [ghStatus, setGhStatus] = useState(null);

  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const chatRef = useRef(null);

  const [drafterOpen, setDrafterOpen] = useState(false);
  const [drafterForm, setDrafterForm] = useState({ name: '', medium: 'svg', vibe: '' });
  const [draft, setDraft] = useState('');
  const [drafterBusy, setDrafterBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioForm, setStudioForm] = useState({ handle: '', message: '', theme: 'teal' });
  const [studioCopied, setStudioCopied] = useState(false);
  const studioSvg = useMemo(() => buildStudioSvg(studioForm), [studioForm]);

  const cd = useCountdown(NEXT_MERGE_DATE);
  const hereNow = usePresence();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.done === 'object') setDone(parsed.done);
        if (parsed && typeof parsed.openId !== 'undefined') setOpenId(parsed.openId);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ done, openId })); } catch {}
  }, [done, openId, hydrated]);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const r = await fetch('/api/github/stats', { cache: 'no-store' });
        if (!r.ok) { if (!cancelled) setContributors([]); return; }
        const j = await r.json();
        if (cancelled) return;
        if (j.stars !== null && j.stars !== undefined) setStars(j.stars);
        if (j.prsCount !== null && j.prsCount !== undefined) setPrsCount(j.prsCount);
        if (j.contributorsCount !== null && j.contributorsCount !== undefined) setContributorsCount(j.contributorsCount);
        setContributors(Array.isArray(j.contributors) ? j.contributors : []);
        if (j.owner && j.repo) setStatsRepo({ owner: j.owner, repo: j.repo });
        if (j.starsOwner && j.starsRepo) setStarsRepoInfo({ owner: j.starsOwner, repo: j.starsRepo });
      } catch {
        if (!cancelled) setContributors([]);
      }
    }
    loadStats();
    const t = setInterval(loadStats, 60000);
    return () => { cancelled = true; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-store' });
        const j = await r.json();
        if (!cancelled) setUser(j.user || null);
      } catch {
        if (!cancelled) setUser(null);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const refreshGhStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/github/user-status', { cache: 'no-store' });
      const j = await r.json();
      setGhStatus(j);
      if (j && j.authenticated) {
        setDone((prev) => {
          const next = { ...prev };
          // Auto-check every step GitHub can verify for us, so the checklist
          // reflects real progress instead of relying on manual ticking.
          // Being signed in proves they have an account, so Step 0 is done.
          next.github = true;
          if (j.starred) next.star = true;
          if (j.forked) next.fork = true;
          if (j.openPr || j.mergedPr) next.pr = true;
          if (j.mergedPr) next.merged = true;
          return next;
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshGhStatus();
    const t = setInterval(refreshGhStatus, 45000);
    return () => clearInterval(t);
  }, [user, refreshGhStatus]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  const toggleDone = (id) => setDone((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleOpen = (id) => setOpenId((prev) => (prev === id ? null : id));

  async function sendChat(text) {
    const trimmed = (text ?? chatInput).trim();
    if (!trimmed || chatBusy) return;
    const nextMessages = [...chat, { role: 'user', content: trimmed }];
    setChat(nextMessages);
    setChatInput('');
    setChatBusy(true);
    try {
      const res = await fetch('/api/alpie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'chat', messages: nextMessages }),
      });
      const j = await res.json();
      if (!res.ok) {
        setChat((c) => [...c, { role: 'assistant', content: `Sorry — ${j.error || 'Alpie is unavailable right now.'}`, error: true }]);
      } else {
        setChat((c) => [...c, { role: 'assistant', content: j.content || '(no reply)' }]);
      }
    } catch (e) {
      setChat((c) => [...c, { role: 'assistant', content: 'Sorry — could not reach Alpie.', error: true }]);
    } finally {
      setChatBusy(false);
    }
  }

  function askAlpie(prompt) {
    setChatOpen(true);
    sendChat(prompt);
  }

  async function runDrafter() {
    if (drafterBusy) return;
    const { name, medium, vibe } = drafterForm;
    if (!name.trim()) return;
    setDrafterBusy(true);
    setDraft('');
    const userPrompt = `My name/handle: ${name.trim()}
Medium: ${medium}
A hint about what I want it to say / the vibe: ${vibe.trim() || '(surprise me)'}
Please write my "Make this README yours" entry now.`;
    try {
      const res = await fetch('/api/alpie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'draft', messages: [{ role: 'user', content: userPrompt }] }),
      });
      const j = await res.json();
      if (!res.ok) setDraft(`# Alpie could not draft this\n\n${j.error || ''}\n${j.detail || ''}`);
      else setDraft(j.content || '(no draft returned)');
    } catch {
      setDraft('# Could not reach Alpie');
    } finally {
      setDrafterBusy(false);
    }
  }

  async function logout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    setUser(null);
    setGhStatus(null);
  }

  const total = STEPS.length;
  const count = STEPS.filter((s) => done[s.id]).length;
  const pct = Math.round((count / total) * 100);
  const complete = count === total;
  const statusLabel = complete ? 'first PR ready!' : `${total - count} to go`;

  const suggestedQs = [
    'What should I make?',
    'Explain forking',
    'Fix my PR title',
  ];

  return (
    <main className="page">
      {/* Nav */}
      <div className="nav">
        <div className="nav-logo">
          <img src="/alpie-logo.webp" alt="169Pi logo" style={{ width: 26, height: 26, objectFit: 'contain' }} />
        </div>
        <div className="nav-brand">
          <div className="nav-title">169Pi</div>
          <div className="nav-sub">Preptember · road to Hacktoberfest</div>
        </div>
        <div style={{ flexGrow: 1 }} />
        <ThemeToggle />
        {hereNow !== null && (
          <span className="presence presence-nav" aria-live="polite" title={`${hereNow} ${hereNow === 1 ? 'person' : 'people'} here right now`}>
            <span className="presence-dot" />
            <span className="presence-num">{hereNow}</span>
            <span className="presence-label">{hereNow === 1 ? ' here now' : ' here now'}</span>
          </span>
        )}
        {user ? (
          <span className="auth-pill">
            {user.avatar ? <img src={user.avatar} alt={user.login} /> : null}
            <span>@{user.login}</span>
            <button className="logout" onClick={logout}>sign out</button>
          </span>
        ) : (
          <a href="/api/auth/github" className="auth-pill auth-pill-signin">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.1c-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.06.74.8 1.19 1.83 1.19 3.08 0 4.41-2.7 5.38-5.27 5.67.41.35.77 1.05.77 2.13v3.16c0 .31.21.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
            </svg>
            <span>Sign in<span className="hide-sm"> with GitHub</span></span>
          </a>
        )}
        <a
          href={`https://github.com/${OWNER}/${REPO}`}
          target="_blank"
          rel="noreferrer"
          className="nav-btn nav-btn-github"
          aria-label={`${REPO} repo on GitHub`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.1c-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.06.74.8 1.19 1.83 1.19 3.08 0 4.41-2.7 5.38-5.27 5.67.41.35.77 1.05.77 2.13v3.16c0 .31.21.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
          </svg>
          <span>{REPO} repo</span>
        </a>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className="nav-btn nav-btn-discord"
          aria-label="Join the 169pi Discord"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.32 4.57A19.79 19.79 0 0 0 16.56 3.4a.07.07 0 0 0-.07.03c-.16.29-.34.66-.47.96a18.28 18.28 0 0 0-5.48 0c-.13-.31-.32-.68-.48-.96a.08.08 0 0 0-.08-.03c-1.3.22-2.55.6-3.75 1.17a.07.07 0 0 0-.03.03C1.99 9.06 1.1 13.4 1.54 17.7a.08.08 0 0 0 .03.06c1.55 1.14 3.05 1.83 4.53 2.29a.08.08 0 0 0 .09-.03c.35-.48.66-.98.93-1.51a.08.08 0 0 0-.04-.11 12.6 12.6 0 0 1-1.8-.86.08.08 0 0 1-.01-.13c.12-.09.24-.19.36-.28a.08.08 0 0 1 .08-.01c3.78 1.73 7.86 1.73 11.6 0a.08.08 0 0 1 .08.01c.12.1.24.19.36.29a.08.08 0 0 1-.01.13c-.57.34-1.17.62-1.8.86a.08.08 0 0 0-.04.11c.28.53.59 1.03.93 1.51a.08.08 0 0 0 .09.03c1.49-.46 2.99-1.15 4.54-2.29a.08.08 0 0 0 .03-.06c.52-5.02-.87-9.32-3.68-13.16a.06.06 0 0 0-.03-.03zM8.52 15.09c-.9 0-1.63-.83-1.63-1.84s.72-1.84 1.63-1.84c.92 0 1.65.83 1.63 1.84 0 1.01-.72 1.84-1.63 1.84zm6.03 0c-.9 0-1.63-.83-1.63-1.84s.72-1.84 1.63-1.84c.92 0 1.65.83 1.63 1.84 0 1.01-.71 1.84-1.63 1.84z" />
          </svg>
          <span>Discord</span>
        </a>
      </div>

      {/* Context bar */}
      <div className="ctxbar">
        <span className="ctxbar-tag">FIRST TIME? PERFECT.</span>
        <span className="ctxbar-text">
          It&apos;s <strong>Preptember</strong> — the warm-up to Hacktoberfest. This is a beginner-friendly way to make your <strong>first open-source contribution</strong> with 169Pi. No experience needed — every step below has a short guide, and you can ask Alpie if you get stuck.
        </span>
      </div>

      {/* Hero */}
      <div className="hero">
        <div className="hero-left">
          <div className="pill-pixel">
            <span className="sq" />PREPTEMBER 2026 · WARM-UP TO HACKTOBERFEST
          </div>
          <h1 className="hero-h">
            Get ready for Hacktoberfest<br />with <span className="accent">169Pi.</span>
          </h1>
          <p>
            Make your first open-source contribution before October — the easy way. <strong>Alpie-Core</strong> is 169pi&apos;s open-source AI reasoning model (32B params, 4-bit, built in India). Plant a flag on the <strong>169pi org profile</strong> — custom SVG art, an explanatory diagram, a benchmark visualization, a runnable micro-demo — anything that showcases <em>you</em> reflecting something real about the model. Open a PR against <code>169Pi/.github</code> and we&apos;ll walk you through each step.
          </p>
          <div className="chips">
            <span className="chip">No experience needed</span>
            <span className="chip">~20 minutes</span>
            <span className="chip">Real 169pi swag when merged</span>
          </div>

          <details className="benchmarks" aria-label="Alpie-Core benchmarks">
            <summary className="benchmarks-summary">
              <span className="benchmarks-label">Alpie-Core, in numbers</span>
              <span className="benchmarks-hint">the technical bits, if you&apos;re curious</span>
              <span className="benchmarks-chevron" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <div className="benchmarks-grid">
              <div className="bench"><span className="bench-num">92.75%</span><span className="bench-cap">GSM8K</span></div>
              <div className="bench"><span className="bench-num">81.28%</span><span className="bench-cap">MMLU</span></div>
              <div className="bench"><span className="bench-num">57.8%</span><span className="bench-cap">SWE-Bench Verified</span></div>
              <div className="bench"><span className="bench-num">65K</span><span className="bench-cap">context</span></div>
              <div className="bench"><span className="bench-num">~16 GB</span><span className="bench-cap">VRAM</span></div>
            </div>
          </details>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stats-header">
            <span className="live-dot" />
            <span className="small-label">LIVE FROM {statsRepo.owner.toUpperCase()}/{statsRepo.repo.toUpperCase()}</span>
          </div>
          <div className="stars-panel">
            <div className="stars-row">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#E8A317" stroke="#E8A317" strokeWidth="1">
                <path d="M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 18l-6.6 3.2L6.7 14 1.7 9.4l7-.9z" />
              </svg>
              <span className="stars-num">{stars ?? '—'}</span>
            </div>
            <div className="stars-cap">stars on {starsRepoInfo.owner}/{starsRepoInfo.repo}</div>
          </div>
          <div className="stats-mini">
            <div className="mini">
              <div className="mini-num">{prsCount ?? '—'}</div>
              <div className="mini-cap">pull requests</div>
            </div>
            <div className="mini">
              <div className="mini-num">{contributorsCount ?? '—'}</div>
              <div className="mini-cap">contributors</div>
            </div>
          </div>
          <div className="stats-note">
            Every star, PR and name here is someone who took part.{' '}
            <strong>Add yours</strong> and watch it climb.
          </div>
          <div className="stats-cta">
            <a href={`https://github.com/${OWNER}/${REPO}`} target="_blank" rel="noreferrer" className="btn btn-teal">★ Star the repo</a>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="btn btn-dark">Join Discord</a>
          </div>
        </div>
      </div>

      {/* Try Alpie-Core */}
      <div className="try-wrap">
        <div className="try-card">
          <div className="try-left">
            <div className="try-eyebrow">TRY ALPIE-CORE</div>
            <h3 className="try-title">Run the model before you draw on it.</h3>
            <p className="try-sub">Easiest way in — just open it in your browser, no setup. Developers can grab the weights below.</p>
          </div>
          <div className="try-main">
            <div className="try-primary">
              <a href="https://alpie.ai" target="_blank" rel="noreferrer" className="try-btn try-btn-primary try-btn-alpie">
                <span className="try-btn-icon" aria-hidden="true">
                  <img src="/alpie-logo.webp" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                </span>
                <span className="try-btn-body">
                  <span className="try-btn-name">Chat with Alpie</span>
                  <span className="try-btn-sub">alpie.ai · no setup, just try it</span>
                </span>
              </a>
              <a href="https://playground.169pi.ai/dashboard" target="_blank" rel="noreferrer" className="try-btn try-btn-primary try-btn-playground">
                <span className="try-btn-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="try-btn-body">
                  <span className="try-btn-name">Open the Playground</span>
                  <span className="try-btn-sub">playground.169pi.ai</span>
                </span>
              </a>
            </div>

            <details className="try-more">
              <summary className="try-more-summary">
                <span>More ways to run it — for developers</span>
                <span className="try-more-chevron" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="try-buttons">
                <a href="https://huggingface.co/169Pi/Alpie-Core" target="_blank" rel="noreferrer" className="try-btn try-btn-hf">
                  <span className="try-btn-icon" aria-hidden="true">🤗</span>
                  <span className="try-btn-body">
                    <span className="try-btn-name">Hugging Face</span>
                    <span className="try-btn-sub">169Pi/Alpie-Core</span>
                  </span>
                </a>
                <a href="https://ollama.com/169pi" target="_blank" rel="noreferrer" className="try-btn try-btn-ollama">
                  <span className="try-btn-icon" aria-hidden="true">🦙</span>
                  <span className="try-btn-body">
                    <span className="try-btn-name">Ollama</span>
                    <span className="try-btn-sub">ollama run 169pi</span>
                  </span>
                </a>
                <a href="https://www.kaggle.com/169pi" target="_blank" rel="noreferrer" className="try-btn try-btn-kaggle">
                  <span className="try-btn-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M18.83 21.06a.34.34 0 0 1-.34.34h-3.14a.5.5 0 0 1-.4-.2l-4.4-5.63-1.28 1.22v4.27a.34.34 0 0 1-.34.34H6.4a.34.34 0 0 1-.34-.34V2.94A.34.34 0 0 1 6.4 2.6h2.53c.19 0 .34.15.34.34v10.6l5-5.02a.5.5 0 0 1 .35-.15h3.24c.31 0 .43.35.22.55L13 13.68l5.75 7.11a.35.35 0 0 1 .08.27z"/>
                    </svg>
                  </span>
                  <span className="try-btn-body">
                    <span className="try-btn-name">Kaggle</span>
                    <span className="try-btn-sub">notebooks & data</span>
                  </span>
                </a>
              </div>
            </details>

            <a href="https://playground.169pi.ai/dashboard/documents" target="_blank" rel="noreferrer" className="try-docs">
              Read the docs ↗
            </a>
          </div>
        </div>
      </div>

      {/* Hosting a session — resources for community leaders */}
      <div className="organize-wrap">
        <div className="organize-card">
          <div className="organize-left">
            <div className="organize-eyebrow">RUNNING A SESSION?</div>
            <h3 className="organize-title">Host Preptember for your community.</h3>
            <p className="organize-sub">
              Meetup, campus club or Discord — bring people through their first contribution together.
              Get a ready-made organizer&apos;s guide (agenda, checklist, talking points) drafted by Alpie in seconds.
            </p>
          </div>
          <div className="organize-actions">
            <button
              type="button"
              className="btn-solid organize-btn"
              onClick={() => askAlpie('Help me prepare an organizer’s guide for hosting a local Preptember contribution session — include a suggested agenda, a prep checklist, talking points for explaining forks and pull requests to newcomers, and tips for helping a group open their first PR to 169Pi/.github.')}
            >
              Help me prepare an organizer&apos;s guide →
            </button>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="organize-link">
              Coordinate with 169pi in Discord ↗
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {/* Steps */}
        <div className="steps-card">
          <div className="steps-head">
            <div>
              <h2>Your first contribution, step by step</h2>
              <p>
                Hit <strong>Help</strong> on any step for a short how-to. Check it off once you&apos;ve done it on GitHub
                {user ? ' — starring, forking and opening your PR are auto-checked from GitHub.' : ' — sign in with GitHub and the star, fork and PR steps get auto-checked for you.'}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="progress-cap">{count}/{total} · {statusLabel}</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: complete ? '#E8A317' : '#1B7A6E' }} />
              </div>
            </div>
          </div>

          <div className="noterminal">
            <span className="noterminal-icon" aria-hidden="true">🖱️</span>
            <span className="noterminal-text">
              <strong>No coding, no terminal, no installs.</strong> You do every step right here in your web browser —
              click <Term k="fork">Fork</Term>, edit a file, and open a <Term k="pull request">pull request</Term> on GitHub&apos;s website. That&apos;s the whole workflow.
            </span>
          </div>

          <div className="glossary">
            <button type="button" className="glossary-toggle" onClick={() => setGlossaryOpen((v) => !v)} aria-expanded={glossaryOpen}>
              <span className="glossary-toggle-label">📖 New words? Open the jargon-buster</span>
              <span className={`glossary-chevron ${glossaryOpen ? 'open' : ''}`} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>
            {glossaryOpen && (
              <dl className="glossary-list">
                {GLOSSARY.map((g) => (
                  <div key={g.term} className="glossary-item">
                    <dt>{g.term}{g.short ? <span className="glossary-alias"> ({g.short})</span> : null}</dt>
                    <dd>{g.def}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="steps-list">
            {STEPS.map((s) => {
              const isDone = !!done[s.id];
              const isOpen = !!s.help && openId === s.id;
              const cardClass = ['step', isDone ? 'step-done' : '', isOpen ? 'step-open' : ''].filter(Boolean).join(' ');
              return (
                <div key={s.id} className={cardClass}>
                  <div className="step-row">
                    <button
                      type="button"
                      onClick={() => toggleDone(s.id)}
                      aria-label={`Mark step ${s.tag} ${isDone ? 'not done' : 'done'}`}
                      className={`checkbox ${isDone ? 'checkbox-done' : ''}`}
                    >
                      {isDone && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FBFAF7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className="step-tag">{s.tag}</span>
                    {s.help ? (
                      <button type="button" onClick={() => toggleOpen(s.id)} className="step-body-btn">
                        <span style={{ flexGrow: 1 }}>
                          <span className={`step-title ${isDone ? 'step-title-done' : ''}`}>{s.title}</span>
                          <span className="step-desc">{s.desc}</span>
                        </span>
                        <span className={`help-btn ${isOpen ? 'open' : ''}`}>{isOpen ? 'Hide' : 'Help'}</span>
                      </button>
                    ) : (
                      <span className="step-body-static">
                        <span className={`step-title ${isDone ? 'step-title-done' : ''}`}>{s.title}</span>
                        <span className="step-desc">{s.desc}</span>
                      </span>
                    )}
                    {s.ctaText && (
                      <a href={s.ctaHref} target="_blank" rel="noreferrer" className="cta-pill">{s.ctaText}</a>
                    )}
                  </div>
                  {isOpen && (
                    <div className="step-guide">
                      <div>{renderGuide(s.guide)}</div>
                      {s.cmd && <div className="cmd">{s.cmd}</div>}
                      {s.mock && (
                        <div className="step-mock">
                          <GhMock kind={s.mock} />
                          <span className="step-mock-cap">what you&apos;ll see on GitHub — the highlighted button is the one to click</span>
                        </div>
                      )}
                      {s.webSteps && (
                        <div className="webflow">
                          <div className="webflow-label">Do it in your browser</div>
                          <ol>
                            {s.webSteps.map((w) => <li key={w}>{w}</li>)}
                          </ol>
                        </div>
                      )}
                      {s.rules && (
                        <div className="rules">
                          <div className="rules-label">Before you PR</div>
                          <ul>
                            {s.rules.map((r) => <li key={r}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                      {(s.drafter || s.studio) && (
                        <div className="guide-actions">
                          {s.studio && (
                            <button className="btn-solid" onClick={() => setStudioOpen(true)} style={{ padding: '8px 14px' }}>
                              Open Creation Studio →
                            </button>
                          )}
                          {s.drafter && (
                            <button className="btn-ghost" onClick={() => setDrafterOpen(true)} style={{ padding: '8px 14px' }}>
                              Draft it with Alpie →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="right-col">
          <div className="dark-card">
            <div className="countdown-label">COUNTDOWN TO NEXT MERGE</div>
            <div className="countdown-row">
              <span className="countdown-days">{cd.days}</span>
              <span className="countdown-days-label">days</span>
            </div>
            <div className="countdown-clock">{cd.clock}</div>
            <div className="countdown-merge">
              <span className="countdown-merge-dot" />
              Merges <strong>{NEXT_MERGE_DATE}</strong>
            </div>
          </div>

          <div className="leaderboard-card">
            <div className="leaderboard-head">
              <div>
                <div className="leaderboard-title">Contributor leaderboard</div>
                <div className="leaderboard-sub">
                  {contributorsCount ?? '—'} people have opened PRs to {statsRepo.owner}/{statsRepo.repo}
                </div>
              </div>
              <a
                href={`https://github.com/${statsRepo.owner}/${statsRepo.repo}/pulls?q=is%3Apr`}
                target="_blank"
                rel="noreferrer"
                className="leaderboard-all"
              >
                See all →
              </a>
            </div>
            <ol className="leaderboard-list">
              {contributors === null && (
                <li className="leaderboard-empty">Loading contributors…</li>
              )}
              {contributors && contributors.length === 0 && (
                <li className="leaderboard-empty">
                  No contributors yet — <strong>be the first</strong>.
                </li>
              )}
              {(contributors || []).slice(0, 10).map((c, i) => {
                const rank = i + 1;
                const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
                return (
                  <li key={c.login} className="leaderboard-row">
                    <span className={`leaderboard-rank ${rankClass}`}>{rank}</span>
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noreferrer"
                      className="leaderboard-user"
                    >
                      {c.avatar ? (
                        <img src={c.avatar} alt="" className="leaderboard-avatar" />
                      ) : (
                        <span
                          className="leaderboard-avatar"
                          style={{ background: initialsColor(c.login), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}
                        >
                          {c.login.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="leaderboard-login">@{c.login}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>

        </div>
      </div>

      {/* Floating Alpie chat */}
      <div className={`alpie-float ${chatOpen ? 'open' : ''}`}>
        {chatOpen && (
          <div className="alpie-panel dark-card">
            <div className="alpie-head">
              <div className="alpie-avatar">
                <img src="/alpie-logo.webp" alt="Alpie" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div className="alpie-title">Ask Alpie</div>
                <div className="alpie-sub">stuck? the model itself can help</div>
              </div>
              <button
                type="button"
                aria-label="Close Alpie chat"
                className="alpie-close"
                onClick={() => setChatOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {chat.length > 0 && (
              <div className="alpie-thread" ref={chatRef}>
                {chat.map((m, i) => (
                  <div key={i} className={`alpie-msg ${m.role} ${m.error ? 'error' : ''}`}>
                    {m.content}
                  </div>
                ))}
                {chatBusy && <div className="alpie-msg assistant" style={{ opacity: 0.7 }}>Alpie is thinking…</div>}
              </div>
            )}

            <div className="alpie-input-row">
              <input
                type="text"
                aria-label="Ask Alpie a question"
                placeholder="What's a fork? How do I open a PR?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
                className="alpie-input"
                disabled={chatBusy}
              />
              <button
                type="button"
                aria-label="Send question to Alpie"
                className="alpie-send"
                onClick={() => sendChat()}
                disabled={chatBusy}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBFAF7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>

            <div className="alpie-suggestions">
              {suggestedQs.map((q) => (
                <button key={q} type="button" className="alpie-suggestion" onClick={() => sendChat(q)} disabled={chatBusy}>
                  {q}
                </button>
              ))}
            </div>
            <div className="alpie-foot">
              Answers come from Alpie-Core, right here — deeper docs at{' '}
              <a href="https://playground.169pi.ai/dashboard/documents" target="_blank" rel="noreferrer">playground.169pi.ai</a>{' '}
              or try the model at{' '}
              <a href="https://alpie.ai" target="_blank" rel="noreferrer">alpie.ai</a>.
            </div>
          </div>
        )}
        {!chatOpen && (
          <button
            type="button"
            aria-label="Open Alpie chat"
            className="alpie-fab"
            onClick={() => setChatOpen(true)}
          >
            <img src="/alpie-logo.webp" alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            <span>Ask Alpie</span>
          </button>
        )}
      </div>

      {/* Drafter modal */}
      {drafterOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setDrafterOpen(false); }}>
          <div className="modal">
            <h3>Draft your README entry</h3>
            <p className="lede">Tell Alpie a bit about yourself. You get back a Markdown block — copy it, paste it into profile/README.md under the &ldquo;Make this README yours&rdquo; heading, commit.</p>
            <div className="field">
              <label>Your name or GitHub handle</label>
              <input
                value={drafterForm.name}
                onChange={(e) => setDrafterForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={user ? user.login : 'e.g. maya-builds'}
              />
            </div>
            <div className="field">
              <label>Medium</label>
              <select
                value={drafterForm.medium}
                onChange={(e) => setDrafterForm((f) => ({ ...f, medium: e.target.value }))}
              >
                <option value="svg">Custom SVG art / hero image</option>
                <option value="diagram">Explanatory diagram (Mermaid / SVG)</option>
                <option value="benchmark">Benchmark visualization (GSM8K / MMLU / SWE-Bench)</option>
                <option value="demo">Runnable micro-demo</option>
                <option value="ascii">Structured ASCII depicting something</option>
                <option value="writing">Writing with a visual layout</option>
              </select>
            </div>
            <div className="field">
              <label>Vibe / hint (optional)</label>
              <textarea
                value={drafterForm.vibe}
                onChange={(e) => setDrafterForm((f) => ({ ...f, vibe: e.target.value }))}
                placeholder="e.g. focus on 4-bit reasoning, keep it warm, mention India"
              />
            </div>
            {draft && (
              <div className="draft-block">{draft}</div>
            )}
            <div className="modal-actions">
              {draft && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
                  }}
                >
                  {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
              )}
              <div className="spacer" />
              <button type="button" className="btn-ghost" onClick={() => setDrafterOpen(false)}>Close</button>
              <button
                type="button"
                className="btn-solid"
                onClick={runDrafter}
                disabled={drafterBusy || !drafterForm.name.trim()}
              >
                {drafterBusy ? 'Drafting…' : draft ? 'Regenerate' : 'Draft it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creation Studio — no-code SVG generator, runs entirely in the browser */}
      {studioOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setStudioOpen(false); }}>
          <div className="modal">
            <h3>Creation Studio</h3>
            <p className="lede">No drawing app, no code. Type a message, pick a look, and get a ready-to-paste <Term k="svg">SVG</Term> — copy the code straight into profile/README.md, or download it. Everything happens in your browser.</p>
            <div className="field">
              <label>Your GitHub handle</label>
              <input
                value={studioForm.handle}
                onChange={(e) => setStudioForm((f) => ({ ...f, handle: e.target.value }))}
                placeholder={user ? user.login : 'e.g. maya-builds'}
              />
            </div>
            <div className="field">
              <label>Your message (one line works best)</label>
              <input
                value={studioForm.message}
                onChange={(e) => setStudioForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="e.g. Reasoning, in 4 bits."
                maxLength={84}
              />
            </div>
            <div className="field">
              <label>Look</label>
              <div className="studio-themes">
                {Object.keys(STUDIO_THEMES).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`studio-swatch ${studioForm.theme === key ? 'active' : ''}`}
                    onClick={() => setStudioForm((f) => ({ ...f, theme: key }))}
                    aria-label={`${key} theme`}
                    aria-pressed={studioForm.theme === key}
                    style={{ background: STUDIO_THEMES[key].bg, color: STUDIO_THEMES[key].accent }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
            <div className="studio-preview" dangerouslySetInnerHTML={{ __html: studioSvg }} />
            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(studioSvg); setStudioCopied(true); setTimeout(() => setStudioCopied(false), 1500); } catch {}
                }}
              >
                {studioCopied ? 'Copied!' : 'Copy SVG code'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  try {
                    const blob = new Blob([studioSvg], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${(studioForm.handle || 'preptember').trim() || 'preptember'}-alpie.svg`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  } catch {}
                }}
              >
                Download .svg
              </button>
              <div className="spacer" />
              <button type="button" className="btn-solid" onClick={() => setStudioOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      <div className="site-footer">
        Built by{' '}
        <a href="https://github.com/kindavishal/169pi" target="_blank" rel="noreferrer">
          @kindavishal
        </a>{' '}
        for Preptember 2026 · unofficial companion to Hacktoberfest ·{' '}
        <a href="https://github.com/kindavishal/169pi" target="_blank" rel="noreferrer">
          github.com/kindavishal/169pi
        </a>
      </div>
    </main>
  );
}
