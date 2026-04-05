// Data API Client — positions, holders, leaderboard
// Base: https://data-api.polymarket.com
// Public endpoints — no authentication required

const BASE = "https://data-api.polymarket.com";

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
    throw new Error(`Data API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// --- Holders ---

export async function getHolders(conditionId: string, limit = 20): Promise<any> {
  return request("/holders", {
    market: conditionId,
    limit,
  });
}

// --- Market positions ---

export async function getMarketPositions(conditionId: string, params: {
  limit?: number;
  offset?: number;
  sort_by?: string;
} = {}): Promise<any> {
  return request("/v1/market-positions", {
    condition_id: conditionId,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
    sort_by: params.sort_by,
  });
}

// --- Leaderboard ---

export async function getLeaderboard(params: {
  period?: string; // day, week, month, all
  sort_by?: string; // pnl, volume
  limit?: number;
  offset?: number;
} = {}): Promise<any> {
  return request("/v1/leaderboard", {
    period: params.period ?? "all",
    sort_by: params.sort_by ?? "pnl",
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });
}

// --- Trades (public) ---

export async function getTrades(params: {
  market?: string; // condition_id
  limit?: number;
  offset?: number;
} = {}): Promise<any> {
  return request("/trades", {
    market: params.market,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });
}
