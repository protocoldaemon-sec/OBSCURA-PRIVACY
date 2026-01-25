# MCP Quick Start

Get the Obscura Swap MCP server running in 5 minutes.

## Prerequisites

- Node.js 18+
- pnpm installed
- Obscura Swap backend running

## Setup (3 Steps)

### 1. Install & Build

```bash
# Windows
cd mcp
pwsh setup.ps1

# Linux/Mac
cd mcp
bash setup.sh
```

### 2. Start Backend

```bash
cd backend
pnpm dev
```

### 3. Test MCP

```bash
cd mcp/client
pnpm test
```

## Expected Output

```
🧪 Obscura Swap MCP Client Test Suite
═══════════════════════════════════════════════════════

📡 Connecting to MCP Server...
✅ Connected

🧪 Test 1: List Tools
✅ Found 4 tools:
   - get_health
   - get_supported_assets
   - get_swap_quote
   - get_chain_info

🧪 Test 2: Health Check
✅ Status: ok
   Environment: development

🧪 Test 3: Get Supported Assets
✅ Found 5 chains:
   - Ethereum (1): 3 tokens
   - Polygon (137): 2 tokens
   - Arbitrum (42161): 2 tokens
   - Avalanche (43114): 2 tokens
   - Solana: 2 tokens

✅ All tests completed successfully!
```

## Use with AI Assistants

### Claude Desktop

Edit config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add:
```json
{
  "mcpServers": {
    "obscuraswap": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\Documents\\ObscuraSwap\\mcp\\server\\dist\\index.js"],
      "env": {
        "OBSCURA_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

**Important**: Use absolute path!

### Kiro IDE

Create `.kiro/settings/mcp.json`:

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

## Try It Out

Ask your AI assistant:

```
Check if Obscura Swap is running
```

```
What chains does Obscura Swap support?
```

```
Get me a quote to swap 1 USDC from Ethereum to Avalanche
```

## Troubleshooting

### Server Won't Start

1. Check backend is running: `curl http://localhost:3000/health`
2. Rebuild: `cd mcp/server && pnpm build`
3. Check Node version: `node --version` (need 18+)

### AI Can't Connect

1. Use absolute path in config
2. Check file exists: `mcp/server/dist/index.js`
3. Restart AI assistant

### Quote Fails

This is normal if external bridge providers are unavailable. The health check and asset listing should still work.

## Next Steps

- Read [MCP_GUIDE.md](../Docs/MCP_GUIDE.md) for detailed documentation
- Explore [server/README.md](./server/README.md) for server details
- Check [client/README.md](./client/README.md) for client usage

## Support

- [Full MCP Guide](../Docs/MCP_GUIDE.md)
- [Backend README](../backend/README.md)
- [Main Documentation](../Docs/DOCUMENTATION_INDEX.md)
