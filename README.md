# Preptember — 169Pi × Hacktoberfest

Beginner landing page for making a first open-source contribution to `169Pi/Alpie-Core`.

## Stack

- Next.js 14 (App Router, JS)
- Deployed on Vercel
- Live GitHub stats via public REST API
- GitHub OAuth for star/fork/PR auto-detect
- Alpie chat + Wall of Fame drafter via server-side proxy (`/api/alpie`)

## Local dev

```bash
cd preptember
cp .env.example .env.local
# fill in the values (see below)
npm install
npm run dev
# → http://localhost:3001
```

## Environment variables

See `.env.example`. All of them are required for full functionality:

| Var | Where to get it |
|---|---|
| `ALPIE_API_BASE` | Alpie API base URL (e.g. `https://api.alpie.ai/v1`) |
| `ALPIE_API_KEY` | Alpie API key |
| `ALPIE_MODEL` | Model name (default `alpie-core`) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Register at https://github.com/settings/developers → New OAuth App |
| `GITHUB_REDIRECT_URI` | Must match the OAuth app's "Authorization callback URL" exactly |
| `GITHUB_OWNER` / `GITHUB_REPO` | Defaults to `169Pi` / `Alpie-Core` |
| `SESSION_SECRET` | Any 32+ char random string |

### Registering the GitHub OAuth app

1. Go to https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. **Application name**: `Preptember (169Pi)`
3. **Homepage URL**: your Vercel URL (e.g. `https://preptember-169pi.vercel.app`) — use `http://localhost:3001` for local
4. **Authorization callback URL**: `https://<your-vercel-url>/api/auth/callback` (also add a second app for `http://localhost:3001/api/auth/callback` if you want local login)
5. Copy the **Client ID** and generate a **Client secret** — paste both into `.env.local` (and into Vercel Project Settings → Environment Variables for production)

## Deploy to Vercel

1. Push this repo to GitHub
2. Vercel → **New Project** → import the repo
3. **Root Directory**: `preptember`
4. Add all env vars from `.env.example` under **Environment Variables**
5. Deploy. Note the URL — update `GITHUB_REDIRECT_URI` and the OAuth app callback to match, then redeploy.

## What the page does

- Live star count, PR count, contributor count from `169Pi/Alpie-Core`
- Recent PRs feed (public API)
- 7-step first-contribution walkthrough with expandable help
- Progress persisted in `localStorage`
- Sign in with GitHub → auto-ticks Star / Fork / PR / Merged
- Countdown to October 1
- "Ask Alpie" chat, proxied server-side
- "Draft it with Alpie" — form → Markdown block for the README Wall of Fame
