# Forza League

A self-hosted race tracker for four friends running 2v2 Forza seasons.

## What's in the box

- **Permanent teams.** Two pairs, locked in once.
- **Seasons.** Each season has its own points scheme (default `4-3-2-1`) and standings.
- **Manual race logging.** Pick a track, set finishing positions, optionally drop in a screenshot.
- **Team-first stats.** Big scoreboard up top; drill into team or driver pages for depth.
- **All-time + per-season views.** Head-to-head, win counts, position breakdowns, best track, etc.

No accounts. No external APIs. Data lives in a single SQLite file plus screenshots on disk.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. First visit walks you through naming the four drivers and pairing them into two teams.

## Deploy with a persistent disk

The app reads/writes everything under `data/` (SQLite at `data/forza.db`, screenshots in `data/uploads/`). On Railway/Render/Fly.io, mount a persistent volume to that directory, or set `FORZA_DATA_DIR` to point at the mount path.

Example for Railway:
1. Create a service from the repo.
2. Add a Volume mounted at `/app/data`.
3. Deploy.

That's it — your standings persist across deploys.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · better-sqlite3.
