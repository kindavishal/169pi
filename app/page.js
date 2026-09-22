'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || '169Pi';
const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || 'Alpie-Core';
const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/ZBJ4aMWcj';
const HACKTOBERFEST_START = '2026-10-01T00:00:00';
const STORAGE_KEY = 'preptember.progress.v1';

const STEPS = [
  { id: 'star', tag: '01', title: `Star ${REPO}`, desc: 'takes 2 seconds', ctaText: 'Star it ↗', ctaHref: `https://github.com/${OWNER}/${REPO}` },
  { id: 'discord', tag: '02', title: 'Join the Discord', desc: 'where you get help', ctaText: 'Join ↗', ctaHref: DISCORD_URL },
  { id: 'fork', tag: '03', title: 'Fork the repo', desc: 'make your own copy', help: true, ctaText: 'Open repo ↗', ctaHref: `https://github.com/${OWNER}/${REPO}`,
    guide: 'A fork is your personal copy of the repo. Click Fork (top-right) then Create fork. You will make your change in your copy, then offer it back.' },
  { id: 'add', tag: '04', title: 'Add your work to the README', desc: 'your creative bit', help: true,
    guide: 'In your fork, open README.md, scroll to the Wall of Fame section, and add your representation of the model there. Not sure what to make? Use the drafter or ask Alpie in the panel on the right.',
    cmd: 'README.md  →  ## 🏆 Wall of Fame', drafter: true },
  { id: 'pr', tag: '05', title: 'Open your pull request', desc: 'offer your change back', help: true, ctaText: 'Open a PR ↗', ctaHref: `https://github.com/${OWNER}/${REPO}/compare`,
    guide: 'A pull request asks 169Pi to add your change to their repo. Click Contribute then Open pull request, and name it exactly like this:',
    cmd: '[169pi] Your Name — Your Medium' },
  { id: 'review', tag: '06', title: 'Wait for the review', desc: 'reviewed weekly', help: true, ctaText: 'Discuss in Discord ↗', ctaHref: DISCORD_URL,
    guide: 'The team reviews weekly. If they suggest a tweak, just commit again to the same branch and your PR updates itself.' },
  { id: 'merged', tag: '07', title: 'Merged → you did it', desc: 'first contribution done', help: true,
    guide: 'When it is merged, your work is on the Wall of Fame and 169Pi ships you swag. You just made your first open-source contribution.' },
];

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

export default function Home() {
  const [done, setDone] = useState({});
  const [openId, setOpenId] = useState('fork');
  const [hydrated, setHydrated] = useState(false);

  const [stars, setStars] = useState(null);
  const [contributorsCount, setContributorsCount] = useState(null);
  const [prsCount, setPrsCount] = useState(null);
  const [recentPRs, setRecentPRs] = useState(null);

  const [user, setUser] = useState(null);
  const [ghStatus, setGhStatus] = useState(null);

  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const chatRef = useRef(null);

  const [drafterOpen, setDrafterOpen] = useState(false);
  const [drafterForm, setDrafterForm] = useState({ name: '', medium: 'haiku', vibe: '' });
  const [draft, setDraft] = useState('');
  const [drafterBusy, setDrafterBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const cd = useCountdown(HACKTOBERFEST_START);

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
        if (!r.ok) { if (!cancelled) setRecentPRs([]); return; }
        const j = await r.json();
        if (cancelled) return;
        if (j.stars !== null && j.stars !== undefined) setStars(j.stars);
        if (j.prsCount !== null && j.prsCount !== undefined) setPrsCount(j.prsCount);
        if (j.contributorsCount !== null && j.contributorsCount !== undefined) setContributorsCount(j.contributorsCount);
        setRecentPRs(Array.isArray(j.recentPRs) ? j.recentPRs : []);
      } catch {
        if (!cancelled) setRecentPRs([]);
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

  async function runDrafter() {
    if (drafterBusy) return;
    const { name, medium, vibe } = drafterForm;
    if (!name.trim()) return;
    setDrafterBusy(true);
    setDraft('');
    const userPrompt = `My name/handle: ${name.trim()}
Medium: ${medium}
A hint about what I want it to say / the vibe: ${vibe.trim() || '(surprise me)'}
Please write my Wall of Fame block now.`;
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
        <div>
          <div className="nav-title">169Pi</div>
          <div className="nav-sub">Preptember · road to Hacktoberfest</div>
        </div>
        <div style={{ flexGrow: 1 }} />
        <div className="nav-people">
          <span style={{ display: 'flex' }}>
            <span className="dot" style={{ background: '#E8A317' }} />
            <span className="dot" style={{ background: '#1B7A6E' }} />
            <span className="dot" style={{ background: '#C64B8C' }} />
          </span>
          <span style={{ fontSize: 12, color: '#c9d6d3' }}>
            <strong style={{ color: '#8fc7bd' }}>{contributorsCount ?? '—'}</strong> contributors so far
          </span>
        </div>
        {user ? (
          <span className="auth-pill">
            {user.avatar ? <img src={user.avatar} alt={user.login} /> : null}
            <span>@{user.login}</span>
            <button className="logout" onClick={logout}>sign out</button>
          </span>
        ) : (
          <a
            href="/api/auth/github"
            className="auth-pill"
            style={{ background: '#1B7A6E', borderColor: '#1B7A6E', color: '#FBFAF7' }}
          >
            Sign in with GitHub
          </a>
        )}
        <a href={`https://github.com/${OWNER}/${REPO}`} target="_blank" rel="noreferrer">
          {REPO} repo
        </a>
        <a href={DISCORD_URL} target="_blank" rel="noreferrer">Discord</a>
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
            Make your first open-source contribution before October — the easy way. <strong>Alpie-Core</strong> is 169Pi&apos;s open-source AI reasoning model (the first 4-bit one built in India). Show what it can do — a proof, a haiku, some ASCII, a bit of code — add it to the model&apos;s GitHub README, and open your first pull request. We&apos;ll walk you through each step.
          </p>
          <div className="chips">
            <span className="chip">No experience needed</span>
            <span className="chip">~20 minutes</span>
            <span className="chip">Real 169Pi swag when merged</span>
          </div>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stats-header">
            <span className="live-dot" />
            <span className="small-label">LIVE FROM THE {REPO.toUpperCase()} REPO</span>
          </div>
          <div className="stars-panel">
            <div className="stars-row">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#E8A317" stroke="#E8A317" strokeWidth="1">
                <path d="M12 2l3 6.5 7 .9-5 4.8 1.3 7L12 18l-6.6 3.2L6.7 14 1.7 9.4l7-.9z" />
              </svg>
              <span className="stars-num">{stars ?? '—'}</span>
            </div>
            <div className="stars-cap">stars on {REPO}</div>
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

      {/* PR feed */}
      <div className="feed-wrap">
        <div className="feed">
          <div className="feed-head">
            <span className="live-dot" />
            <span className="small-label">RECENT PULL REQUESTS</span>
          </div>
          <div className="feed-list">
            {recentPRs === null && (
              <span style={{ fontSize: 13, color: '#8a8578' }}>Loading recent PRs…</span>
            )}
            {recentPRs && recentPRs.length === 0 && (
              <span style={{ fontSize: 13, color: '#8a8578' }}>
                No PRs yet — <strong>be the first</strong>.
              </span>
            )}
            {(recentPRs || []).map((pr) => (
              <a key={pr.href} href={pr.href} target="_blank" rel="noreferrer" className="pr-pill">
                {pr.avatar ? (
                  <img src={pr.avatar} alt="" className="pr-avatar" style={{ background: '#eee' }} />
                ) : (
                  <span className="pr-avatar" style={{ background: initialsColor(pr.user) }}>
                    {pr.user.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span style={{ lineHeight: 1.2 }}>
                  <span className="pr-user">@{pr.user}</span>
                  <span className="pr-when">opened a PR · {pr.when}</span>
                </span>
              </a>
            ))}
          </div>
          <a href={`https://github.com/${OWNER}/${REPO}/pulls`} target="_blank" rel="noreferrer" className="see-all">
            See all →
          </a>
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
                {user ? ' (or sign in — we auto-check star, fork and PR).' : ' — or sign in with GitHub and we auto-check star, fork and PR.'}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div className="progress-cap">{count}/{total} · {statusLabel}</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: complete ? '#E8A317' : '#1B7A6E' }} />
              </div>
            </div>
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
                      <div>{s.guide}</div>
                      {s.cmd && <div className="cmd">{s.cmd}</div>}
                      {s.drafter && (
                        <div style={{ marginTop: 10 }}>
                          <button className="btn-solid" onClick={() => setDrafterOpen(true)} style={{ padding: '8px 14px' }}>
                            Draft it with Alpie →
                          </button>
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
            <div className="countdown-label">COUNTDOWN TO HACKTOBERFEST</div>
            <div className="countdown-row">
              <span className="countdown-days">{cd.days}</span>
              <span className="countdown-days-label">days</span>
            </div>
            <div className="countdown-clock">{cd.clock}</div>
            <div className="countdown-start">starts October 1, 2026</div>
          </div>

          <div className="dark-card">
            <div className="alpie-head">
              <div className="alpie-avatar">
                <img src="/alpie-logo.webp" alt="Alpie" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              </div>
              <div>
                <div className="alpie-title">Ask Alpie</div>
                <div className="alpie-sub">stuck? the model itself can help</div>
              </div>
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
              Answers come from Alpie-Core, right here — or go deeper at{' '}
              <a href="https://alpie.ai" target="_blank" rel="noreferrer">alpie.ai</a>.
            </div>
          </div>
        </div>
      </div>

      {/* Drafter modal */}
      {drafterOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setDrafterOpen(false); }}>
          <div className="modal">
            <h3>Draft your Wall of Fame entry</h3>
            <p className="lede">Tell Alpie a bit about yourself. You get back a Markdown block — copy it, paste it into README.md under the Wall of Fame heading, commit.</p>
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
                <option value="haiku">Haiku</option>
                <option value="limerick">Limerick</option>
                <option value="ascii">ASCII art</option>
                <option value="proof">Tiny proof</option>
                <option value="code">Two-line code snippet</option>
                <option value="compliment">One-line compliment</option>
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

      <div style={{ padding: '24px 56px 40px', fontSize: 12, color: '#8a8578', textAlign: 'center' }}>
        Built for Preptember 2026 · unofficial companion to Hacktoberfest ·{' '}
        <a href={`https://github.com/${OWNER}/${REPO}`} target="_blank" rel="noreferrer">
          github.com/{OWNER}/{REPO}
        </a>
      </div>
    </main>
  );
}
