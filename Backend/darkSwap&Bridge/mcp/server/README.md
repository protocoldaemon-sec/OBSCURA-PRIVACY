# Obscura Swap MCP Server

Model Context Protocol (MCP) server for Obscura Swap - enables AI assistants to interact with the Obscura Swap API.

## Features

- **Health Check**: Monitor API status
- **Asset Discovery**: Get supported chains and tokens
- **Quote Generation**: Get best swap quotes from multiple providers
- **Chain Information**: Detailed blockchain information

## Installation

```bash
cd mcp/server
pnpm install
pnpm build
```

## Configuration

Create `.env` file:

```env
OBSCURA_API_URL=http://localhost:3000
```

For production:
```env
OBSCURA_API_URL=https://api.obscuraswap.com
```

## Usage

### As Standalone Server

```bash
pnpm start
```

### With Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "obscuraswap": {
      "command": "node",
      "args": ["/path/to/mcp/server/dist/index.js"],
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

### get_health

Check API health status.

**Parameters**: None

**Example**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-22T10:00:00.000Z",
  "environment": "production"
}
```

### get_supported_assets

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
      "tokens": [...]
    }
  ]
}
```

### get_swap_quote

Get swap quote with best rate.

**Parameters**:
- `fromChainId` (number): Source chain ID
- `toChainId` (number): Destination chain ID
- `fromToken` (string): Source token address
- `toToken` (string): Destination token address
- `amount` (string): Amount in token units
- `userAddress` (string): User wallet address

**Example**:
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

### get_chain_info

Get detailed chain information.

**Parameters**:
- `chainId` (number): Chain ID

**Example**:
```json
{
  "chainId": 1,
  "chainName": "Ethereum",
  "nativeToken": {...},
  "tokens": [...]
}
```

## Development

```bash
# Watch mode
pnpm dev

# Build
pnpm build

# Run
pnpm start
```

## Testing

Ensure the Obscura Swap backend is running:

```bash
cd ../../backend
pnpm dev
```

Then test the MCP server with an MCP client.

## Production Deployment

1. Build the server:
```bash
pnpm build
```

2. Set production API URL:
```env
OBSCURA_API_URL=https://api.obscuraswap.com
```

3. Deploy as a service or use with MCP clients

## License

MIT
