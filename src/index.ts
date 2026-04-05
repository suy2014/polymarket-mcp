import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Tools
import { searchMarketsTool } from "./tools/search.js";
import { listEventsTool, getEventTool } from "./tools/events.js";
import { listMarketsTool, getMarketTool } from "./tools/markets.js";
import { getPricesTool, getSpreadsTool, getPriceHistoryTool } from "./tools/prices.js";
import { getOrderBookTool } from "./tools/orderbook.js";
import { getMarketHoldersTool, getLeaderboardTool } from "./tools/analytics.js";
import { listTagsTool } from "./tools/tags.js";

const server = new McpServer({
  name: "polymarket-mcp",
  version: "1.0.0",
  description:
    "Polymarket prediction market data server. " +
    "Browse, search, and analyze prediction markets on Polymarket. " +
    "Provides real-time probabilities, orderbooks, price history, and trader analytics. " +
    "No authentication required — read-only access to public market data.",
});

// Register all tools
const tools = [
  searchMarketsTool,
  listEventsTool,
  getEventTool,
  listMarketsTool,
  getMarketTool,
  getPricesTool,
  getSpreadsTool,
  getPriceHistoryTool,
  getOrderBookTool,
  getMarketHoldersTool,
  getLeaderboardTool,
  listTagsTool,
];

for (const tool of tools) {
  server.tool(tool.name, tool.description, tool.inputSchema.shape, tool.execute);
}

// Start
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Polymarket MCP server running (${tools.length} tools registered)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
