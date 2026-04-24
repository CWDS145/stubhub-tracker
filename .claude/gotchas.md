# Gotchas

## Don't expose the Playwright proxy port publicly
`~/stubhub-proxy/` serves over Tailscale funnel only. Never bind to `0.0.0.0` or expose via port-forward / public hostname. StubHub's WAF will notice.

## Don't commit `data.db`
SQLite files in `~/stubhub-proxy/` hold scraped data. Committing to the public `stubhub-tracker` repo leaks data + makes the WAF situation worse. `data.db` and any `*.db`, `*.db-wal`, `*.db-shm` in either folder are never git-tracked.

## Don't share Tailscale funnel URLs
They function as unauthenticated access tokens. Anyone with the URL can hit the proxy.

## Schema drift between proxy and mirror is silent
Modifying the proxy's output schema without updating the mirror's `index.html` (or vice versa) breaks the mirror silently — no error, just missing data. Always verify both sides before shipping.

## WAF evolution
StubHub's WAF changes over time. Scraper logic in `~/stubhub-proxy/` is subject to break without notice; expect periodic selector / flow updates in `collect.py` and `discover.py`. Running behind Playwright + Tailscale funnel is the current mitigation; escalate to proxy rotation / browser fingerprint changes only if the WAF adapts further.
