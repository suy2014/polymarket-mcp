// Shared types for Polymarket MCP

export interface MarketSummary {
  id: number;
  question: string;
  slug: string;
  conditionId: string;
  outcomes: string;
  outcomePrices: string;
  volume: number;
  liquidity: number;
  endDate: string;
  active: boolean;
  closed: boolean;
  description: string;
  clobTokenIds: string;
  eventSlug: string;
}

export interface EventSummary {
  id: number;
  title: string;
  slug: string;
  description: string;
  volume: number;
  liquidity: number;
  startDate: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  markets: MarketSummary[];
  tags?: TagSummary[];
}

export interface TagSummary {
  id: number;
  label: string;
  slug: string;
}

export interface OrderBookEntry {
  price: string;
  size: string;
}

export interface OrderBook {
  market: string;
  asset_id: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  tick_size: string;
  last_trade_price?: string;
}

export interface PriceHistoryPoint {
  t: number;
  p: number;
}

export interface SearchResult {
  events: any[];
  tags: any[];
  profiles: any[];
  count: number;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  username?: string;
  profileImage?: string;
  pnl: number;
  volume: number;
  marketsTraded: number;
}

export interface HolderEntry {
  address: string;
  amount: number;
  proxyWallet?: string;
}

// Formatting helpers — produce concise LLM-friendly text

export function formatMarket(m: any): string {
  const outcomes = safeParseJson(m.outcomes, []);
  const prices = safeParseJson(m.outcomePrices, []);
  const tokens = safeParseJson(m.clobTokenIds, []);

  let lines = [
    `## ${m.question || m.title || "Untitled"}`,
    `- **ID**: ${m.id} | **Slug**: ${m.slug || "N/A"}`,
    `- **Condition ID**: ${m.conditionId || "N/A"}`,
  ];

  if (outcomes.length) {
    const outcomesStr = outcomes
      .map((o: string, i: number) => {
        const price = prices[i] ? `${(parseFloat(prices[i]) * 100).toFixed(1)}%` : "N/A";
        const tokenId = tokens[i] || "";
        return `${o}: ${price}${tokenId ? ` (token: ${tokenId.slice(0, 12)}...)` : ""}`;
      })
      .join(" | ");
    lines.push(`- **Outcomes**: ${outcomesStr}`);
  }

  lines.push(
    `- **Volume**: $${formatNumber(m.volume || m.volumeNum || 0)}`,
    `- **Liquidity**: $${formatNumber(m.liquidity || m.liquidityNum || 0)}`,
    `- **Status**: ${m.closed ? "Closed" : m.active ? "Active" : "Inactive"}`,
    `- **End Date**: ${m.endDate || "N/A"}`,
  );

  if (m.description) {
    const desc = m.description.length > 300 ? m.description.slice(0, 300) + "..." : m.description;
    lines.push(`- **Description**: ${desc}`);
  }

  return lines.join("\n");
}

export function formatEvent(e: any): string {
  const lines = [
    `## ${e.title || "Untitled Event"}`,
    `- **ID**: ${e.id} | **Slug**: ${e.slug || "N/A"}`,
    `- **Volume**: $${formatNumber(e.volume || 0)}`,
    `- **Liquidity**: $${formatNumber(e.liquidity || 0)}`,
    `- **Status**: ${e.closed ? "Closed" : e.active ? "Active" : "Inactive"}`,
    `- **Start**: ${e.startDate || "N/A"} | **End**: ${e.endDate || "N/A"}`,
  ];

  if (e.description) {
    const desc = e.description.length > 300 ? e.description.slice(0, 300) + "..." : e.description;
    lines.push(`- **Description**: ${desc}`);
  }

  if (e.markets?.length) {
    lines.push(`\n### Markets (${e.markets.length}):`);
    for (const m of e.markets) {
      lines.push(formatMarket(m));
    }
  }

  return lines.join("\n");
}

export function formatNumber(n: any): string {
  const num = typeof n === "number" ? n : parseFloat(n);
  if (isNaN(num)) return "0.00";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toFixed(2);
}

export function safeParseJson(val: any, fallback: any = []): any {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
}
