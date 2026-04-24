# stubhub-tracker

Public Vercel HTML mirror of the StubHub scraper. Renders data pulled from `~/stubhub-proxy/` over Tailscale. This directory holds the canonical shared rule chain; `~/stubhub-proxy/` @imports the Tier 3 files below via absolute paths.

## Tier 3 — topic files (always loaded, shared with stubhub-proxy)

@.claude/architecture.md
@.claude/conventions.md
@.claude/gotchas.md
@.claude/workflows.md

## Tier 4 — path-scoped rules

None yet. Add `.claude/rules/*.md` with `paths:` glob frontmatter as patterns emerge (e.g. Playwright scraper conventions, Vercel config quirks, SQLite schema patterns).

## Living layer

Auto-memory is machine-local per-cwd. stubhub-tracker and stubhub-proxy each get their own memory dir under `~/.claude/projects/` (different cwds → different memory paths).

## Git

This repo has a public GitHub remote (`CWDS145/stubhub-tracker`). The mirror's `index.html`, `package.json`, `vercel.json` are git-tracked here. `.claude/*.md` are also tracked — nothing sensitive, just architectural docs.
