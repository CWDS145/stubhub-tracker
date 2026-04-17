export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const eventId = req.query.eventId;
  if (!eventId) return res.status(400).json({ error: "eventId required" });

  try {
    const pageRes = await fetch(`https://www.stubhub.com/event/${eventId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!pageRes.ok) {
      return res.status(502).json({
        error: "StubHub fetch failed",
        upstreamStatus: pageRes.status,
      });
    }

    const html = await pageRes.text();
    const match = html.match(
      /<script id="index-data" type="application\/json">\s*(\{[\s\S]*?\})\s*<\/script>/
    );
    if (!match) {
      return res.status(502).json({
        error: "index-data script not found",
        hint: "StubHub page structure may have changed, or bot protection triggered",
        htmlSize: html.length,
        htmlPreview: html.slice(0, 2000),
        upstreamHeaders: {
          server: pageRes.headers.get("server"),
          cfRay: pageRes.headers.get("cf-ray"),
          xCache: pageRes.headers.get("x-cache"),
          contentType: pageRes.headers.get("content-type"),
        },
      });
    }

    const data = JSON.parse(match[1]);
    const grid = data.grid || {};
    const items = grid.items || [];

    const listings = items.map((it) => ({
      section: it.sectionMapName || it.section || "?",
      row: it.rowContent || it.row || "?",
      price: it.rawPrice || 0,
      quantity: it.availableTickets || 0,
      listingId: it.id || null,
      ticketClass: it.ticketClassName || null,
    }));

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      eventId,
      eventName: data.eventName || null,
      totalListings: grid.totalCount ?? grid.totalFilteredListings ?? 0,
      totalListingsAllQty: data.totalListings ?? null,
      totalTickets: data.availableTickets ?? 0,
      minPrice: grid.lowPrice || 0,
      maxPrice: grid.highPrice || 0,
      formattedMinPrice: grid.formattedMinPrice || null,
      formattedMaxPrice: grid.formattedMaxPrice || null,
      cheapestTickets: grid.xTicketsAtCheapestPrice || 0,
      pageSize: grid.pageSize || 0,
      listings,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
