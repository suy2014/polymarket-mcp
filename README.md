# Polymarket MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that provides real-time access to [Polymarket](https://polymarket.com) prediction market data. Browse, search, and analyze prediction markets directly from Claude, Cursor, or any MCP-compatible client.

**No API key required** — all endpoints are public and read-only.

## Features

- **Search** prediction markets by keyword
- **Browse** events and markets with rich filtering (category, volume, liquidity, date)
- **View** real-time outcome probabilities and market details
- **Analyze** order book depth, bid-ask spreads, and price history
- **Track** top traders on the leaderboard and top position holders

## Quick Start

### Use with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

### Use with Claude Code

```bash
claude mcp add polymarket -- npx -y polymarket-mcp
```

### Use with Cursor

Add to `.cursor/mcp.json` in your project:

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

## API Sources

This MCP server aggregates data from three Polymarket APIs:

| API | Base URL | Used For |
|-----|----------|----------|
| **Gamma API** | `gamma-api.polymarket.com` | Events, markets, tags, search |
| **CLOB API** | `clob.polymarket.com` | Order book, prices, spreads, history |
| **Data API** | `data-api.polymarket.com` | Holders, leaderboard |

## Development

```bash
# Clone
git clone https://github.com/pengfyyang/polymarket-mcp.git
cd polymarket-mcp

# Install
npm install

# Build
npm run build

# Run locally
node dist/index.js

# Watch mode
npm run dev
```

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Requirements

- **Node.js >= 18** (uses built-in `fetch`)
- No API keys needed

## License

MIT
