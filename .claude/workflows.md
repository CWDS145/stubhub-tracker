# Workflows

## Inspect systemd state (stubhub-proxy services)
```
systemctl --user list-units --type=service | grep -i stubhub
systemctl --user status <unit>
```
(Unit names not yet canonicalized — verify output before acting.)

## Verify Tailscale funnel
```
tailscale funnel status
```
Expected: funnel exposes `stubhub-proxy` endpoint on its public URL. If funnel is down, the mirror will serve stale data or 502.

## Schema sync check (proxy ↔ mirror)
Whenever changing the proxy's output shape:
1. Inspect current proxy output (curl the proxy endpoint from Machine 2 over Tailscale).
2. Compare against `stubhub-tracker/index.html` rendering expectations (grep for the field names the mirror reads).
3. If they diverge, update both sides in the same session.
4. Test locally before pushing the mirror to Vercel.

## Mirror deploy
`stubhub-tracker` deploys via Vercel on git push. Push to `origin main` → Vercel builds and deploys automatically.
```
git -C ~/stubhub-tracker/ add <files>
git -C ~/stubhub-tracker/ commit -m "<message>"
git -C ~/stubhub-tracker/ push origin main
```
Verify deploy in Vercel dashboard afterward.

## Local test (mirror)
`cd ~/stubhub-tracker && npm install && npm run dev` (if a `package.json` dev script exists — check there first).

## Proxy restart
If scraping stalls:
```
systemctl --user restart <unit-for-stubhub-proxy>
systemctl --user status <unit>  # confirm active
```

## Data export / backup
Scraped data lives in `~/stubhub-proxy/data.db`. For backups, copy to `/mnt/d/AI/StubHub/backups/` (the `Adjacent locations` per `.claude/architecture.md`).
