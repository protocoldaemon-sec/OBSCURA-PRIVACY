# Obscura Swap Integration Guide

Complete guide for integrating Obscura Swap into your application.

## Architecture Overview

Obscura Swap consists of two main parts:

1. **Backend API** - Express server providing REST endpoints for quotes and asset information
2. **Frontend Components** - React components using SilentSwap SDK for executing swaps

## Backend Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
SILENTSWAP_ENVIRONMENT=STAGING
NEXT_PUBLIC_INTEGRATOR_ID=your_integrator_id
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### 3. Start Backend Server

```bash
pnpm dev
```

The backend will be available at `http://localhost:3000`

## Frontend Integration

### 1. Wrap Your App with Provider

```tsx
// app/layout.tsx or pages/_app.tsx
import ObscuraSwapProvider from '@/frontend/providers/SilentSwapProvider';
import { WagmiProvider } from 'wagmi';
import { WalletProvider } from '@solana/wallet-adapter-react';

export default function RootLayout({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <WalletProvider wallets={wallets}>
        <ObscuraSwapProvider>
          {children}
        </ObscuraSwapProvider>
      </WalletProvider>
    </WagmiProvider>
  );
}
```

### 2. Use Swap Components

#### Basic Swap Form

```tsx
import { SwapForm } from '@/frontend/components/SwapForm';

export default function SwapPage() {
  return (
    <div>
      <h1>Obscura Swap</h1>
      <SwapForm />
    </div>
  );
}
```

#### Solana to EVM Swap

```tsx
import { SolanaToEvmSwap } from '@/frontend/components/SolanaToEvmSwap';

export default function SolanaSwapPage() {
  return <SolanaToEvmSwap />;
}
```

#### EVM to Solana Swap

```tsx
import { EvmToSolanaSwap } from '@/frontend/components/EvmToSolanaSwap';

export default function EvmSwapPage() {
  return <EvmToSolanaSwap />;
}
```

#### User Portfolio

```tsx
import { UserPortfolio } from '@/frontend/components/UserPortfolio';

export default function PortfolioPage() {
  return <UserPortfolio />;
}
```

## API Endpoints

### Get Quote

```bash
GET /api/swap/quote?fromChainId=1&toChainId=137&fromToken=0x...&toToken=0x...&amount=1000000&userAddress=0x...
```

Response:
```json
{
  "success": true,
  "data": {
    "quote": {...},
    "estimatedOutput": "...",
    "fees": {...}
  }
}
```

### Get Supported Assets

```bash
GET /api/swap/assets
```

Response:
```json
{
  "chains": [...],
  "tokens": {...}
}
```

## CAIP Standards

Obscura Swap uses CAIP (Chain Agnostic Improvement Proposals) standards:

### CAIP-10: Account ID Specification

Format: `caip10:<namespace>:<chainId>:<address>`

Examples:
- EVM: `caip10:eip155:1:0x1234...`
- Solana: `caip10:solana:*:9WzDXwBbmkg8...`

### CAIP-19: Asset Type and Asset ID Specification

Format: `<chainId>/<tokenType>:<tokenAddress>`

Examples:
- Native ETH: `eip155:1/slip44:60`
- USDC on Ethereum: `eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- Native SOL: `solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/slip44:501`
- USDC on Solana: `solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/erc20:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

## Supported Chains

- **Ethereum** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **Arbitrum** (Chain ID: 42161)
- **Avalanche** (Chain ID: 43114)
- **Solana** (Chain ID: solana)

## Key Features

### Privacy-First
All swaps are executed with privacy guarantees through SilentSwap's protocol.

### Multi-Chain Support
Seamlessly swap between EVM chains and Solana.

### Non-Custodial
Users maintain full control of their funds throughout the swap process.

### Real-Time Status
Track swap progress with real-time status updates.

## Error Handling

```tsx
import { useSilentSwap } from '@silentswap/react';

function MyComponent() {
  const { executeSwap, swapError } = useSilentSwap();

  const handleSwap = async () => {
    try {
      await executeSwap({...});
    } catch (error) {
      if (error.message.includes('Solana address required')) {
        // Handle Solana wallet not connected
      } else if (error.message.includes('Price impact too high')) {
        // Handle high price impact
      }
    }
  };
}
```

## Advanced Usage

### Custom Slippage

```tsx
import { useSwap } from '@silentswap/react';

function SlippageControl() {
  const { slippage, setSlippage, isAutoSlippage, setIsAutoSlippage } = useSwap();

  return (
    <div>
      <input 
        type="number" 
        value={slippage} 
        onChange={(e) => setSlippage(Number(e.target.value))}
        disabled={isAutoSlippage}
      />
      <button onClick={() => setIsAutoSlippage(!isAutoSlippage)}>
        {isAutoSlippage ? 'Manual' : 'Auto'}
      </button>
    </div>
  );
}
```

### Multiple Outputs (Split Swaps)

```tsx
import { useSwap } from '@silentswap/react';

function SplitSwap() {
  const { destinations, splits, handleAddOutput, updateDestinationAsset } = useSwap();

  return (
    <div>
      {destinations.map((dest, i) => (
        <div key={i}>
          <input 
            value={dest.asset}
            onChange={(e) => updateDestinationAsset(i, e.target.value)}
          />
          <input 
            type="number"
            value={splits[i] * 100}
            onChange={(e) => {
              const newSplits = [...splits];
              newSplits[i] = Number(e.target.value) / 100;
              setSplits(newSplits);
            }}
          />
        </div>
      ))}
      <button onClick={() => handleAddOutput()}>Add Output</button>
    </div>
  );
}
```

## Security Best Practices

1. **Never expose private keys** - Use wallet adapters (MetaMask, Phantom, etc.)
2. **Validate addresses** - Always validate user input addresses
3. **Use HTTPS** - Always use HTTPS in production
4. **Rate limiting** - Implement rate limiting on backend endpoints
5. **Environment variables** - Keep sensitive data in environment variables

## Testing

### Test Swap Flow

1. Connect both EVM and Solana wallets
2. Select source and destination assets
3. Enter amount
4. Review fees and price impact
5. Execute swap
6. Monitor status updates
7. Verify completion

### Test Networks

Use `SILENTSWAP_ENVIRONMENT=STAGING` for testing with testnet tokens.

## Support

- [SilentSwap Documentation](https://docs.silentswap.com)
- [Core SDK Guide](https://docs.silentswap.com/core/simple-bridge/introduction)
- [React SDK Guide](https://docs.silentswap.com/react/overview)

## License

MIT
