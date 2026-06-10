# GOLAZO — Project Context

## What this is
A World Cup 2026 fantasy betting app. Users pick one of 5 "agent" personalities that auto-generate picks across 3 markets (result / over 2.5 / BTTS) for each match. Play-money only (1,000 coin bankroll). Friends can form leagues and compare results.

## Stack
- **Vite + React** (no router — URL params only)
- **Vercel** — hosting + serverless API routes
- **Neon Postgres** — shared league/member storage
- **`window.storage` polyfill** (in `src/main.jsx`) — routes personal state to `localStorage`, shared state to `/api/kv`

## Live URLs
- Production: https://golazo-ksxchl46g-ryonatan1-gmailcoms-projects.vercel.app
- GitHub: https://github.com/ryonatan1-afk/golazo
- Vercel project: ryonatan1-gmailcoms-projects/golazo

## Key files
| File | Purpose |
|------|---------|
| `src/App.jsx` | Entire app — component, game logic, UI |
| `src/main.jsx` | Entry point + `window.storage` polyfill |
| `api/kv.js` | Vercel serverless function — Neon-backed KV store |

## Database
- **Neon** (free tier) — single `kv` table (`key TEXT PRIMARY KEY, value TEXT`)
- Auto-created on first request (no migration needed)
- Connection string in Vercel env var `DATABASE_URL` and local `.env.local` (gitignored)
- Driver: `@neondatabase/serverless`

## Storage architecture
`window.storage` in `main.jsx` is the polyfill that replaces the original Claude artifact storage API:

| Call | `shared` param | Backend |
|------|---------------|---------|
| `loadState` / `saveState` | false | `localStorage` (per-device: step, agent, stakes, etc.) |
| `sGet` / `sSet` / `sList` | true | `/api/kv` → Neon (leagues, members, shared seed) |

## Invite links
- League invite: `?join=CODE` query param
- On load, `pendingJoin` state is read from URL
- New users → finish onboarding → auto-routed to Leagues tab → auto-joined after player card setup
- Returning users → auto-joined immediately on load

## Game data (hardcoded in App.jsx)
- 18 teams with FIFA ratings (`R` object) and flags
- 9 Matchday 1 fixtures (`MATCHES` array) — Group Stage, Jun 11–14
- 5 agent personalities: Quant, Romantic, Chalk, Degenerate, Homer
- 9 demo "friend" bots for the Bots League

## What's still TODO (not built yet)
- **Real scores** — currently uses seeded random sim (`mulberry32`). Hook up football-data.org or api-football.com to settle matches with real results
- **Realtime leaderboard** — Supabase/Neon realtime subscriptions so the table updates live on final whistle
- **Custom domain** — rename Vercel project slug or add a domain

## Common commands
```bash
npm run dev          # local dev server (localhost:5173)
vercel               # preview deploy
vercel --prod        # production deploy
```

## Env vars
- `DATABASE_URL` — Neon connection string (set in Vercel + `.env.local`)
