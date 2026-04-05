import { z } from "zod";
import { getHolders, getLeaderboard } from "../clients/data.js";
import { formatNumber } from "../utils/types.js";

export const getMarketHoldersTool = {
  name: "get_market_holders",
  description:
    "Get the top position holders for a specific Polymarket market. " +
    "Shows which addresses hold the largest positions. " +
    "Uses the market's condition_id as identifier.",
  inputSchema: z.object({
    condition_id: z.string().describe("Market condition_id (from get_market or get_event)"),
    limit: z.number().min(1).max(100).default(20).describe("Number of holders to return. Default 20"),
  }),
  async execute(args: { condition_id: string; limit?: number }) {
    const result = await getHolders(args.condition_id, args.limit ?? 20);

    // Response is [{token, holders: [...]}] array, one per token
    const lines: string[] = [`# Top Market Holders\n`];
    lines.push(`Condition ID: \`${args.condition_id}\`\n`);

    const tokenGroups = Array.isArray(result) ? result : [result];
    let hasData = false;

    for (const group of tokenGroups) {
      const holders = group?.holders ?? [];
      if (!holders.length) continue;
      hasData = true;

      const tokenShort = group.token ? `${group.token.slice(0, 12)}...` : "unknown";
      lines.push(`### Token: ${tokenShort}\n`);
      lines.push("| # | User | Amount |");
      lines.push("|---|------|--------|");
      holders.forEach((h: any, i: number) => {
        const name = h.name || h.pseudonym || `${(h.proxyWallet || "?").slice(0, 10)}...`;
        const amount = parseFloat(h.amount || 0);
        lines.push(`| ${i + 1} | ${name} | ${formatNumber(amount)} |`);
      });
      lines.push("");
    }

    if (!hasData) {
      lines.push("No holder data available.");
    }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  },
};

export const getLeaderboardTool = {
  name: "get_leaderboard",
  description:
    "Get the Polymarket trader leaderboard rankings. " +
    "Shows top traders ranked by profit (PnL) or volume. " +
    "Supports filtering by time period.",
  inputSchema: z.object({
    period: z
      .enum(["day", "week", "month", "all"])
      .default("all")
      .describe("Time period for rankings. Default 'all'"),
    sort_by: z
      .enum(["pnl", "volume"])
      .default("pnl")
      .describe("Sort by profit or volume. Default 'pnl'"),
    limit: z.number().min(1).max(100).default(20).describe("Number of results. Default 20"),
    offset: z.number().min(0).default(0).describe("Pagination offset. Default 0"),
  }),
  async execute(args: { period?: string; sort_by?: string; limit?: number; offset?: number }) {
    const result = await getLeaderboard({
      period: args.period ?? "all",
      sort_by: args.sort_by ?? "pnl",
      limit: args.limit ?? 20,
      offset: args.offset ?? 0,
    });

    const entries = Array.isArray(result) ? result : result?.leaderboard ?? result?.data ?? [];
    const lines: string[] = [
      `# Polymarket Leaderboard (${args.period || "all"} - by ${args.sort_by || "pnl"})\n`,
    ];

    if (!entries.length) {
      lines.push("No leaderboard data available.");
    } else {
      lines.push("| Rank | User | PnL | Volume |");
      lines.push("|------|------|-----|--------|");
      entries.forEach((e: any) => {
        const rank = e.rank || "?";
        const name = e.userName || e.username || e.displayName || `${(e.proxyWallet || "?").slice(0, 10)}...`;
        const pnl = e.pnl != null ? `$${formatNumber(e.pnl)}` : "N/A";
        const vol = e.vol != null ? `$${formatNumber(e.vol)}` : e.volume != null ? `$${formatNumber(e.volume)}` : "N/A";
        lines.push(`| ${rank} | ${name} | ${pnl} | ${vol} |`);
      });
    }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  },
};
