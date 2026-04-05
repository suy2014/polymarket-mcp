// Gamma API Client — market discovery & browsing
// Base: https://gamma-api.polymarket.com
// No authentication required

const BASE = "https://gamma-api.polymarket.com";

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
    throw new Error(`Gamma API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// --- Events ---

export async function listEvents(params: {
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  active?: boolean;
  closed?: boolean;
  tag_slug?: string;
  tag_id?: number;
  liquidity_min?: number;
  volume_min?: number;
  start_date_min?: string;
  end_date_min?: string;
} = {}): Promise<any[]> {
  return request("/events", {
    limit: params.limit ?? 10,
    offset: params.offset ?? 0,
    order: params.order ?? "volume",
    ascending: params.ascending ?? false,
    active: params.active,
    closed: params.closed,
    tag_slug: params.tag_slug,
    tag_id: params.tag_id,
    liquidity_min: params.liquidity_min,
    volume_min: params.volume_min,
    start_date_min: params.start_date_min,
    end_date_min: params.end_date_min,
  });
}

export async function getEvent(idOrSlug: string): Promise<any> {
  if (/^\d+$/.test(idOrSlug)) {
    return request(`/events/${idOrSlug}`);
  }
  return request(`/events/slug/${idOrSlug}`);
}

// --- Markets ---

export async function listMarkets(params: {
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  closed?: boolean;
  tag_id?: number;
  liquidity_num_min?: number;
  volume_num_min?: number;
  start_date_min?: string;
  end_date_min?: string;
} = {}): Promise<any[]> {
  return request("/markets", {
    limit: params.limit ?? 10,
    offset: params.offset ?? 0,
    order: params.order ?? "volume",
    ascending: params.ascending ?? false,
    closed: params.closed,
    tag_id: params.tag_id,
    liquidity_num_min: params.liquidity_num_min,
    volume_num_min: params.volume_num_min,
    start_date_min: params.start_date_min,
    end_date_min: params.end_date_min,
  });
}

export async function getMarket(idOrSlug: string): Promise<any> {
  if (/^\d+$/.test(idOrSlug)) {
    return request(`/markets/${idOrSlug}`);
  }
  return request(`/markets/slug/${idOrSlug}`);
}

// --- Tags ---

export async function listTags(params: {
  limit?: number;
  offset?: number;
} = {}): Promise<any[]> {
  return request("/tags", {
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
  });
}

// --- Search ---

export async function searchPublic(params: {
  query: string;
  limit_per_type?: number;
  events_status?: string;
  sort?: string;
  ascending?: boolean;
}): Promise<any> {
  return request("/public-search", {
    q: params.query,
    limit_per_type: params.limit_per_type ?? 5,
    events_status: params.events_status,
    sort: params.sort,
    ascending: params.ascending,
  });
}
