import { z } from "zod";
import { searchPublic } from "../clients/gamma.js";

export const searchMarketsTool = {
  name: "search_markets",
  description:
    "Search Polymarket for markets, events, and profiles by keyword. " +
    "Use this to find prediction markets on any topic (elections, crypto, sports, AI, etc). " +
    "Returns matching events with their markets and current probability prices.",
  inputSchema: z.object({
    query: z.string().describe("Search keyword, e.g. 'Trump', 'Bitcoin', 'AI'"),
    limit: z
      .number()
      .min(1)
      .max(20)
      .default(5)
      .describe("Max results per type (events/tags/profiles). Default 5"),
    status: z
      .enum(["active", "closed", "all"])
      .default("active")
      .describe("Filter by event status. Default 'active'"),
    sort: z
      .string()
      .optional()
      .describe("Sort field, e.g. 'volume', 'liquidity', 'start_date'"),
  }),
  async execute(args: { query: string; limit?: number; status?: string; sort?: string }) {
    const result = await searchPublic({
      query: args.query,
      limit_per_type: args.limit ?? 5,
      events_status: args.status ?? "active",
      sort: args.sort,
    });

    // Format for LLM
    const events = result?.events ?? result ?? [];
    if (!Array.isArray(events) || events.length === 0) {
      return { content: [{ type: "text" as const, text: `No results found for "${args.query}".` }] };
    }

    const lines: string[] = [`# Search Results for "${args.query}"\n`];
    for (const evt of events.slice(0, 10)) {
      lines.push(`## ${evt.title || evt.question || "Untitled"}`);
      lines.push(`- Slug: ${evt.slug || "N/A"}`);
      if (evt.markets?.length) {
        for (const m of evt.markets) {
          const outcomes = safeJson(m.outcomes);
          const prices = safeJson(m.outcomePrices);
          const prob = outcomes
            .map((o: string, i: number) => {
              const p = prices[i] ? `${(parseFloat(prices[i]) * 100).toFixed(1)}%` : "?";
              return `${o}: ${p}`;
            })
            .join(" | ");
          lines.push(`  - **${m.question || m.groupItemTitle || ""}**: ${prob}`);
          lines.push(`    Volume: $${fmtNum(m.volume || m.volumeNum || 0)} | Liquidity: $${fmtNum(m.liquidity || m.liquidityNum || 0)}`);
          if (m.conditionId) lines.push(`    Condition ID: ${m.conditionId}`);
        }
      }
      lines.push("");
    }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  },
};

function safeJson(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") try { return JSON.parse(v); } catch { return []; }
  return [];
}
function fmtNum(n: any): string {
  const num = typeof n === "number" ? n : parseFloat(n);
  if (isNaN(num)) return "0.00";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toFixed(2);
}
