# Architecture

## Purpose
Self-hosted scraper for StubHub listings, bypassing their WAF via Playwright. **Two-folder architecture, one logical project:** Playwright backend (stubhub-proxy) + static HTML frontend (stubhub-tracker), both bound to localhost in WSL and exposed **on the tailnet only** via `tailscale serve` on the `manoai` node — **NOT public-internet reachable**.

## Two project folders

### `~/stubhub-proxy/` (on Machine 2)
Python scraper backend. **Not a git repo.**
- `server.py` — aiohttp service exposing `GET /stubhub?eventId=<id>` on `127.0.0.1:8789`
- `collect.py` — listing collector
- `discover.py` — event/listing discovery
- `archive.py` — historical snapshot storage
- `storage.py` — SQLite persistence layer
- `data.db` — SQLite data store (**never** commit — see `.claude/conventions.md`)
- Stack: Python + aiohttp + Playwright + SQLite + systemd user units (`stubhub-proxy.service`)
- Bind: `127.0.0.1:8789` (loopback inside WSL)

### `~/stubhub-tracker/` (this folder, on Machine 2)
Static HTML frontend.
- `index.html`, `package.json`, `vercel.json` (vercel.json is historical — Vercel deployment removed 2026-04-24)
- Git remote: `https://github.com/CWDS145/stubhub-tracker` (kept for source-of-truth, not for deployment)
- Served by a tiny `python3 -m http.server` systemd unit (`stubhub-tracker.service`) on `127.0.0.1:8790`
- Renders data fetched from `/stubhub` (same-origin, served by Tailscale serve from the proxy)
- **No scraping logic lives here — frontend only.**

## Tailscale exposure (Tailnet-only, no funnel)
`tailscale serve` on the `manoai` WSL node mounts both services on `https://manoai.tail56cd31.ts.net/`:

```
https://manoai.tail56cd31.ts.net/         → openclaw-gateway (existing, not part of stubhub)
https://manoai.tail56cd31.ts.net/stubhub  → http://127.0.0.1:8789/stubhub  (proxy)
https://manoai.tail56cd31.ts.net/tracker  → http://127.0.0.1:8790          (frontend)
```

Inspect / re-add:
```bash
tailscale serve status
tailscale serve --bg --set-path=/stubhub http://127.0.0.1:8789/stubhub
tailscale serve --bg --set-path=/tracker http://127.0.0.1:8790
```

**No `tailscale funnel` is configured.** The architecture intentionally stays Tailnet-internal: only devices on the user's tailnet (machines 1 & 2 + manoai WSL + the user's phone if enrolled) can reach either URL. Public-internet visitors get DNS-resolution failure on `*.tail56cd31.ts.net`.

## Data flow
```
StubHub
  → Playwright (stubhub-proxy.service, Machine 2 WSL, 127.0.0.1:8789)
  → SQLite data.db
  → tailscale serve mount /stubhub
  → tailnet HTTPS
  → user browser (loaded from /tracker)
  → renders into HTML UI
```

The frontend `index.html` `proxyUrl` is set to `https://manoai.tail56cd31.ts.net/stubhub` (same origin as the page itself when viewed via `/tracker`). CORS is pre-configured on the proxy (`Access-Control-Allow-Origin: *`) so cross-path requests work without bypass.

## Vercel (deprecated 2026-04-24)
Previously deployed at `https://stubhub-tracker-rose.vercel.app/` for public visibility. **Removed** when the user opted for a private posture (`vercel remove stubhub-tracker --yes`). The `vercel.json` and `package.json` files remain in the folder for historical/redeploy purposes but are not currently active.

## Adjacent locations
- `/mnt/d/AI/StubHub/` — research, historical exports, scraped-data backups.
- `/mnt/d/Obsidian/Projects/Ticket Scalp/` — project notes in Obsidian (**deprecated** 2026-04-24 as the Obsidian hub retires; project tracking lives in `master-config.json.projects[stubhub_tracker]` in jcs-command).

## systemd services
- `stubhub-proxy.service` — aiohttp Playwright backend on 127.0.0.1:8789
- `stubhub-tracker.service` — static HTTP server on 127.0.0.1:8790 (`python3 -m http.server`)

Both registered in `master-config.json.projects.stubhub_tracker.manage` for one-click status + restart from the JCS Command dashboard.

```bash
systemctl --user status stubhub-proxy.service stubhub-tracker.service
```

## Rule-chain sharing
Both stubhub-proxy and stubhub-tracker load these `.claude/*.md` Tier 3 files. Proxy's `CLAUDE.md` @imports from `~/stubhub-tracker/.claude/` via absolute paths so there's a single source of truth (this folder) without duplication.
