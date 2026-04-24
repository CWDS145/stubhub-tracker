# Conventions

## Data store
`data.db` (and any other SQLite files in `~/stubhub-proxy/`) are the scraped data store. **Never commit** them to any git repo — especially not the public `stubhub-tracker` GitHub remote.

## Schema synchronization
The mirror's `index.html` reads the proxy's output schema. **Before modifying either side, verify the schema still matches** — the two must stay in sync or the mirror breaks silently. Treat schema changes as cross-file refactors: update proxy, update mirror, test both, commit together (where they live in git).

## Secrets
- **Tailscale funnel URLs** function as unauthenticated access tokens — do not share.
- No other secrets are checked in; when credentials are needed, live in local env vars.

## Public vs private split
- `stubhub-proxy` (private, local, no git) holds the Playwright code, SQLite data, scraper logic.
- `stubhub-tracker` (public GitHub repo, deployed to Vercel) holds ONLY the static mirror. No scraping, no credentials, no data files.

If you find yourself adding scraping logic to `stubhub-tracker`, stop — that's a category error; move it to `stubhub-proxy`.

## Git
- `stubhub-tracker`: GitHub remote `CWDS145/stubhub-tracker`. Push after commits. Only the mirror files (index.html, package.json, vercel.json, this `.claude/*`) belong here — no data, no secrets.
- `stubhub-proxy`: no git repo by design (holds scraped data, secrets-adjacent). Commit history not maintained; if needed later, consider `git init` with a strict `.gitignore` for `data.db` and `.env*`.
