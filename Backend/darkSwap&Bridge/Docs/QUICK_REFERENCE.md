# Obscura Swap Quick Reference

Fast reference for common tasks and code snippets.

## 🚀 Quick Start Commands

```bash
# Install dependencies
pnpm install

# Test imports
pnpm test:imports

# Run backend server
pnpm dev

# Run examples
pnpm example:bridge   # Simple Bridge
pnpm example:silent   # Silent Swap
```

## 📦 Core SDK (Backend)

### Simple Bridge

```javascript
import { getBridgeQuote, convertQuoteResultToQuote, executeBridgeTransaction } from '@silentswap/sdk';

// Get quote
const quote = await getBridgeQuote(
  1,                                          // Source chain
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Source token
  '1000000',                                  // Amount
  43114,                                      // Dest chain
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Dest token
  userAddress
);

// Execute
const executableQuote = convertQuoteResultToQuote(quote, 1);
const status = await executeBridgeTransaction(executableQuote, walletClient, connector, console.log);
```

### Silent Swap

```javascript
import { createSilentSwapClient, ENVIRONMENT } from '@silentswap/sdk';

// Create client
const client = createSilentSwapClient({ environment: ENVIRONMENT.STAGING });

// Authenticate
const entropy = await authenticateAndDeriveEntropy(client, signer);

// Create facilitator group
const { group } = await createFacilitatorGroup(entropy, userAddress);

// Get quote
const quote = await getSilentSwapQuote(client, signer, group, recipient, token, amount, decimals);

// Create order
const order = await createSilentSwapOrder(client, signer, group, quote);

// Execute deposit
const result = await executeDepositTransaction(walletClient, order);
```

## ⚛️ React SDK (Frontend)

### Provider Setup

```tsx
import { SilentSwapProvider } from '@silentswap/react';
import { createSilentSwapClient, ENVIRONMENT } from '@silentswap/sdk';

const client = createSilentSwapClient({ environment: ENVIRONMENT.STAGING });

function App({ children }) {
  return (
    <SilentSwapProvider
      client={client}
      environment={ENVIRONMENT.STAGING}
      evmAddress={evmAddress}
      solAddress={solAddress}
      isConnected={isConnected}
      connector={connector}
      walletClient={walletClient}
    >
      {children}
    </SilentSwapProvider>
  );
}
```

### Simple Bridge

```tsx
import { useQuote, useTransaction } from '@silentswap/react';

function Bridge() {
  const { getQuote } = useQuote({ address });
  const { executeTransaction } = useTransaction({ address, walletClient, connector });

  const handleBridge = async () => {
    const quote = await getQuote(srcChain, srcToken, amount, dstChain, dstToken);
    await executeTransaction(quote);
  };
}
```

### Silent Swap

```tsx
import { useSilentSwap, useSwap } from '@silentswap/react';

function Swap() {
  const { executeSwap, isSwapping } = useSilentSwap();
  const { tokenIn, inputAmount, destinations, splits } = useSwap();

  const handleSwap = async () => {
    await executeSwap({
      sourceAsset: tokenIn.caip19,
      sourceAmount: inputAmount,
      destinations,
      splits,
      senderContactId: `caip10:eip155:1:${evmAddress}`,
    });
  };
}
```

### Data Hooks

```tsx
import { useBalancesContext, usePricesContext, useOrdersContext } from '@silentswap/react';

function Portfolio() {
  const { balances, totalUsdValue } = useBalancesContext();
  const { getPrice } = usePricesContext();
  const { orders } = useOrdersContext();
}
```

## 🔗 CAIP Standards

### CAIP-10 (Account IDs)

```
Format: caip10:<namespace>:<chainId>:<address>

Examples:
- EVM:    caip10:eip155:1:0x1234...
- Solana: caip10:solana:*:9WzDXwBbmkg8...
```

### CAIP-19 (Asset IDs)

```
Format: <chainId>/<tokenType>:<tokenAddress>

Examples:
- Native ETH:  eip155:1/slip44:60
- USDC (ETH):  eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
- Native SOL:  solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/slip44:501
- USDC (SOL):  solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/erc20:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

## 🌐 Supported Chains

| Chain | ID | Native Token | USDC Address |
|-------|----|--------------|--------------| 
| Ethereum | 1 | ETH | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 |
| Polygon | 137 | MATIC | 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174 |
| Arbitrum | 42161 | ETH | 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 |
| Avalanche | 43114 | AVAX | 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E |
| Solana | solana | SOL | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v |

## 🔧 Environment Variables

```env
# Required
PORT=3000
SILENTSWAP_ENVIRONMENT=STAGING
NEXT_PUBLIC_INTEGRATOR_ID=your_integrator_id

# Optional
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
WEBHOOK_URL=http://localhost:3000/webhooks/swap-status

# Testing only (DO NOT COMMIT)
PRIVATE_KEY=0x...
```

## 🛠️ Common Patterns

### Error Handling

```javascript
try {
  await executeSwap({...});
} catch (error) {
  if (error.message.includes('Price impact too high')) {
    // Handle high price impact
  } else if (error.message.includes('Insufficient balance')) {
    // Handle insufficient balance
  } else {
    // Handle other errors
  }
}
```

### Status Polling

```javascript
async function pollStatus(requestId, provider) {
  for (let i = 0; i < 60; i++) {
    const status = await getBridgeStatus(requestId, provider);
    if (status.status === 'success') return status;
    if (status.status === 'failed') throw new Error('Bridge failed');
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('Timeout');
}
```

### Amount Conversion

```javascript
import BigNumber from 'bignumber.js';

// Human to raw units
const rawAmount = BigNumber('1.5').shiftedBy(6).toFixed(0); // "1500000"

// Raw to human units
const humanAmount = BigNumber('1500000').shiftedBy(-6).toFixed(2); // "1.50"
```

## 🔍 Debugging

### Check Imports

```bash
pnpm test:imports
```

### Enable Verbose Logging

```javascript
const client = createSilentSwapClient({
  environment: ENVIRONMENT.STAGING,
  debug: true, // Enable debug logs
});
```

### Check Transaction Status

```javascript
const status = await getBridgeStatus(requestId, provider);
console.log('Status:', status.status);
console.log('TX Hashes:', status.txHashes);
```

## 📊 API Endpoints

```bash
# Get quote
GET /api/swap/quote?fromChainId=1&toChainId=137&fromToken=0x...&toToken=0x...&amount=1000000&userAddress=0x...

# Get supported assets
GET /api/swap/assets

# Health check
GET /health

# Webhook (POST)
POST /api/webhooks/swap-status
```

## 🔐 Security Checklist

- [ ] Never commit `.env` with real keys
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting in production
- [ ] Use HTTPS in production
- [ ] Validate all user inputs
- [ ] Monitor transaction status
- [ ] Handle errors gracefully
- [ ] Test with small amounts first

## 📖 Documentation Links

- [Full Documentation Index](./DOCUMENTATION_INDEX.md)
- [Getting Started](./GETTING_STARTED.md)
- [How It Works](./HOW_IT_WORKS.md)
- [Core SDK Guide](./CORE_SDK_GUIDE.md)
- [React Integration](./REACT_INTEGRATION.md)
- [Official Docs](https://docs.silentswap.com)

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Import errors | Run `pnpm test:imports` |
| Auth failed | Check SILENTSWAP_ENVIRONMENT |
| Price impact high | Try smaller amount |
| Wallet not connected | Check wallet connection |
| Transaction failed | Check gas and balance |

## 💡 Tips

1. **Start with STAGING** environment for testing
2. **Test with small amounts** first
3. **Monitor transaction status** after execution
4. **Cache facilitator groups** to avoid regeneration
5. **Use TypeScript** for better type safety
6. **Read error messages** carefully - they're helpful!

---

**Need more details?** Check the [Documentation Index](./DOCUMENTATION_INDEX.md)
