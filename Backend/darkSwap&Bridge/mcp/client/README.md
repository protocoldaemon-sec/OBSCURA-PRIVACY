# Obscura Swap MCP Client

Test client for the Obscura Swap MCP Server.

## Installation

```bash
cd mcp/client
pnpm install
pnpm build
```

## Configuration

Create `.env` file:

```env
OBSCURA_API_URL=http://localhost:3000
```

## Usage

### Run Example

```bash
pnpm start
```

### Run Tests

```bash
pnpm test
```

## Example Code

```typescript
import { ObscuraSwapMCPClient } from '@obscuraswap/mcp-client';

const client = new ObscuraSwapMCPClient();

// Connect
await client.connect('../server/dist/index.js');

// Get health
const health = await client.getHealth();

// Get assets
const assets = await client.getSupportedAssets();

// Get quote
const quote = await client.getSwapQuote({
  fromChainId: 1,
  toChainId: 43114,
  fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  toToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  amount: '1000000',
  userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
});

// Disconnect
await client.disconnect();
```

## License

MIT
