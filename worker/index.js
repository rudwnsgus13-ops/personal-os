const cors = {
  "Access-Control-Allow-Origin": "https://rudwnsgus13-ops.github.io",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { ...cors, "Cache-Control": "no-store" } });

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "personal-os-price",
        version: "1.1",
        twelveDataConfigured: Boolean(env.TWELVE_DATA_API_KEY)
      });
    }

    if (url.pathname === "/quote") {
      const symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();
      if (!/^[A-Z0-9.:-]{1,20}$/.test(symbol)) {
        return json({ ok: false, error: "Invalid symbol" }, 400);
      }
      if (!env.TWELVE_DATA_API_KEY) {
        return json({ ok: false, error: "Price provider is not configured" }, 503);
      }

      try {
        const endpoint = new URL("https://api.twelvedata.com/price");
        endpoint.searchParams.set("symbol", symbol);
        endpoint.searchParams.set("apikey", env.TWELVE_DATA_API_KEY);

        const upstream = await fetch(endpoint.toString(), {
          headers: { "User-Agent": "Personal-OS-Price/1.1" }
        });
        const data = await upstream.json();

        if (!upstream.ok || data.status === "error" || !data.price) {
          return json({
            ok: false,
            symbol,
            error: data.message || "Quote unavailable"
          }, upstream.ok ? 502 : upstream.status);
        }

        const price = Number(data.price);
        if (!Number.isFinite(price)) {
          return json({ ok: false, symbol, error: "Invalid quote received" }, 502);
        }

        return json({
          ok: true,
          symbol,
          price,
          currency: "USD",
          provider: "Twelve Data",
          fetchedAt: new Date().toISOString()
        });
      } catch {
        return json({ ok: false, symbol, error: "Quote request failed" }, 502);
      }
    }

    return json({
      ok: true,
      service: "personal-os-price",
      message: "Price backend is ready",
      endpoints: ["/health", "/quote?symbol=TSLA"]
    });
  }
};
