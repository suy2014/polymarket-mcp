import { z } from "zod";
import { getOrderBook } from "../clients/clob.js";

export const getOrderBookTool = {
  name: "get_orderbook",
  description:
    "Get the order book (bid/ask depth) for a specific Polymarket token. " +
    "Shows the buy orders (bids) and sell orders (asks) with price and size. " +
    "Token ID can be found in market details (clobTokenIds field). " +
    "Useful for understanding market depth and liquidity.",
  inputSchema: z.object({
    token_id: z.string().describe("CLOB token ID (from market's clobTokenIds)"),
    depth: z
      .number()
      .min(1)
      .max(50)
      .default(10)
      .describe("Number of price levels to show per side. Default 10"),
  }),
  async execute(args: { token_id: string; depth?: number }) {
    const book = await getOrderBook(args.token_id);
    const depth = args.depth ?? 10;

    const lines: string[] = ["# Order Book\n"];
    lines.push(`Token: \`${args.token_id.slice(0, 20)}...\``);

    if (book.last_trade_price) {
      lines.push(`Last Trade Price: **${(parseFloat(book.last_trade_price) * 100).toFixed(1)}%**`);
    }
    if (book.tick_size) {
      lines.push(`Tick Size: ${book.tick_size}`);
    }

    // Calculate midpoint and spread from top of book
    const topBid = book.bids?.[0] ? parseFloat(book.bids[0].price) : 0;
    const topAsk = book.asks?.[0] ? parseFloat(book.asks[0].price) : 0;
    if (topBid && topAsk) {
      const mid = ((topBid + topAsk) / 2 * 100).toFixed(2);
      const spread = ((topAsk - topBid) * 100).toFixed(2);
      lines.push(`Midpoint: **${mid}%** | Spread: **${spread}%**`);
    }
    lines.push("");

    // Bids
    const bids = (book.bids || []).slice(0, depth);
    lines.push(`### Bids (${bids.length} levels shown)`);
    lines.push("| Price | Size |");
    lines.push("|-------|------|");
    for (const b of bids) {
      lines.push(`| ${(parseFloat(b.price) * 100).toFixed(1)}% | ${parseFloat(b.size).toFixed(2)} |`);
    }
    lines.push("");

    // Asks
    const asks = (book.asks || []).slice(0, depth);
    lines.push(`### Asks (${asks.length} levels shown)`);
    lines.push("| Price | Size |");
    lines.push("|-------|------|");
    for (const a of asks) {
      lines.push(`| ${(parseFloat(a.price) * 100).toFixed(1)}% | ${parseFloat(a.size).toFixed(2)} |`);
    }

    // Total depth
    const totalBidSize = bids.reduce((s: number, b: any) => s + parseFloat(b.size), 0);
    const totalAskSize = asks.reduce((s: number, a: any) => s + parseFloat(a.size), 0);
    lines.push("");
    lines.push(`**Bid depth**: ${totalBidSize.toFixed(2)} | **Ask depth**: ${totalAskSize.toFixed(2)}`);

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  },
};
