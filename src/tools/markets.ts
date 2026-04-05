import { z } from "zod";
import { listMarkets, getMarket } from "../clients/gamma.js";
import { formatMarket } from "../utils/types.js";

export const listMarketsTool = {
  name: "list_markets",
  description:
    "Browse Polymarket individual markets with filtering and sorting. " +
    "Each market is a single yes/no (or multi-outcome) prediction question. " +
    "Supports filtering by volume, liquidity, tag, and date range.",
  inputSchema: z.object({
    limit: z.number().min(1).max(50).default(10).describe("Number of markets to return. Default 10"),
    offset: z.number().min(0).default(0).describe("Pagination offset. Default 0"),
    order: z
      .enum(["volume", "liquidity", "startDate", "endDate", "createdAt"])
      .default("volume")
      .describe("Sort field. Default 'volume'"),
    ascending: z.boolean().default(false).describe("Sort ascending. Default false"),
    closed: z.boolean().optional().describe("Filter by closed status"),
    tag_id: z.number().optional().describe("Filter by tag ID"),
    liquidity_num_min: z.number().optional().describe("Minimum liquidity in USD"),
    volume_num_min: z.number().optional().describe("Minimum volume in USD"),
  }),
  async execute(args: any) {
    const markets = await listMarkets(args);
    if (!markets?.length) {
      return { content: [{ type: "text" as const, text: "No markets found matching the criteria." }] };
    }

    const lines: string[] = [`# Polymarket Markets (${markets.length} results)\n`];
    for (const m of markets) {
      lines.push(formatMarket(m));
      lines.push("---");
    }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  },
};

export const getMarketTool = {
  name: "get_market",
  description:
    "Get detailed information about a specific Polymarket market by ID or slug. " +
    "Returns question, current outcome probabilities, volume, liquidity, description, " +
    "condition ID, and CLOB token IDs (needed for price/orderbook queries).",
  inputSchema: z.object({
    market: z.string().describe("Market ID (numeric) or slug (e.g. 'will-bitcoin-reach-100k')"),
  }),
  async execute(args: { market: string }) {
    const market = await getMarket(args.market);
    if (!market) {
      return { content: [{ type: "text" as const, text: `Market "${args.market}" not found.` }] };
    }
    return { content: [{ type: "text" as const, text: formatMarket(market) }] };
  },
};
