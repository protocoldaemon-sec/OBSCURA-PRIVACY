# Obscura Swap MCP (Model Context Protocol)

Production-ready MCP server and client for Obscura Swap integration with AI assistants.

## Structure

```
mcp/
├── server/          # MCP Server
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
│
└── client/          # MCP Client (for testing)
    ├── src/
    │   ├── index.ts
    │   └── test.ts
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    └── README.md
```

## Quick Start

### 1. Setup Server

```bash
cd mcp/server
pnpm install
cp .env.example .env
pnpm build
```

### 2. Setup Client (Optional - for testing)

```bash
cd mcp/client
pnpm install
cp .env.example .env
pnpm build
```

### 3. Start Backend API

```bash
cd ../../backend
pnpm dev
```

### 4. Test MCP

```bash
cd ../mcp/client
pnpm test
```

## Integration

### With Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "obscuraswap": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/server/dist/index.js"],
      "env": {
        "OBSCURA_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

### With Kiro

Add to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "obscuraswap": {
      "command": "node",
      "args": ["./mcp/server/dist/index.js"],
      "env": {
        "OBSCURA_API_URL": "http://localhost:3000"
      },
      "disabled": false,
      "autoApprove": ["get_health", "get_supported_assets"]
    }
  }
}
```

## Available Tools

1. **get_health** - Check API health
2. **get_supported_assets** - List all chains and tokens
3. **get_swap_quote** - Get best swap quote
4. **get_chain_info** - Get chain details

## Production Deployment

1. Build both server and client:
```bash
cd mcp/server && pnpm build
cd ../client && pnpm build
```

2. Update `.env` with production API URL:
```env
OBSCURA_API_URL=https://api.obscuraswap.com
```

3. Deploy server as MCP service

## Documentation

- [Server README](./server/README.md)
- [Client README](./client/README.md)

## License

MIT
