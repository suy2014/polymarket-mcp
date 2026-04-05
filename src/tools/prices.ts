import { z } from "zod";
import { getMidpoints, getSpreads, getPriceHistory } from "../clients/clob.js";
import { formatNumber } from "../utils/types.js";

export const getPricesTool = {
  name: "get_prices",
  description:
    "Get current midpoint prices for one or more Polymarket tokens. " +
    "Token IDs can be found in market details (clobTokenIds field). " +
    "Returns the current probability price (0-1) for each token.",
  inputSchema: z.object({
    token_ids: z
      .array(z.string())
      .min(1)
      .max(100)
      .describe("Array of CLOB token IDs to get prices for"),
  }),
  async execute(args: { token_ids: string[] }) {
    const result = await getMidpoints(args.token_ids);
    const lines: string[] = ["# Current Midpoint Prices\n"];

    if (typeof result === "object" && result !== null) {
      for (const [tokenId, price] of Object.entries(result)) {
        const pct = price ? `${(parseFloat(price as string) * 100).toFixed(1)}%` : "N/A";
        lines.push(`- Token \`${tokenId.slice(0, 16)}...\`: **${pct}** (${price})`);
      }
    } else {
      lines.push(`Raw result: ${JSON.stringify(result)}`);
    }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  },
};

export const getSpreadsTool = {
  name: "get_spreads",
  description:
    "Get bid-ask spreads for one or more Polymarket tokens. " +
    "Spread indicates the difference between the best buy and sell prices. " +
    "Lower spread = more liquid market.",
  inputSchema: z.object({
    token_ids: z
      .array(z.string())
      .min(1)
      .max(100)
      .describe("Array of CLOB token IDs"),
  }),
  async execute(args: { token_ids: string[] }) {
    const result = await getSpreads(args.token_ids);
    const lines: string[] = ["# Bid-Ask Spreads\n"];

    if (typeof result === "object" && result !== null) {
      for (const [tokenId, spread] of Object.entries(result)) {
        lines.push(`- Token \`${tokenId.slice(0, 16)}...\`: spread = **${spread}**`);
      }
    } else {
      lines.push(`Raw result: ${JSON.stringify(result)}`);
    }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  },
};

export const getPriceHistoryTool = {
  name: "get_price_history",
  description:
    "Get historical price data for a Polymarket market. " +
    "Use a CLOB token_id (from market's clobTokenIds) as the market parameter. " +
    "Returns time series of prices showing how probability changed over time.",
  inputSchema: z.object({
    market: z.string().describe("CLOB token_id (from market's clobTokenIds field)"),
    interval: z
      .enum(["1h", "6h", "1d", "1w", "1m", "all", "max"])
      .default("1d")
      .describe("Time interval. Default '1d'. Use 'all' or 'max' for full history"),
    startTs: z.number().optional().describe("Start timestamp (Unix seconds)"),
    endTs: z.number().optional().describe("End timestamp (Unix seconds)"),
    fidelity: z.number().optional().describe("Number of data points to return"),
  }),
  async execute(args: {
    market: string;
    interval?: string;
    startTs?: number;
    endTs?: number;
    fidelity?: number;
  }) {
    const result = await getPriceHistory({
      market: args.market,
      interval: args.interval ?? "1d",
      startTs: args.startTs,
      endTs: args.endTs,
      fidelity: args.fidelity,
    });

    const lines: string[] = [`# Price History (interval: ${args.interval || "1d"})\n`];
    lines.push(`Market (condition_id): ${args.market}\n`);

    const history = result?.history ?? result;
    if (Array.isArray(history) && history.length > 0) {
      lines.push(`Data points: ${history.length}\n`);

      // Show summary: first, last, min, max
      const prices = history.map((p: any) => parseFloat(p.p ?? p.price ?? 0));
      const first = prices[0];
      const last = prices[prices.length - 1];
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      lines.push(`| Metric | Value |`);
      lines.push(`|--------|-------|`);
      lines.push(`| First | ${(first * 100).toFixed(1)}% |`);
      lines.push(`| Last | ${(last * 100).toFixed(1)}% |`);
      lines.push(`| Min | ${(min * 100).toFixed(1)}% |`);
      lines.push(`| Max | ${(max * 100).toFixed(1)}% |`);
      lines.push(`| Change | ${((last - first) * 100).toFixed(1)}pp |`);
      lines.push("");

      // Show last 20 data points
      const tail = history.slice(-20);
      lines.push("### Recent data points:");
      for (const point of tail) {
        const ts = point.t ?? point.timestamp;
        const price = point.p ?? point.price;
        const date = ts ? new Date(ts * 1000).toISOString().slice(0, 16) : "?";
        lines.push(`- ${date}: ${(parseFloat(price) * 100).toFixed(1)}%`);
      }
    } else {
      lines.push("No price history data available.");
    }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  },
};
