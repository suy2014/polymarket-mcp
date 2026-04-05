// CLOB API Client — orderbook, prices, price history
// Base: https://clob.polymarket.com
// Public endpoints — no authentication required

const BASE = "https://clob.polymarket.com";

async function request(path: string, params?: Record<string, any>): Promise<any> {
  const url = new URL(path, BASE);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`CLOB API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function postJson(path: string, body: any): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`CLOB API POST ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// --- Midpoint prices ---

export async function getMidpoint(tokenId: string): Promise<any> {
  return request("/midpoint", { token_id: tokenId });
}

export async function getMidpoints(tokenIds: string[]): Promise<any> {
  // Use POST for multiple
  return postJson("/midpoints", tokenIds.map((t) => ({ token_id: t })));
}

// --- Spreads ---

export async function getSpread(tokenId: string): Promise<any> {
  return request("/spread", { token_id: tokenId });
}

export async function getSpreads(tokenIds: string[]): Promise<any> {
  return postJson("/spreads", tokenIds.map((t) => ({ token_id: t })));
}

// --- Last trade prices ---

export async function getLastTradePrice(tokenId: string): Promise<any> {
  return request("/last-trade-price", { token_id: tokenId });
}

// --- Order book ---

export async function getOrderBook(tokenId: string): Promise<any> {
  return request("/book", { token_id: tokenId });
}

export async function getOrderBooks(tokenIds: string[]): Promise<any> {
  return postJson("/books", tokenIds.map((t) => ({ token_id: t })));
}

// --- Prices (buy/sell) ---

export async function getPrice(tokenId: string, side: "BUY" | "SELL"): Promise<any> {
  return request("/price", { token_id: tokenId, side });
}

export async function getPrices(tokens: { token_id: string; side: string }[]): Promise<any> {
  return postJson("/prices", tokens);
}

// --- Price history ---

export async function getPriceHistory(params: {
  market: string; // token_id or condition_id
  interval?: string; // 1h, 6h, 1d, 1w, 1m, all, max
  startTs?: number;
  endTs?: number;
  fidelity?: number;
}): Promise<any> {
  // API requires fidelity param with minimum values per interval
  const defaultFidelity: Record<string, number> = {
    "1h": 5,
    "6h": 5,
    "1d": 10,
    "1w": 5,
    "1m": 10,
    "all": 20,
    "max": 20,
  };
  const interval = params.interval ?? "1d";
  const fidelity = params.fidelity ?? defaultFidelity[interval] ?? 10;

  return request("/prices-history", {
    market: params.market,
    interval,
    startTs: params.startTs,
    endTs: params.endTs,
    fidelity,
  });
}

// --- Simplified markets list ---

export async function getSimplifiedMarkets(nextCursor?: string): Promise<any> {
  return request("/sampling-simplified-markets", { next_cursor: nextCursor });
}
