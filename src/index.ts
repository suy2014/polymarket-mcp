import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

// Tools
import { searchMarketsTool } from "./tools/search.js";
import { listEventsTool, getEventTool } from "./tools/events.js";
import { listMarketsTool, getMarketTool } from "./tools/markets.js";
import { getPricesTool, getSpreadsTool, getPriceHistoryTool } from "./tools/prices.js";
import { getOrderBookTool } from "./tools/orderbook.js";
import { getMarketHoldersTool, getLeaderboardTool } from "./tools/analytics.js";
import { listTagsTool } from "./tools/tags.js";

function createServer(): McpServer {
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

  return server;
}

// --- HTTP/SSE mode ---
async function startHttpServer() {
  const port = parseInt(process.env.PORT || "3000", 10);
  const app = express();

  // Store transports by session ID
  const sessions = new Map<string, StreamableHTTPServerTransport>();

  app.post("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Existing session
    if (sessionId && sessions.has(sessionId)) {
      const transport = sessions.get(sessionId)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // New session — create transport + server
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (id) => {
        sessions.set(id, transport);
        console.error(`Session created: ${id}`);
      },
    });

    transport.onclose = () => {
      const id = [...sessions.entries()].find(([_, t]) => t === transport)?.[0];
      if (id) {
        sessions.delete(id);
        console.error(`Session closed: ${id}`);
      }
    };

    const server = createServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  // GET for SSE stream
  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: "Invalid or missing session ID" });
      return;
    }
    const transport = sessions.get(sessionId)!;
    await transport.handleRequest(req, res);
  });

  // DELETE to close session
  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: "Invalid or missing session ID" });
      return;
    }
    const transport = sessions.get(sessionId)!;
    await transport.handleRequest(req, res);
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", sessions: sessions.size });
  });

  app.listen(port, () => {
    console.error(`Polymarket MCP server (HTTP) listening on port ${port}`);
    console.error(`  MCP endpoint: http://localhost:${port}/mcp`);
    console.error(`  Health check: http://localhost:${port}/health`);
  });
}

// --- Stdio mode ---
async function startStdioServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Polymarket MCP server (stdio) running`);
}

// --- Entry point ---
const mode = process.argv.includes("--http") || process.env.MCP_HTTP === "1" ? "http" : "stdio";

if (mode === "http") {
  startHttpServer().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
} else {
  startStdioServer().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
