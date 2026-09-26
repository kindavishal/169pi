'use client';

import { useMemo, useRef, useState } from 'react';
import { GithubMark, SiteFooter, ThemeToggle } from '../_components/chrome';

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
    attendee: 'Use the Community Canvas below to create their entry.',
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

// ── Community Canvas templates ────────────────────────────────────
const TEMPLATES = [
  { id: 'badge', label: 'Contributor badge', hint: 'Dark card · bold wordmark', swatch: '#0D1117' },
  { id: 'banner', label: 'Wide banner', hint: 'Light parchment · header strip', swatch: '#F4F1EA' },
  { id: 'terminal', label: 'Terminal card', hint: 'Cyber-terminal · commit log', swatch: '#081524' },
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

// Builds a fully self-contained SVG string for the chosen template. No external
// assets or scripts — safe to commit as a file or paste inline into a README.
function buildSvg({ template, community, handle, tagline, logo }) {
  const name = (community || 'Your Community').trim();
  const tag = (tagline || 'Our first open-source contribution').trim();
  const at = (handle || 'your-handle').trim().replace(/^@/, '');
  const nameSize = name.length > 22 ? 30 : name.length > 15 ? 40 : 50;

  if (template === 'banner') {
    const logoMarkup = logo
      ? `\n  <image href="${logo}" x="628" y="96" width="132" height="108" preserveAspectRatio="xMidYMid meet"/>`
      : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 300" width="800" height="300" role="img" aria-label="${esc(name)} — Preptember 2026 with Alpie-Core">
  <rect x="3" y="3" width="794" height="294" rx="20" fill="#F4F1EA" stroke="#E2DDD2" stroke-width="2"/>
  <rect x="3" y="3" width="14" height="294" rx="7" fill="#10B981"/>
  <text x="52" y="66" font-family="${MONO}" font-size="15" font-weight="700" fill="#134E4A" letter-spacing="2">ALPIE-CORE · 32B · 4-BIT</text>
  <text x="52" y="150" font-family="${SANS}" font-size="${nameSize}" font-weight="700" fill="#0D1716">${esc(name)}</text>
  <text x="52" y="188" font-family="${SANS}" font-size="19" fill="#526361">${esc(tag)}</text>
  <line x1="52" y1="226" x2="748" y2="226" stroke="#E2DDD2" stroke-width="2"/>
  <text x="52" y="262" font-family="${MONO}" font-size="17" font-weight="700" fill="#1B7A6E">@${esc(at)}</text>
  <text x="748" y="262" text-anchor="end" font-family="${MONO}" font-size="13" fill="#6b7b78">Preptember 2026 · first brick 🧱</text>${logoMarkup}
</svg>`;
  }

  if (template === 'terminal') {
    const logoMarkup = logo
      ? `\n  <image href="${logo}" x="656" y="150" width="104" height="80" preserveAspectRatio="xMidYMid meet" opacity="0.9"/>`
      : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" width="800" height="420" role="img" aria-label="${esc(name)} — Preptember 2026 with Alpie-Core">
  <rect x="3" y="3" width="794" height="414" rx="18" fill="#081524" stroke="#1b3147" stroke-width="2"/>
  <rect x="3" y="3" width="794" height="46" rx="18" fill="#0c1a29"/>
  <rect x="3" y="30" width="794" height="19" fill="#0c1a29"/>
  <circle cx="36" cy="26" r="6" fill="#e06c5b"/>
  <circle cx="58" cy="26" r="6" fill="#e8b84b"/>
  <circle cx="80" cy="26" r="6" fill="#57b877"/>
  <text x="400" y="31" text-anchor="middle" font-family="${MONO}" font-size="13" fill="#64748b">preptember — 169pi/.github</text>
  <text x="40" y="112" font-family="${MONO}" font-size="18" fill="#4cd7f6">$ 169pi preptember --join</text>
  <text x="40" y="154" font-family="${MONO}" font-size="17" fill="#10B981">✓ starred 169Pi/Alpie-Core  (32B · 4-bit)</text>
  <text x="40" y="188" font-family="${MONO}" font-size="17" fill="#10B981">✓ joined the community</text>
  <text x="40" y="238" font-family="${SANS}" font-size="${nameSize}" font-weight="700" fill="#d4e4fa">${esc(name)}</text>
  <text x="40" y="276" font-family="${MONO}" font-size="16" fill="#94a3b8">${esc(tag)}</text>
  <text x="40" y="344" font-family="${MONO}" font-size="18" fill="#4edea3">$ git commit -m "@${esc(at)}: first brick"</text>
  <rect x="40" y="360" width="14" height="22" fill="#4edea3"/>
  <text x="760" y="380" text-anchor="end" font-family="${MONO}" font-size="13" fill="#64748b">Preptember 2026 🧱</text>${logoMarkup}
</svg>`;
  }

  // default: badge (dark)
  const logoMarkup = logo
    ? `\n  <image href="${logo}" x="640" y="40" width="120" height="72" preserveAspectRatio="xMidYMid meet"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" width="800" height="420" role="img" aria-label="${esc(name)} — Preptember 2026 with Alpie-Core">
  <defs>
    <linearGradient id="ac-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4edea3"/>
      <stop offset="1" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="792" height="412" rx="24" fill="#0D1117" stroke="#1E3835" stroke-width="2"/>
  <rect x="40" y="40" width="46" height="46" rx="13" fill="#10B981"/>
  <text x="63" y="72" text-anchor="middle" font-family="${MONO}" font-size="22" font-weight="700" fill="#04121b">π</text>
  <text x="104" y="58" font-family="${MONO}" font-size="16" font-weight="700" fill="#4edea3" letter-spacing="2">ALPIE-CORE</text>
  <text x="104" y="80" font-family="${MONO}" font-size="12" fill="#7e8ea3">32B · 4-bit · built in India</text>
  <text x="40" y="228" font-family="${SANS}" font-size="${nameSize + 2}" font-weight="700" fill="url(#ac-grad)">${esc(name)}</text>
  <text x="40" y="268" font-family="${SANS}" font-size="20" fill="#c3d3e8">${esc(tag)}</text>
  <line x1="40" y1="330" x2="760" y2="330" stroke="#1E3835" stroke-width="2"/>
  <text x="40" y="370" font-family="${MONO}" font-size="19" font-weight="700" fill="#4edea3">@${esc(at)}</text>
  <text x="760" y="370" text-anchor="end" font-family="${MONO}" font-size="14" fill="#7e8ea3">Preptember 2026 · first brick 🧱</text>${logoMarkup}
</svg>`;
}

// Default, ready-to-paste image-generation prompt for external tools.
function defaultFeaturePrompt(community) {
  const name = (community || 'our community').trim() || 'our community';
  return `A bold, minimal hero banner celebrating ${name}'s first open-source contribution to Alpie-Core — 169Pi's 32B, 4-bit open reasoning model built in India. Center the community name "${name}" with subtle circuit-board and terminal motifs, a deep pine-teal and emerald palette (#134E4A, #10B981, #0284C7) on a warm parchment or dark navy background. Clean geometric sans-serif type, generous negative space, flat vector illustration style, crisp edges. Add a small tag reading "32B · 4-bit · Preptember 2026". No photorealism, no stock-photo people, no clutter. Aspect ratio 16:9.`;
}

export default function Organizers() {
  // Community Canvas state
  const [template, setTemplate] = useState('badge');
  const [community, setCommunity] = useState('');
  const [handle, setHandle] = useState('');
  const [tagline, setTagline] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoName, setLogoName] = useState('');
  const [logoError, setLogoError] = useState('');
  const [copiedSvg, setCopiedSvg] = useState(false);
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

  const featurePrompt = promptTouched ? prompt : defaultFeaturePrompt(community);

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

  function exportSvg() {
    try {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `preptember-${(handle || 'entry').replace(/^@/, '') || 'entry'}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
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
            Follow the standardized agenda, use the <strong>Community Canvas</strong> to make co-branded SVG art on the
            spot, and grab a prompt template for featuring your community. Meetup, campus club or Discord — bring a
            whole group through their first pull request together.
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
              <span className="eyebrow"><span className="material-symbols-outlined">draw</span>02 · The Community Canvas</span>
              <h2 className="org-card-title">Make a co-branded entry — no design software</h2>
              <p className="org-card-sub">
                Pick a template, drop in your campus or club logo, add a GitHub handle, then export a valid SVG or
                copy the code straight into the GitHub web editor when editing <code>profile/README.md</code>.
              </p>
            </div>

            <div className="canvas-wrap">
              {/* Controls */}
              <div className="canvas-controls">
                <div className="canvas-field">
                  <label className="canvas-label">Template</label>
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
                  <label className="canvas-label" htmlFor="cc-handle">GitHub handle</label>
                  <input id="cc-handle" className="canvas-input" type="text" placeholder="your-handle"
                    value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={39} />
                </div>

                <div className="canvas-field">
                  <label className="canvas-label" htmlFor="cc-tagline">Tagline <span className="canvas-opt">(optional)</span></label>
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
                  <span className="canvas-help">SVG or PNG under 400 KB. It gets embedded in the file — for logos, exporting the .svg and committing it renders most reliably.</span>
                </div>
              </div>

              {/* Preview + export */}
              <div className="canvas-stage">
                <div className="canvas-preview" aria-label="Live preview" dangerouslySetInnerHTML={{ __html: svg }} />
                <div className="canvas-actions">
                  <button type="button" className="btn-solid" onClick={exportSvg}>
                    <span className="material-symbols-outlined">download</span>Export to SVG
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => copyText(svg, setCopiedSvg)}>
                    <span className="material-symbols-outlined">content_copy</span>{copiedSvg ? 'Copied!' : 'Copy code'}
                  </button>
                </div>
                <div className="canvas-pipeline">
                  <span className="canvas-pipeline-title">Direct-to-GitHub</span>
                  <ol>
                    <li>In your fork, edit <code>profile/README.md</code> in the GitHub web editor.</li>
                    <li>Under <strong>@169pi — the first brick 🧱</strong>, paste the copied SVG (or reference the exported file).</li>
                    <li>Commit, then open your Pull Request.</li>
                  </ol>
                </div>
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

            <div className="platform-chips">
              <span className="platform-chip">Midjourney</span>
              <span className="platform-chip">DALL·E</span>
              <span className="platform-chip">Ideogram</span>
              <span className="platform-chip">Stable Diffusion</span>
              <a className="platform-chip platform-chip-link" href="https://playground.169pi.ai/dashboard" target="_blank" rel="noreferrer">Alpie API ↗</a>
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
