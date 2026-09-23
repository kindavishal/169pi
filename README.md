# Preptember — 169Pi × Hacktoberfest

Beginner landing page that walks people through their first open-source contribution: adding an entry to the **"Make this README yours"** section of [`169Pi/.github`](https://github.com/169Pi/.github)'s `profile/README.md`.

Live at **https://169pi-kappa.vercel.app**

## Stack

- Next.js 16 (App Router, JavaScript)
- Deployed on Vercel
- Live GitHub stats via the public REST API
- GitHub OAuth for sign-in and star auto-detection
- Alpie chat and entry drafter via a server-side proxy (`/api/alpie`)

## Local dev

```bash
cp .env.example .env.local
# fill in the values (see below)
npm install
npm run dev
# → http://localhost:3001
```

## Environment variables

See `.env.example` for the full list with defaults.

| Var | Required | What it does |
|---|---|---|
| `ALPIE_API_BASE` / `ALPIE_API_KEY` | Yes | Alpie API endpoint and key for chat and the drafter |
| `ALPIE_MODEL` | No | Model name (default `alpie-core`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Yes | From your GitHub OAuth app (see below) |
| `GITHUB_REDIRECT_URI` | Yes | Must exactly match the OAuth app's callback URL |
| `SESSION_SECRET` | Yes | Signs the session cookie. Use a long random string (`openssl rand -base64 32`) |
| `GITHUB_TOKEN` | No | Raises the stats rate limit from 60/hr to 5,000/hr |
| `NEXT_PUBLIC_SITE_URL` | No | Base URL for link previews. Defaults to the Vercel production domain |
| `NEXT_PUBLIC_DISCORD_URL` | No | Discord invite used across the page |
| `GITHUB_STARS_*`, `GITHUB_STATS_*`, `GITHUB_PROFILE_*`, `NEXT_PUBLIC_GITHUB_*` | No | Override which repos the page tracks (see below) |

### Which repo is used for what

| Data | Repo |
|---|---|
| Star count, "Star" step, star auto-check | `169Pi/Alpie-Core` |
| PR count, contributor leaderboard | `169Pi/.github` |
| Fork and PR steps | `169Pi/.github` |

### Registering the GitHub OAuth app

1. Go to https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. **Application name**: `Preptember (169Pi)`
3. **Homepage URL**: `https://169pi-kappa.vercel.app`
4. **Authorization callback URL**: `https://169pi-kappa.vercel.app/api/auth/callback`
5. Copy the **Client ID**, generate a **Client secret**, and add both to Vercel → Project Settings → Environment Variables

An OAuth app allows only one callback URL, so for local sign-in register a second app with `http://localhost:3001` as the homepage and `http://localhost:3001/api/auth/callback` as the callback, and put its credentials in `.env.local`.

## Deploy to Vercel

1. Import the repo in Vercel (the project root is the repo root)
2. Add the environment variables from `.env.example`
3. Deploy, then confirm the OAuth app callback matches `GITHUB_REDIRECT_URI`

## What the page does

- Live star count (Alpie-Core), PR count and contributor count (`.github`)
- Contributor leaderboard, with bots and AI accounts filtered out
- 7-step first-contribution walkthrough with expandable help and "before you PR" rules
- Progress saved in `localStorage`
- Sign in with GitHub, which auto-ticks the Star step
- Countdown to October 1 and the next bi-weekly merge date
- "Try Alpie-Core" links to Hugging Face, Ollama, Kaggle and the docs
- Floating "Ask Alpie" chat, proxied server-side
- "Draft it with Alpie": a form that returns a Markdown entry for `profile/README.md`
- Favicons, web manifest and link-preview image
