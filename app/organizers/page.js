'use client';

import { useMemo, useRef, useState } from 'react';
import { GithubMark, SiteFooter, ThemeToggle } from '../_components/chrome';
import { MARK_169PI } from './logo';

const OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || '169Pi';
const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || 'Alpie-Core';
const PROFILE_OWNER = process.env.NEXT_PUBLIC_GITHUB_PROFILE_OWNER || '169Pi';
const PROFILE_REPO = process.env.NEXT_PUBLIC_GITHUB_PROFILE_REPO || '.github';
const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.gg/QqkrMmvt4';

// ── Instructor-led workshop curriculum ────────────────────────────
// Mirrors the website flow: Context → Setup → Creation → Submission.
const CURRICULUM = [
  {
    phase: 'Context',
    duration: '10 min',
    organizer:
      "Introduce 169Pi's Alpie-Core — a 32B-parameter, 4-bit open reasoning model built in India — and the goal for the session: everyone lands their first open-source contribution.",
    attendee: 'Sign in to GitHub and authenticate on the Preptember website.',
    icon: 'campaign',
  },
  {
    phase: 'Setup',
    duration: '10 min',
    organizer:
      "Walk through the website's 7-step checklist together — starring the 169Pi/Alpie-Core repo and joining the Discord as a group.",
    attendee: 'Complete steps 1–3 on the checklist (account, star, Discord).',
    icon: 'checklist',
  },
  {
    phase: 'Creation',
    duration: '25 min',
    organizer:
      'Guide attendees through generating or drawing their custom entry — SVG art, an explanatory diagram, or a runnable micro-demo.',
    attendee: 'Draw or generate their entry — SVG art, a diagram, or a runnable micro-demo.',
    icon: 'palette',
  },
  {
    phase: 'Submission',
    duration: '15 min',
    organizer:
      'Screen-share the 5-step CONTRIBUTING guide for adding an entry to the profile/README.md wall.',
    attendee: 'Open a Pull Request targeting the @169pi — the first brick 🧱 section.',
    icon: 'merge',
  },
];

// ── Community Canvas templates (co-branded social posts) ──────────
const TEMPLATES = [
  { id: 'square', label: 'Square post', hint: '1080×1080 · Instagram / LinkedIn', swatch: '#0D1117', w: 1080, h: 1080 },
  { id: 'landscape', label: 'Link / X card', hint: '1200×630 · X, LinkedIn, OG', swatch: '#F4F1EA', w: 1200, h: 630 },
  { id: 'portrait', label: 'Story', hint: '1080×1350 · Stories / Reels', swatch: '#081524', w: 1080, h: 1350 },
];

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SANS = "'Space Grotesk', system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// Builds a fully self-contained, co-branded social-post SVG for the chosen
// template. No external assets or scripts — safe to rasterize to PNG or share.
function buildSvg({ template, community, handle, tagline, logo }) {
  const name = (community || 'Your Community').trim();
  const tag = (tagline || 'Our first open-source contribution').trim();
  const at = (handle || 'your-handle').trim().replace(/^@/, '');

  if (template === 'landscape') {
    const nameSize = name.length > 26 ? 52 : name.length > 18 ? 68 : 84;
    const logoMarkup = logo
      ? `\n  <image href="${logo}" x="980" y="86" width="148" height="120" preserveAspectRatio="xMidYMid meet"/>`
      : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="${esc(name)} — Preptember 2026 with 169Pi Alpie-Core">
  <rect width="1200" height="630" fill="#F4F1EA"/>
  <rect x="0" y="0" width="18" height="630" fill="#10B981"/>
  <image href="${MARK_169PI}" x="72" y="58" width="66" height="66" preserveAspectRatio="xMidYMid meet"/>
  <text x="154" y="92" font-family="${MONO}" font-size="21" font-weight="700" fill="#134E4A" letter-spacing="2">169PI · ALPIE-CORE</text>
  <text x="154" y="116" font-family="${MONO}" font-size="15" fill="#526361">32B · 4-bit · Preptember 2026</text>
  <text x="72" y="308" font-family="${SANS}" font-size="${nameSize}" font-weight="700" fill="#0D1716">${esc(name)}</text>
  <text x="72" y="360" font-family="${SANS}" font-size="30" fill="#526361">${esc(tag)}</text>
  <line x1="72" y1="470" x2="1128" y2="470" stroke="#E2DDD2" stroke-width="2"/>
  <text x="72" y="532" font-family="${MONO}" font-size="26" font-weight="700" fill="#1B7A6E">@${esc(at)}</text>
  <text x="1128" y="532" text-anchor="end" font-family="${MONO}" font-size="20" fill="#6b7b78">Road to Hacktoberfest 🧱</text>${logoMarkup}
</svg>`;
  }

  if (template === 'portrait') {
    const nameSize = name.length > 22 ? 58 : name.length > 15 ? 80 : 104;
    const logoMarkup = logo
      ? `\n  <image href="${logo}" x="864" y="104" width="120" height="96" preserveAspectRatio="xMidYMid meet"/>`
      : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350" role="img" aria-label="${esc(name)} — Preptember 2026 with 169Pi Alpie-Core">
  <defs>
    <linearGradient id="ac-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4edea3"/><stop offset="1" stop-color="#4cd7f6"/></linearGradient>
    <pattern id="ac-dots" width="44" height="44" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.4" fill="#0f2a44"/></pattern>
  </defs>
  <rect width="1080" height="1350" fill="#081524"/>
  <rect width="1080" height="1350" fill="url(#ac-dots)" opacity="0.5"/>
  <rect x="36" y="36" width="1008" height="1278" rx="30" fill="none" stroke="#1b3147" stroke-width="2"/>
  <image href="${MARK_169PI}" x="96" y="112" width="66" height="66" preserveAspectRatio="xMidYMid meet"/>
  <text x="182" y="142" font-family="${MONO}" font-size="25" font-weight="700" fill="#4edea3" letter-spacing="2">ALPIE-CORE</text>
  <text x="182" y="176" font-family="${MONO}" font-size="18" fill="#7e8ea3">32B · 4-bit · built in India</text>
  <text x="96" y="560" font-family="${MONO}" font-size="24" fill="#4cd7f6" letter-spacing="4">PREPTEMBER 2026</text>
  <text x="96" y="686" font-family="${SANS}" font-size="${nameSize}" font-weight="700" fill="url(#ac-grad)">${esc(name)}</text>
  <text x="96" y="750" font-family="${SANS}" font-size="32" fill="#c3d3e8">${esc(tag)}</text>
  <rect x="96" y="852" width="888" height="132" rx="20" fill="#0c1a29" stroke="#1b3147" stroke-width="2"/>
  <text x="130" y="908" font-family="${MONO}" font-size="26" fill="#4edea3">Make your first open-source</text>
  <text x="130" y="948" font-family="${MONO}" font-size="26" fill="#4edea3">contribution to Alpie-Core 🧱</text>
  <line x1="96" y1="1188" x2="984" y2="1188" stroke="#1b3147" stroke-width="2"/>
  <text x="96" y="1252" font-family="${MONO}" font-size="27" font-weight="700" fill="#4edea3">@${esc(at)}</text>
  <text x="984" y="1252" text-anchor="end" font-family="${MONO}" font-size="20" fill="#7e8ea3">169pi · Road to Hacktoberfest</text>${logoMarkup}
</svg>`;
  }

  // default: square (dark)
  const nameSize = name.length > 24 ? 60 : name.length > 16 ? 80 : 104;
  const logoMarkup = logo
    ? `\n  <image href="${logo}" x="864" y="92" width="120" height="90" preserveAspectRatio="xMidYMid meet"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080" role="img" aria-label="${esc(name)} — Preptember 2026 with 169Pi Alpie-Core">
  <defs>
    <linearGradient id="ac-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4edea3"/><stop offset="1" stop-color="#0284c7"/></linearGradient>
    <pattern id="ac-dots" width="44" height="44" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.4" fill="#12351f"/></pattern>
  </defs>
  <rect width="1080" height="1080" fill="#0D1117"/>
  <rect width="1080" height="1080" fill="url(#ac-dots)" opacity="0.45"/>
  <rect x="36" y="36" width="1008" height="1008" rx="30" fill="none" stroke="#1E3835" stroke-width="2"/>
  <image href="${MARK_169PI}" x="96" y="96" width="66" height="66" preserveAspectRatio="xMidYMid meet"/>
  <text x="182" y="126" font-family="${MONO}" font-size="25" font-weight="700" fill="#4edea3" letter-spacing="2">ALPIE-CORE</text>
  <text x="182" y="160" font-family="${MONO}" font-size="18" fill="#7e8ea3">32B · 4-bit · built in India</text>
  <text x="96" y="470" font-family="${MONO}" font-size="23" fill="#4edea3" letter-spacing="3">PREPTEMBER 2026 · ROAD TO HACKTOBERFEST</text>
  <text x="96" y="590" font-family="${SANS}" font-size="${nameSize}" font-weight="700" fill="url(#ac-grad)">${esc(name)}</text>
  <text x="96" y="656" font-family="${SANS}" font-size="32" fill="#c3d3e8">${esc(tag)}</text>
  <text x="96" y="752" font-family="${MONO}" font-size="22" fill="#94a3b8">★ Star  ·  ⑂ Fork  ·  Open a PR  →  with 169Pi</text>
  <line x1="96" y1="906" x2="984" y2="906" stroke="#1E3835" stroke-width="2"/>
  <text x="96" y="972" font-family="${MONO}" font-size="27" font-weight="700" fill="#4edea3">@${esc(at)}</text>
  <text x="984" y="972" text-anchor="end" font-family="${MONO}" font-size="22" fill="#7e8ea3">first brick 🧱</text>${logoMarkup}
</svg>`;
}

// Default, ready-to-paste social caption for the post.
function defaultCaption(community, handle) {
  const name = (community || 'Our community').trim() || 'Our community';
  const at = (handle || '').trim().replace(/^@/, '');
  const by = at ? ` Hosted by @${at}.` : '';
  return `🚀 ${name} is doing Preptember with 169Pi!

We're making our first open-source contribution to Alpie-Core — 169Pi's open-source 32B, 4-bit reasoning model built in India.${by}

⭐ Star the repo · 💬 join the Discord · 🧱 open your first pull request with us.

#Preptember #Hacktoberfest #OpenSource #AlpieCore #169Pi #FirstPR`;
}

// Default, ready-to-paste image-generation prompt for external tools.
function defaultFeaturePrompt(community) {
  const name = (community || 'our community').trim() || 'our community';
  return `A bold, minimal hero banner celebrating ${name}'s first open-source contribution to Alpie-Core — 169Pi's 32B, 4-bit open reasoning model built in India. Center the community name "${name}" with subtle circuit-board and terminal motifs, a deep pine-teal and emerald palette (#134E4A, #10B981, #0284C7) on a warm parchment or dark navy background. Clean geometric sans-serif type, generous negative space, flat vector illustration style, crisp edges. Add a small tag reading "32B · 4-bit · Preptember 2026". No photorealism, no stock-photo people, no clutter. Aspect ratio 16:9.`;
}

export default function Organizers() {
  // Community Canvas state
  const [template, setTemplate] = useState('square');
  const [community, setCommunity] = useState('');
  const [handle, setHandle] = useState('');
  const [tagline, setTagline] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoName, setLogoName] = useState('');
  const [logoError, setLogoError] = useState('');
  const [caption, setCaption] = useState('');
  const [captionTouched, setCaptionTouched] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [pngBusy, setPngBusy] = useState(false);
  const fileRef = useRef(null);

  // Feature-prompt state
  const [prompt, setPrompt] = useState('');
  const [promptTouched, setPromptTouched] = useState(false);
  const [promptBusy, setPromptBusy] = useState(false);
  const [promptError, setPromptError] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const svg = useMemo(
    () => buildSvg({ template, community, handle, tagline, logo }),
    [template, community, handle, tagline, logo]
  );

  const dims = TEMPLATES.find((t) => t.id === template) || TEMPLATES[0];
  const postCaption = captionTouched ? caption : defaultCaption(community, handle);
  const featurePrompt = promptTouched ? prompt : defaultFeaturePrompt(community);
  const fileBase = `preptember-${(community || 'post').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'post'}`;

  function onLogo(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setLogoError('');
    if (!f.type.startsWith('image/')) {
      setLogoError('Please choose an image file.');
      return;
    }
    if (f.size > 400 * 1024) {
      setLogoError('Logo is over 400 KB — pick a smaller file so the SVG stays lightweight.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogo(String(reader.result));
      setLogoName(f.name);
    };
    reader.onerror = () => setLogoError('Could not read that file.');
    reader.readAsDataURL(f);
  }

  function clearLogo() {
    setLogo(null);
    setLogoName('');
    setLogoError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function copyText(text, setFlag) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers that block the async clipboard API.
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {}
    }
    setFlag(true);
    setTimeout(() => setFlag(false), 1800);
  }

  function download(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportSvg() {
    try {
      download(`${fileBase}.svg`, new Blob([svg], { type: 'image/svg+xml' }));
    } catch {}
  }

  // Rasterizes the current SVG to a high-resolution PNG so it can be posted
  // directly to social platforms (which don't accept SVG uploads).
  function exportPng() {
    setPngBusy(true);
    try {
      const scale = 2;
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = dims.w * scale;
          canvas.height = dims.h * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((png) => {
            if (png) download(`${fileBase}.png`, png);
            URL.revokeObjectURL(url);
            setPngBusy(false);
          }, 'image/png');
        } catch {
          URL.revokeObjectURL(url);
          setPngBusy(false);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); setPngBusy(false); };
      img.src = url;
    } catch {
      setPngBusy(false);
    }
  }

  async function generatePrompt() {
    setPromptBusy(true);
    setPromptError('');
    const name = (community || 'our community').trim() || 'our community';
    const ask = `Write a single, ready-to-paste image-generation prompt (for tools like Midjourney, DALL·E or Ideogram) for a graphic celebrating my community "${name}" making its first contribution to Alpie-Core during Preptember. Reflect Alpie-Core's identity (32B, 4-bit open reasoning model built in India) and 169pi's teal/emerald palette. Keep it to one vivid but concrete paragraph and end with style and aspect-ratio tags. Return only the prompt text — no preamble.`;
    try {
      const res = await fetch('/api/alpie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'chat', messages: [{ role: 'user', content: ask }] }),
      });
      const j = await res.json();
      if (!res.ok) {
        setPromptError(j.error || 'Alpie is unavailable right now — the template below still works.');
      } else if (j.content) {
        setPrompt(j.content.trim());
        setPromptTouched(true);
      }
    } catch {
      setPromptError('Could not reach Alpie — the template below still works.');
    } finally {
      setPromptBusy(false);
    }
  }

  return (
    <div className="page">
      {/* Sticky nav */}
      <header className="site-nav">
        <div className="nav-inner">
          <a href="/" className="nav-brand-link" aria-label="169Pi Preptember home">
            <span className="nav-logo">
              <img src="/alpie-logo.webp" alt="169Pi logo" style={{ width: 30, height: 30, objectFit: 'contain' }} />
            </span>
            <span className="nav-title">169Pi</span>
            <span className="nav-tag">Preptember · For Organizers</span>
          </a>
          <div className="nav-actions" style={{ marginLeft: 'auto' }}>
            <a href="/" className="nav-link-organizers">← Checklist</a>
            <ThemeToggle />
            <a href="/api/auth/github" className="auth-pill auth-pill-signin">
              <GithubMark />
              <span>Sign in<span className="hide-sm"> with GitHub</span></span>
            </a>
          </div>
        </div>
      </header>

      <main className="wrap">
        {/* Intro */}
        <section className="section org-intro">
          <div className="pill-pixel">
            <span className="sq" />FOR ORGANIZERS · RUN IT AS A WORKSHOP
          </div>
          <h1 className="org-h1">
            Run Preptember like an <span className="accent">instructor-led workshop.</span>
          </h1>
          <p className="org-lede">
            Everything below maps to the live Preptember flow, so you don&apos;t build a lesson plan from scratch.
            Follow the standardized agenda, use the <strong>Community Canvas</strong> to make a co-branded social post
            announcing your session, and grab a prompt template for featuring your community. Meetup, campus club or
            Discord — bring a whole group through their first pull request together.
          </p>
          <div className="org-intro-cta">
            <a href="#curriculum" className="hbtn hbtn-primary">
              See the agenda<span className="material-symbols-outlined">arrow_downward</span>
            </a>
            <a href="/" className="hbtn hbtn-ghost">
              <span className="material-symbols-outlined i-teal">checklist</span>Open the attendee checklist
            </a>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="hbtn hbtn-discord">
              <span className="material-symbols-outlined">group</span>Coordinate in Discord
            </a>
          </div>
        </section>

        {/* 1 · Curriculum */}
        <section className="section" id="curriculum">
          <div className="card org-card">
            <div className="org-card-head">
              <span className="eyebrow"><span className="material-symbols-outlined">event_note</span>01 · Instructor-led curriculum</span>
              <h2 className="org-card-title">A 60-minute agenda that mirrors the website</h2>
              <p className="org-card-sub">
                Four phases, ~60 minutes end to end. Each phase pairs what <strong>you</strong> demo with what
                <strong> attendees</strong> do on their own machines.
              </p>
            </div>

            <div className="curr-list">
              {CURRICULUM.map((c, i) => (
                <div key={c.phase} className="curr-card">
                  <div className="curr-head">
                    <span className="curr-index">{String(i + 1).padStart(2, '0')}</span>
                    <span className="curr-phase-icon"><span className="material-symbols-outlined">{c.icon}</span></span>
                    <span className="curr-phase">{c.phase}</span>
                    <span className="curr-dur"><span className="material-symbols-outlined">schedule</span>{c.duration}</span>
                  </div>
                  <div className="curr-cols">
                    <div className="curr-col curr-col-org">
                      <span className="curr-col-label">You (organizer)</span>
                      <p>{c.organizer}</p>
                    </div>
                    <div className="curr-col curr-col-att">
                      <span className="curr-col-label">Attendees</span>
                      <p>{c.attendee}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="org-inline-note">
              <span className="material-symbols-outlined">tips_and_updates</span>
              <span>
                Keep the attendee <a href="/">checklist</a> open on the shared screen — starring, forking and PRs
                auto-check once each person signs in with GitHub, so you can see the room progress live.
              </span>
            </div>
          </div>
        </section>

        {/* 2 · Community Canvas */}
        <section className="section" id="canvas">
          <div className="card org-card">
            <div className="org-card-head">
              <span className="eyebrow"><span className="material-symbols-outlined">share</span>02 · The Community Canvas</span>
              <h2 className="org-card-title">Make a co-branded social post — no design software</h2>
              <p className="org-card-sub">
                Announce your session on social. Pick a post size, drop in your campus or club logo, add a handle,
                then download a ready-to-share image and copy a matching caption. Tag <strong>169Pi</strong> when you
                post — we reshare community shout-outs.
              </p>
            </div>

            <div className="canvas-wrap">
              {/* Controls */}
              <div className="canvas-controls">
                <div className="canvas-field">
                  <label className="canvas-label">Post size</label>
                  <div className="canvas-templates">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`tpl-btn ${template === t.id ? 'active' : ''}`}
                        onClick={() => setTemplate(t.id)}
                        aria-pressed={template === t.id}
                      >
                        <span className="tpl-swatch" style={{ background: t.swatch }} />
                        <span className="tpl-text">
                          <span className="tpl-name">{t.label}</span>
                          <span className="tpl-hint">{t.hint}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="canvas-field">
                  <label className="canvas-label" htmlFor="cc-community">Community name</label>
                  <input id="cc-community" className="canvas-input" type="text" placeholder="e.g. IIT Delhi OSS Club"
                    value={community} onChange={(e) => setCommunity(e.target.value)} maxLength={40} />
                </div>

                <div className="canvas-field">
                  <label className="canvas-label" htmlFor="cc-handle">Handle <span className="canvas-opt">(@ — GitHub or social)</span></label>
                  <input id="cc-handle" className="canvas-input" type="text" placeholder="your-handle"
                    value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={39} />
                </div>

                <div className="canvas-field">
                  <label className="canvas-label" htmlFor="cc-tagline">Message <span className="canvas-opt">(optional)</span></label>
                  <input id="cc-tagline" className="canvas-input" type="text" placeholder="Our first open-source contribution"
                    value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={60} />
                </div>

                <div className="canvas-field">
                  <label className="canvas-label">Campus / club logo <span className="canvas-opt">(optional)</span></label>
                  <div className="logo-drop">
                    <input ref={fileRef} id="cc-logo" type="file" accept="image/*" onChange={onLogo} className="logo-input" />
                    <label htmlFor="cc-logo" className="logo-btn">
                      <span className="material-symbols-outlined">upload</span>
                      {logoName ? 'Replace logo' : 'Upload a logo'}
                    </label>
                    {logoName && (
                      <span className="logo-file">
                        {logoName}
                        <button type="button" className="logo-clear" onClick={clearLogo} aria-label="Remove logo">✕</button>
                      </span>
                    )}
                  </div>
                  {logoError && <span className="canvas-error">{logoError}</span>}
                  <span className="canvas-help">SVG or PNG under 400 KB. It sits top-right on the post, co-branded with Alpie-Core.</span>
                </div>
              </div>

              {/* Preview + download */}
              <div className="canvas-stage">
                <div className="canvas-preview" aria-label="Live preview" dangerouslySetInnerHTML={{ __html: svg }} />
                <div className="canvas-actions">
                  <button type="button" className="btn-solid" onClick={exportPng} disabled={pngBusy}>
                    <span className="material-symbols-outlined">{pngBusy ? 'hourglass_top' : 'download'}</span>{pngBusy ? 'Rendering…' : 'Download PNG'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={exportSvg}>
                    <span className="material-symbols-outlined">code</span>Download SVG
                  </button>
                </div>
                <span className="canvas-help">PNG uploads straight to any platform. SVG stays crisp for slides or print.</span>
              </div>
            </div>

            {/* Caption + posting steps */}
            <div className="canvas-post">
              <div className="prompt-box">
                <div className="prompt-box-head">
                  <span className="prompt-box-title"><span className="material-symbols-outlined">chat</span>Caption</span>
                  <div className="prompt-box-actions">
                    <button type="button" className="btn-solid btn-sm" onClick={() => copyText(postCaption, setCopiedCaption)}>
                      <span className="material-symbols-outlined">content_copy</span>{copiedCaption ? 'Copied!' : 'Copy caption'}
                    </button>
                  </div>
                </div>
                <textarea
                  className="prompt-text"
                  value={postCaption}
                  onChange={(e) => { setCaption(e.target.value); setCaptionTouched(true); }}
                  rows={8}
                  aria-label="Social post caption"
                />
                <span className="canvas-help">Fills in from the community name and handle above until you start typing. Add your date, venue or link before posting.</span>
              </div>

              <div className="canvas-pipeline">
                <span className="canvas-pipeline-title">Post it in 3 steps</span>
                <ol>
                  <li>Download the <strong>PNG</strong> (add your logo above to co-brand it).</li>
                  <li>Copy the caption and drop in your date, venue or sign-up link.</li>
                  <li>Post on LinkedIn, X or Instagram and tag <strong>169Pi</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* 3 · Getting featured */}
        <section className="section" id="featured">
          <div className="card org-card">
            <div className="org-card-head">
              <span className="eyebrow"><span className="material-symbols-outlined">auto_awesome</span>03 · Getting your community featured</span>
              <h2 className="org-card-title">Generate a hero image on an external platform</h2>
              <p className="org-card-sub">
                Want a richer graphic than an SVG? Take this prompt to an image generator (Midjourney, DALL·E, Ideogram —
                or drive one with the Alpie API), then feature the result on your community&apos;s page. Add your community
                name above and let Alpie tailor the prompt, or copy the template and tweak it yourself.
              </p>
            </div>

            <div className="prompt-box">
              <div className="prompt-box-head">
                <span className="prompt-box-title"><span className="material-symbols-outlined">edit_note</span>Template prompt</span>
                <div className="prompt-box-actions">
                  <button type="button" className="btn-ghost btn-sm" onClick={generatePrompt} disabled={promptBusy}>
                    <span className="material-symbols-outlined">{promptBusy ? 'hourglass_top' : 'auto_awesome'}</span>
                    {promptBusy ? 'Asking Alpie…' : 'Tailor with Alpie'}
                  </button>
                  <button type="button" className="btn-solid btn-sm" onClick={() => copyText(featurePrompt, setCopiedPrompt)}>
                    <span className="material-symbols-outlined">content_copy</span>{copiedPrompt ? 'Copied!' : 'Copy prompt'}
                  </button>
                </div>
              </div>
              <textarea
                className="prompt-text"
                value={featurePrompt}
                onChange={(e) => { setPrompt(e.target.value); setPromptTouched(true); }}
                rows={7}
                aria-label="Image generation prompt"
              />
              {promptError && <span className="canvas-error">{promptError}</span>}
              <span className="canvas-help">
                Edits are yours to keep. Placeholders fill in from the community name above until you start typing.
              </span>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
