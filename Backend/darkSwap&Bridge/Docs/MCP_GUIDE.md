# Obscura Swap MCP Integration Guide

Complete guide for setting up and using the Obscura Swap MCP (Model Context Protocol) server with AI assistants.

## What is MCP?

Model Context Protocol (MCP) is a standard protocol that allows AI assistants (like Claude, ChatGPT, etc.) to interact with external tools and APIs. The Obscura Swap MCP server exposes the swap API functionality to AI assistants.

## Features

- **Health Monitoring**: Check API status
- **Asset Discovery**: Get supported chains and tokens
- **Quote Generation**: Get best swap quotes from multiple providers
- **Chain Information**: Detailed blockchain data

## Quick Setup

### 1. Install Dependencies

```bash
# From project root
cd mcp/server
pnpm install
pnpm build

cd ../client
pnpm install
pnpm build
```

Or use the setup script:

```bash
# Windows
cd mcp
pwsh setup.ps1

# Linux/Mac
cd mcp
bash setup.sh
```

### 2. Configure Environment

```bash
# mcp/server/.env
OBSCURA_API_URL=http://localhost:3000

# For production
# OBSCURA_API_URL=https://api.obscuraswap.com
```

### 3. Start Backend API

```bash
cd backend
pnpm dev
```

### 4. Test MCP

```bash
cd mcp/client
pnpm test
```

## Integration with AI Assistants

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

**Note**: Use absolute paths!

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

### Other MCP Clients

Any MCP-compatible client can use the server. Just provide:
- Command: `node`
- Args: `["/path/to/mcp/server/dist/index.js"]`
- Env: `{"OBSCURA_API_URL": "http://localhost:3000"}`

## Available Tools

### 1. get_health

Check API health status.

**Parameters**: None

**Example Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-22T10:00:00.000Z",
  "environment": "production"
}
```

**Usage with AI**:
```
Check the health of Obscura Swap API
```

### 2. get_supported_assets

Get all supported chains and tokens.

**Parameters**: None

**Example Response**:
```json
{
  "chains": [
    {
      "chainId": 1,
      "chainName": "Ethereum",
      "nativeToken": {
        "symbol": "ETH",
        "address": "0x0",
        "decimals": 18
      },
      "tokens": [
        {
          "symbol": "USDC",
          "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "decimals": 6
        }
      ]
    }
  ]
}
```

**Usage with AI**:
```
What chains and tokens does Obscura Swap support?
```

### 3. get_swap_quote

Get swap quote with best rate from multiple providers.

**Parameters**:
- `fromChainId` (number): Source chain ID (1=Ethereum, 137=Polygon, 42161=Arbitrum, 43114=Avalanche)
- `toChainId` (number): Destination chain ID
- `fromToken` (string): Source token address (use "0x0" for native token)
- `toToken` (string): Destination token address
- `amount` (string): Amount in token units (e.g., "1000000" for 1 USDC with 6 decimals)
- `userAddress` (string): User wallet address

**Example Response**:
```json
{
  "provider": "relay",
  "outputAmount": "995000",
  "inputAmount": "1000000",
  "feeUsd": 0.5,
  "slippage": 0.5,
  "estimatedTime": 180,
  "retentionRate": 0.995,
  "txCount": 1
}
```

**Usage with AI**:
```
Get me a quote to swap 1 USDC from Ethereum to Avalanche
```

### 4. get_chain_info

Get detailed information about a specific blockchain.

**Parameters**:
- `chainId` (number): Chain ID

**Example Response**:
```json
{
  "chainId": 1,
  "chainName": "Ethereum",
  "nativeToken": {
    "symbol": "ETH",
    "address": "0x0",
    "decimals": 18
  },
  "tokens": [...]
}
```

**Usage with AI**:
```
Tell me about Ethereum chain on Obscura Swap
```

## Example Conversations with AI

### Example 1: Check Health

**You**: "Check if Obscura Swap is running"

**AI**: Uses `get_health` tool and responds with status

### Example 2: Get Quote

**You**: "I want to swap 10 USDC from Polygon to Arbitrum"

**AI**: 
1. Uses `get_supported_assets` to find token addresses
2. Uses `get_swap_quote` with:
   - fromChainId: 137 (Polygon)
   - toChainId: 42161 (Arbitrum)
   - fromToken: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
   - toToken: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
   - amount: "10000000" (10 USDC)
   - userAddress: your address
3. Responds with quote details

### Example 3: Compare Chains

**You**: "Which chains support USDC?"

**AI**: Uses `get_supported_assets` and filters chains with USDC

## Testing

### Automated Tests

```bash
cd mcp/client
pnpm test
```

This runs a comprehensive test suite:
- ✅ List tools
- ✅ Health check
- ✅ Get supported assets
- ✅ Get chain info
- ✅ Get swap quote

### Manual Testing

```bash
cd mcp/client
pnpm start
```

This runs the example client with all tool demonstrations.

## Production Deployment

### 1. Build for Production

```bash
cd mcp/server
pnpm build
```

### 2. Configure Production URL

```env
OBSCURA_API_URL=https://api.obscuraswap.com
```

### 3. Deploy Options

**Option A: As MCP Service**
- Deploy to a server
- Configure AI assistants to connect to your server

**Option B: Local with Production API**
- Keep MCP server local
- Point to production API URL
- AI assistants connect to local MCP server

**Option C: Serverless**
- Deploy as serverless function
- Configure AI assistants with function URL

## Troubleshooting

### MCP Server Not Starting

**Check**:
1. Backend API is running: `curl http://localhost:3000/health`
2. Node.js version >= 18: `node --version`
3. Dependencies installed: `pnpm install`
4. Built successfully: `pnpm build`

### AI Assistant Can't Connect

**Check**:
1. Absolute path in config (not relative)
2. Path uses correct separators (Windows: `\\`, Unix: `/`)
3. MCP server is built: `mcp/server/dist/index.js` exists
4. Environment variables are set

### Quote Requests Failing

**Check**:
1. Backend API is running
2. API URL is correct in `.env`
3. External bridge providers are available (Relay.link, deBridge)

### Permission Errors

**Windows**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Linux/Mac**:
```bash
chmod +x mcp/setup.sh
```

## Architecture

```
┌─────────────────┐
│  AI Assistant   │
│ (Claude, etc.)  │
└────────┬────────┘
         │ MCP Protocol
         │
┌────────▼────────┐
│   MCP Server    │
│  (Node.js)      │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│  Backend API    │
│  (Express)      │
└────────┬────────┘
         │
┌────────▼────────┐
│  SilentSwap SDK │
│  (Bridge APIs)  │
└─────────────────┘
```

## Best Practices

1. **Keep Backend Running**: MCP server needs the backend API
2. **Use Absolute Paths**: In AI assistant configs
3. **Auto-Approve Safe Tools**: `get_health`, `get_supported_assets`
4. **Monitor Logs**: Check MCP server stderr for errors
5. **Update Regularly**: Keep MCP SDK updated

## Security

- MCP server only reads data (no write operations)
- No private keys or sensitive data exposed
- All requests go through backend API
- Rate limiting handled by backend

## Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [Obscura Swap Docs](../README.md)
- [Backend API Guide](../backend/README.md)

## Support

For issues:
1. Check [Troubleshooting](#troubleshooting)
2. Review [Backend README](../backend/README.md)
3. Check MCP server logs

## License

MIT
