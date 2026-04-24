# Architecture

## Purpose
Self-hosted scraper for StubHub listings, bypassing their WAF via Tailscale funnel. **Two-folder architecture, one logical project:** private Playwright backend on Machine 2 + public static mirror on Vercel.

## Two project folders

### `~/stubhub-proxy/` (on Machine 2)
Python scraper backend. **Not a git repo.**
- `server.py` — main service (FastAPI/uvicorn, TBC)
- `collect.py` — listing collector
- `discover.py` — event/listing discovery
- `archive.py` — historical snapshot storage
- `storage.py` — SQLite persistence layer
- `data.db` — SQLite data store (**never** commit — see `.claude/conventions.md`)
- Stack: Python + Playwright + SQLite + systemd user units
- Exposed externally via Tailscale funnel

### `~/stubhub-tracker/` (this folder, on Machine 2)
Public Vercel HTML mirror.
- `index.html`, `package.json`, `vercel.json`
- Git remote: `https://github.com/CWDS145/stubhub-tracker`
- Renders data pulled from the proxy over Tailscale
- **No scraping logic lives here — mirror only.**

## Data flow
```
StubHub → Playwright (stubhub-proxy, Machine 2)
        → SQLite data.db
        → Tailscale funnel
        → Vercel static mirror (stubhub-tracker)
        → user browser
```

## Adjacent locations
- `/mnt/d/AI/StubHub/` — research, historical exports, scraped-data backups.
- `/mnt/d/Obsidian/Projects/Ticket Scalp/` — project notes in Obsidian (**deprecated** 2026-04-24 as the Obsidian hub retires; project tracking migrates to `master-config.json.projects` in jcs-command).

## systemd services
Unit names not yet canonicalized. Inspect:
```
systemctl --user list-units --type=service | grep -i stubhub
systemctl --user status <unit-found-above>
```
When unit names are pinned, list them here and in `.claude/workflows.md`.

## Rule-chain sharing
Both stubhub-proxy and stubhub-tracker load these `.claude/*.md` Tier 3 files. Proxy's `CLAUDE.md` @imports from `~/stubhub-tracker/.claude/` via absolute paths so there's a single source of truth (this folder) without duplication.
