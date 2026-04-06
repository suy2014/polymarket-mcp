# Polymarket MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that provides real-time access to [Polymarket](https://polymarket.com) prediction market data. Browse, search, and analyze prediction markets directly from Claude, Cursor, or any MCP-compatible client.

**No API key required** — all endpoints are public and read-only.

## Features

- **Search** prediction markets by keyword
- **Browse** events and markets with rich filtering (category, volume, liquidity, date)
- **View** real-time outcome probabilities and market details
- **Analyze** order book depth, bid-ask spreads, and price history
- **Track** top traders on the leaderboard and top position holders

---

## Quick Start

### Option 1: Local (stdio mode)

Use with **Claude Desktop** — add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "npx",
      "args": ["-y", "polymarket-mcp"]
    }
  }
}
```

Use with **Claude Code**:

```bash
claude mcp add polymarket -- npx -y polymarket-mcp
```

Use with **Cursor** — add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "npx",
      "args": ["-y", "polymarket-mcp"]
    }
  }
}
```

### Option 2: Remote Server (HTTP mode)

If you have a server running the MCP HTTP service, connect via URL:

```json
{
  "mcpServers": {
    "polymarket": {
      "url": "http://YOUR_SERVER_IP:3000/mcp"
    }
  }
}
```

Or with Cloudflare Tunnel:

```json
{
  "mcpServers": {
    "polymarket": {
      "url": "https://your-tunnel-domain.trycloudflare.com/mcp"
    }
  }
}
```

---

## Server Deployment

### 1. Install & Build

```bash
git clone https://github.com/suy2014/polymarket-mcp.git
cd polymarket-mcp
npm install
npm run build
```

### 2. Run

**Stdio mode** (for local use):

```bash
node dist/index.js
```

**HTTP mode** (for remote access):

```bash
# Default port 3000
node dist/index.js --http

# Custom port
PORT=8080 node dist/index.js --http

# Or use environment variable
MCP_HTTP=1 PORT=3000 node dist/index.js
```

### 3. Production (pm2)

```bash
npm install -g pm2
PORT=3000 pm2 start dist/index.js --name polymarket-mcp -- --http
pm2 save
pm2 startup   # auto-start on reboot
```

### 4. Expose via Cloudflare Tunnel (optional)

If your server is behind a firewall or doesn't have a domain:

```bash
# Install cloudflared
curl -L -o cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared

# Create tunnel (generates a public URL)
./cloudflared tunnel --url http://localhost:3000
# Output: https://xxx-xxx.trycloudflare.com
```

Users can then connect with the tunnel URL:

```json
{
  "mcpServers": {
    "polymarket": {
      "url": "https://xxx-xxx.trycloudflare.com/mcp"
    }
  }
}
```

### 5. Health Check

```bash
curl http://localhost:3000/health
# {"status":"ok","sessions":0}
```

---

## Available Tools (12)

### Discovery & Search

| Tool | Description |
|------|-------------|
| `search_markets` | Search markets/events by keyword (e.g. "Trump", "Bitcoin", "AI") |
| `list_events` | Browse events with filtering by tag, volume, liquidity, status |
| `list_markets` | Browse individual markets with sorting and filtering |
| `list_tags` | List all category tags (politics, crypto, sports, etc.) |

### Market Details

| Tool | Description |
|------|-------------|
| `get_event` | Get event details with all associated markets and probabilities |
| `get_market` | Get single market details including condition ID and token IDs |

### Pricing & Order Book

| Tool | Description |
|------|-------------|
| `get_prices` | Get current midpoint prices (probabilities) for tokens |
| `get_spreads` | Get bid-ask spreads to assess liquidity |
| `get_price_history` | Get historical price data (1h/6h/1d/1w/1m/all intervals) |
| `get_orderbook` | Get full order book with bid/ask depth |

### Analytics

| Tool | Description |
|------|-------------|
| `get_market_holders` | Top position holders for a market |
| `get_leaderboard` | Trader rankings by PnL or volume |

---

## Example Conversations

**"What are the hottest prediction markets right now?"**
→ Calls `list_events` sorted by volume

**"What's the probability of Bitcoin reaching $200k?"**
→ Calls `search_markets` with query "Bitcoin 200k"

**"Show me the price history for this market over the past week"**
→ Calls `get_price_history` with interval "1w"

**"How liquid is this market? Show me the order book"**
→ Calls `get_orderbook` + `get_spreads`

**"Who are the top traders on Polymarket?"**
→ Calls `get_leaderboard` sorted by PnL

---

## Tool Workflow

Most analysis flows follow this pattern:

```
search_markets / list_events     →  Find markets of interest
        ↓
get_event / get_market           →  Get details (condition_id, clobTokenIds)
        ↓
get_prices / get_price_history   →  Current & historical probabilities
get_orderbook / get_spreads      →  Liquidity analysis
get_market_holders               →  Position analysis
```

> **Key identifiers**: `condition_id` is used for price history and holders. `clobTokenIds` are used for prices, spreads, and order books. Both come from `get_market` or `get_event` responses.

---

## API Sources

| API | Base URL | Used For |
|-----|----------|----------|
| **Gamma API** | `gamma-api.polymarket.com` | Events, markets, tags, search |
| **CLOB API** | `clob.polymarket.com` | Order book, prices, spreads, history |
| **Data API** | `data-api.polymarket.com` | Holders, leaderboard |

## Requirements

- **Node.js >= 18** (uses built-in `fetch`)
- No API keys needed

## Development

```bash
git clone https://github.com/suy2014/polymarket-mcp.git
cd polymarket-mcp
npm install
npm run build
npm run dev    # watch mode
```

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## License

MIT
