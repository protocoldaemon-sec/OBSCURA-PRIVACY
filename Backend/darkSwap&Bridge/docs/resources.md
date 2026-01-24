## Quick start

**[Where to start](/getting-started/where-to-start)** – Choose your integration path (DEX, wallet, or custom app)

## Learn the fundamentals

- **[How it works](/getting-started/how-it-works)** – Understand the core architecture and facilitator accounts
- **[Use cases](/getting-started/use-cases)** – See what you can build with SilentSwap

## Next steps

Once you've reviewed the basics, dive into the integration guides:

- **[React Integration](/react/overview)** – React hooks and components
- **[Vue Integration](/vue/overview)** – Vue composables and components
- **[Core SDK](/core/simple-bridge/introduction)** – HTTP API and core SDK usage

## Quick start

**[Where to start](/getting-started/where-to-start)** – Choose your integration path (DEX, wallet, or custom app)

## Learn the fundamentals

- **[How it works](/getting-started/how-it-works)** – Understand the core architecture and facilitator accounts
- **[Use cases](/getting-started/use-cases)** – See what you can build with SilentSwap

## Next steps

Once you've reviewed the basics, dive into the integration guides:

- **[React Integration](/react/overview)** – React hooks and components
- **[Vue Integration](/vue/overview)** – Vue composables and components
- **[Core SDK](/core/simple-bridge/introduction)** – HTTP API and core SDK usage

### Simple Bridge - Core SDK

---
title: Simple Bridge - Core SDK
description: Framework-agnostic bridge functionality for Node.js, Telegram bots, and backend services
---

# Simple Bridge - Core SDK

The Core SDK provides framework-agnostic functions for getting bridge quotes and executing cross-chain transactions. These functions can be used in Node.js backends, Telegram bots, or any environment where React/Vue hooks are not available.

## Overview

The Simple Bridge functionality in the Core SDK includes:

- **Quote Management**: Get quotes from multiple bridge providers
- **Optimal Solving**: Find optimal USDC amounts for bridge operations
- **Transaction Execution**: Execute bridge transactions with proper chain switching
- **Status Monitoring**: Check the status of bridge transactions

## Key Features

- **Provider Comparison**: Automatically compares multiple providers to find the best rate
- **Framework Agnostic**: Works in any JavaScript/TypeScript environment
- **Type Safe**: Full TypeScript support with comprehensive types
- **Error Handling**: Graceful fallback when providers fail

## Installation

```bash
pnpm add @silentswap/sdk
```

## Basic Example

```typescript
import { getBridgeQuote } from '@silentswap/sdk';

// Get a quote for bridging USDC from Ethereum to Avalanche
const quote = await getBridgeQuote(
  1, // Source chain ID (Ethereum)
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Source token (USDC)
  '1000000', // Amount in token units (1 USDC = 1e6)
  43114, // Destination chain ID (Avalanche)
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Destination token (USDC.e)
  '0x...' // User address
);

console.log('Provider:', quote.provider);
console.log('Output Amount:', quote.outputAmount);
console.log('Fee (USD):', quote.feeUsd);
console.log('Retention Rate:', quote.retentionRate);
```

## Use Cases

### Node.js Backend

```typescript
import { getBridgeQuote, executeBridgeTransaction } from '@silentswap/sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Create wallet client for transaction execution
const account = privateKeyToAccount('0x...');
const walletClient = createWalletClient({
  account,
  chain: ethereum,
  transport: http(),
});

// Get quote
const quote = await getBridgeQuote(/* ... */);

// Execute transaction
const status = await executeBridgeTransaction(
  quote,
  walletClient,
  connector, // Your connector implementation
  (step) => console.log('Step:', step)
);
```


## Next Steps

- Learn about [getting quotes](/core/simple-bridge/get-bridge-quote)
- Learn about [solving optimal USDC amounts](/core/simple-bridge/solve-optimal-usdc-amount)
- Learn about [executing transactions](/core/simple-bridge/execute-bridge-transaction)
- See a [complete example](/core/simple-bridge/complete-example)

---
title: getBridgeQuote
description: Get optimized bridge quotes from multiple providers
---

# getBridgeQuote

The `getBridgeQuote` function fetches quotes from multiple bridge providers and automatically selects the best option based on retention rate.

## Import

```typescript
import { getBridgeQuote } from '@silentswap/sdk';
```

## Basic Usage

```typescript
import { getBridgeQuote } from '@silentswap/sdk';

const quote = await getBridgeQuote(
  1, // Source chain ID (Ethereum)
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Source token (USDC)
  '1000000', // Amount in token units (1 USDC = 1e6)
  43114, // Destination chain ID (Avalanche)
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Destination token (USDC.e)
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' // User address
);

console.log('Provider:', quote.provider);
console.log('Output Amount:', quote.outputAmount);
console.log('Fee (USD):', quote.feeUsd);
console.log('Slippage:', quote.slippage);
console.log('Retention Rate:', quote.retentionRate);
```

## API Reference

### Function Signature

```typescript
function getBridgeQuote(
  srcChainId: number,
  srcToken: string,
  srcAmount: string,
  dstChainId: number,
  dstToken: string,
  userAddress: `0x${string}`,
  signal?: AbortSignal
): Promise<BridgeQuoteResult>
```

### Parameters

- `srcChainId` (number): Source chain ID (e.g., 1 for Ethereum, 43114 for Avalanche)
- `srcToken` (string): Source token address (use `'0x0'` or `'0x0000000000000000000000000000000000000000'` for native tokens)
- `srcAmount` (string): Amount to bridge in source token units (as string to avoid precision loss)
- `dstChainId` (number): Destination chain ID
- `dstToken` (string): Destination token address
- `userAddress` (`0x${string}`): User's EVM address
- `signal` (AbortSignal, optional): Abort signal for cancelling the request

### Return Value

```typescript
interface BridgeQuoteResult {
  /** Selected bridge provider */
  provider: BridgeProvider;
  /** Output amount in destination token units (as string) */
  outputAmount: string;
  /** Input amount required in source token units (as string) */
  inputAmount: string;
  /** Total fee in USD */
  feeUsd: number;
  /** Price slippage/impact percentage */
  slippage: number;
  /** Estimated time in seconds */
  estimatedTime: number;
  /** Retention rate (how much value is retained after fees, 0-1) */
  retentionRate: number;
  /** Number of transactions required */
  txCount: number;
  /** Raw response from the provider */
  rawResponse: any; // Raw response from the selected provider
}
```

## Examples

### Bridge Native Token

```typescript
import { getBridgeQuote } from '@silentswap/sdk';

// Bridge ETH from Ethereum to Avalanche
const quote = await getBridgeQuote(
  1, // Ethereum
  '0x0', // Native ETH
  '1000000000000000000', // 1 ETH (in wei)
  43114, // Avalanche
  '0x0', // Native AVAX
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
);
```

### With Abort Signal

```typescript
import { getBridgeQuote } from '@silentswap/sdk';

const controller = new AbortController();

// Set timeout
setTimeout(() => controller.abort(), 10000); // 10 second timeout

try {
  const quote = await getBridgeQuote(
    1,
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    '1000000',
    43114,
    '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    controller.signal
  );
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('Request cancelled');
  }
}
```

### Converting for Execution

To execute a bridge transaction, convert the quote result:

```typescript
import { getBridgeQuote, convertQuoteResultToQuote, executeBridgeTransaction } from '@silentswap/sdk';

// Get quote result
const quoteResult = await getBridgeQuote(
  1,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  '1000000',
  43114,
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
);

// Convert to executable quote
const quote = convertQuoteResultToQuote(quoteResult, 1);

// Execute
await executeBridgeTransaction(quote, walletClient, connector, console.log);
```

### Error Handling

```typescript
import { getBridgeQuote } from '@silentswap/sdk';

try {
  const quote = await getBridgeQuote(/* ... */);
  // Use quote
} catch (err) {
  if (err instanceof AggregateError) {
    // Both providers failed
    console.error('All providers failed:', err.errors);
  } else {
    // Other error
    console.error('Quote error:', err);
  }
}
```

## How It Works

1. **Parallel Fetching**: Fetches quotes from multiple providers simultaneously
2. **Provider Comparison**: Calculates retention rate for each provider
3. **Best Selection**: Automatically selects the provider with the highest retention rate
4. **Graceful Fallback**: If one provider fails, uses another available provider

## Converting to Executable Quote

`getBridgeQuote` returns a `BridgeQuoteResult` which contains quote information. To execute a bridge transaction, you need to convert it to a `BridgeQuote` with transaction data:

```typescript
import { getBridgeQuote, convertQuoteResultToQuote } from '@silentswap/sdk';

// Get quote result
const quoteResult = await getBridgeQuote(/* ... */);

// Convert to executable quote with transactions
const quote = convertQuoteResultToQuote(quoteResult, srcChainId);

// Now you can execute
await executeBridgeTransaction(quote, walletClient, connector, console.log);
```

## Related Functions

- [`convertQuoteResultToQuote`](/core/simple-bridge/execute-bridge-transaction#using-convertquoteresulttoquote) - Convert quote result to executable quote
- [`solveOptimalUsdcAmount`](/core/simple-bridge/solve-optimal-usdc-amount) - Find optimal USDC amounts for bridge operations
- [`executeBridgeTransaction`](/core/simple-bridge/execute-bridge-transaction) - Execute bridge transactions
- [`getBridgeStatus`](/core/simple-bridge/get-bridge-status) - Check bridge transaction status


---
title: solveOptimalUsdcAmount
description: Find optimal USDC amounts for bridge operations with deposit calldata
---

# solveOptimalUsdcAmount

The `solveOptimalUsdcAmount` function finds the optimal USDC amount to bridge by comparing multiple bridge providers. This is particularly useful when you need to bridge tokens to USDC on Avalanche with additional deposit calldata.

## Import

```typescript
import { solveOptimalUsdcAmount } from '@silentswap/sdk';
```

## Basic Usage

```typescript
import { solveOptimalUsdcAmount } from '@silentswap/sdk';

const result = await solveOptimalUsdcAmount(
  1, // Source chain ID (Ethereum)
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Source token (USDC)
  '1000000', // Source amount in token units (1 USDC = 1e6)
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // User address
  '0x...' // Optional deposit calldata
);

console.log('USDC Amount Out:', result.usdcAmountOut);
console.log('Actual Amount In:', result.actualAmountIn);
console.log('Provider:', result.provider);
console.log('Allowance Target:', result.allowanceTarget);
```

## API Reference

### Function Signature

```typescript
function solveOptimalUsdcAmount(
  srcChainId: number,
  srcToken: string,
  srcAmount: string,
  userAddress: string,
  depositCalldata?: string,
  maxImpactPercent?: number
): Promise<SolveUsdcResult>
```

### Parameters

- `srcChainId` (number): Source chain ID
- `srcToken` (string): Source token address (use `'0x0'` for native tokens)
- `srcAmount` (string): Source amount in token units (as string)
- `userAddress` (string): User's EVM address
- `depositCalldata` (string, optional): Deposit calldata for post-bridge execution. If not provided, a phony deposit calldata will be created automatically.
- `maxImpactPercent` (number, optional): Maximum price impact percentage allowed (default: from SDK constants)

### Return Value

```typescript
interface SolveUsdcResult {
  /** Optimal USDC amount out (in microUSDC) */
  usdcAmountOut: bigint;
  /** Actual input amount required */
  actualAmountIn: bigint;
  /** Bridge provider used */
  provider: BridgeProvider;
  /** Allowance target address (if required by provider) */
  allowanceTarget: string;
}
```

## Examples

### With Deposit Calldata

```typescript
import { solveOptimalUsdcAmount } from '@silentswap/sdk';
import { encodeFunctionData } from 'viem';

// Create deposit calldata
const depositCalldata = encodeFunctionData({
  abi: depositorAbi,
  functionName: 'deposit',
  args: [/* ... */],
});

const result = await solveOptimalUsdcAmount(
  1, // Ethereum
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  '1000000', // 1 USDC
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  depositCalldata
);
```

### Without Deposit Calldata (Auto Phony)

```typescript
import { solveOptimalUsdcAmount } from '@silentswap/sdk';

// Phony deposit calldata will be created automatically
const result = await solveOptimalUsdcAmount(
  1,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  '1000000',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
  // depositCalldata omitted - will use phony
);
```

### With Custom Max Impact

```typescript
import { solveOptimalUsdcAmount } from '@silentswap/sdk';

const result = await solveOptimalUsdcAmount(
  1,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  '1000000',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  undefined, // No deposit calldata
  3.0 // Max 3% price impact
);
```

### Error Handling

```typescript
import { solveOptimalUsdcAmount } from '@silentswap/sdk';

try {
  const result = await solveOptimalUsdcAmount(/* ... */);
  // Use result
} catch (err) {
  if (err instanceof AggregateError) {
    // Both providers failed
    console.error('All providers failed:', err.errors);
  } else if (err.message.includes('Price impact too high')) {
    // Price impact exceeded maxImpactPercent
    console.error('Price impact too high, try a smaller amount');
  } else {
    console.error('Solve error:', err);
  }
}
```

## How It Works

1. **Initial Quote**: Gets an initial quote to estimate expected USDC output
2. **Overshoot Calculation**: Calculates a target USDC amount (base + 1-5% or max +100 USDC)
3. **Iterative Solving**: Tries up to 4 times to find the optimal amount that fits within the source amount budget
4. **Provider Comparison**: Compares multiple providers, selecting the best rate
5. **Price Impact Check**: Ensures the price impact doesn't exceed `maxImpactPercent`

## Use Cases

### Silent Swap Integration

This function is commonly used in Silent Swap operations where you need to:
1. Bridge tokens to USDC on Avalanche
2. Execute a deposit transaction after bridging
3. Find the optimal USDC amount that fits within your budget

### Backend Processing

```typescript
import { solveOptimalUsdcAmount } from '@silentswap/sdk';

async function processBridge(userAddress: string, amount: string) {
  const result = await solveOptimalUsdcAmount(
    1,
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    amount,
    userAddress
  );

  // Store result for transaction execution
  return {
    usdcOut: result.usdcAmountOut.toString(),
    amountIn: result.actualAmountIn.toString(),
    provider: result.provider,
  };
}
```

## Best Practices

1. **Handle Price Impact**: Always check if the result fits your price impact requirements
2. **Use Allowance Target**: If provided, use the `allowanceTarget` for token approvals
3. **Cache Results**: Store results to avoid recalculating for the same parameters
4. **Monitor Provider Selection**: Log which provider was selected for analytics

## Related Functions

- [`getBridgeQuote`](/core/simple-bridge/get-bridge-quote) - Get quotes for cross-chain swaps
- [`executeBridgeTransaction`](/core/simple-bridge/execute-bridge-transaction) - Execute bridge transactions

---
title: executeBridgeTransaction
description: Execute bridge transactions with automatic chain switching
---

# executeBridgeTransaction

The `executeBridgeTransaction` function executes bridge transactions by handling chain switching and transaction sending. It works with any wallet client that implements the viem `WalletClient` interface.

## Import

```typescript
import { executeBridgeTransaction } from '@silentswap/sdk';
```

## Basic Usage

```typescript
import { 
  executeBridgeTransaction, 
  getBridgeQuote, 
  convertQuoteResultToQuote 
} from '@silentswap/sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ethereum } from 'viem/chains';

// Create wallet client
const account = privateKeyToAccount('0x...');
const walletClient = createWalletClient({
  account,
  chain: ethereum,
  transport: http(),
});

// Get quote (compares providers and selects best)
const quoteResult = await getBridgeQuote(
  1, // Source chain ID (Ethereum)
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Source token (USDC)
  '1000000', // Amount in token units
  43114, // Destination chain ID (Avalanche)
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Destination token (USDC.e)
  account.address // User address
);

// Convert to BridgeQuote with transaction data
const quote = convertQuoteResultToQuote(quoteResult, 1);

// Execute transaction
const status = await executeBridgeTransaction(
  quote,
  walletClient,
  connector, // Your connector implementation
  (step) => console.log('Step:', step)
);

console.log('Status:', status.status);
console.log('Transaction Hashes:', status.txHashes);
console.log('Request ID:', status.requestId);
```

## API Reference

### Function Signature

```typescript
function executeBridgeTransaction(
  quote: BridgeQuote,
  walletClient: WalletClient,
  connector: Connector,
  setStep: (step: string) => void
): Promise<BridgeStatus>
```

### Parameters

- `quote` (BridgeQuote): Bridge quote with transaction data. Use `convertQuoteResultToQuote` to convert a `BridgeQuoteResult` from `getBridgeQuote` to a `BridgeQuote`.
- `walletClient` (WalletClient): viem wallet client for signing transactions
- `connector` (Connector): Wagmi connector for chain switching (must implement `switchChain`)
- `setStep` ((step: string) => void): Callback function to track execution progress

### Return Value

```typescript
interface BridgeStatus {
  status: 'pending' | 'success' | 'failed' | 'refund' | 'fallback';
  txHashes?: Hex[];
  details?: string;
  requestId?: string;
}
```

## Examples

### Node.js Backend

```typescript
import { 
  executeBridgeTransaction, 
  getBridgeQuote, 
  convertQuoteResultToQuote 
} from '@silentswap/sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ethereum } from 'viem/chains';

// Create wallet client
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: ethereum,
  transport: http(),
});

// Simple connector implementation
const connector = {
  switchChain: async ({ chainId }: { chainId: number }) => {
    // Implement chain switching logic
    // For viem, you might need to create a new client for the target chain
  },
};

// Get quote (compares providers)
const quoteResult = await getBridgeQuote(
  1, // Ethereum
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  '1000000',
  43114, // Avalanche
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC.e
  account.address
);

// Convert to BridgeQuote with transactions
const quote = convertQuoteResultToQuote(quoteResult, 1);

// Execute
const status = await executeBridgeTransaction(
  quote,
  walletClient,
  connector,
  (step) => {
    console.log(`[${new Date().toISOString()}] ${step}`);
  }
);

if (status.status === 'pending') {
  console.log('Transaction submitted:', status.txHashes);
  console.log('Request ID:', status.requestId);
}
```

### With Progress Tracking

```typescript
import { executeBridgeTransaction } from '@silentswap/sdk';

const steps: string[] = [];

const status = await executeBridgeTransaction(
  quote,
  walletClient,
  connector,
  (step) => {
    steps.push(step);
    console.log(`Progress: ${steps.length} - ${step}`);
  }
);

console.log('All steps:', steps);
```

### Error Handling

```typescript
import { executeBridgeTransaction } from '@silentswap/sdk';

try {
  const status = await executeBridgeTransaction(
    quote,
    walletClient,
    connector,
    (step) => console.log(step)
  );
  
  if (status.status === 'pending') {
    // Transaction submitted successfully
    console.log('Pending:', status.txHashes);
  }
} catch (err) {
  if (err.message.includes('Failed to switch to chain')) {
    console.error('Chain switching failed:', err);
  } else if (err.message.includes('No transactions')) {
    console.error('Invalid quote - no transactions found');
  } else {
    console.error('Execution error:', err);
  }
}
```

## How It Works

1. **Provider Detection**: Determines which provider was used
2. **Chain Switching**: Automatically switches to the correct chain for each transaction
3. **Transaction Execution**: Sends transactions in sequence
4. **Status Return**: Returns initial status with transaction hashes and request ID

## Using convertQuoteResultToQuote

The `convertQuoteResultToQuote` function extracts transaction data from the quote result:

```typescript
import { getBridgeQuote, convertQuoteResultToQuote } from '@silentswap/sdk';

// Get quote result (without transactions)
const quoteResult = await getBridgeQuote(/* ... */);

// Convert to BridgeQuote with transactions
const quote = convertQuoteResultToQuote(quoteResult, srcChainId);

// Now you can execute
await executeBridgeTransaction(quote, walletClient, connector, console.log);
```

## Best Practices

1. **Implement Chain Switching**: Ensure your connector properly implements `switchChain`
2. **Handle Errors**: Wrap in try/catch to handle transaction failures
3. **Track Progress**: Use the `setStep` callback to provide user feedback
4. **Monitor Status**: After execution, use `getBridgeStatus` to monitor completion
5. **Gas Limits**: Ensure sufficient gas limits for transactions

## Related Functions

- [`getBridgeQuote`](/core/simple-bridge/get-bridge-quote) - Get bridge quotes
- [`getBridgeStatus`](/core/simple-bridge/get-bridge-status) - Check transaction status
- [`solveOptimalUsdcAmount`](/core/simple-bridge/solve-optimal-usdc-amount) - Find optimal amounts

---
title: getBridgeStatus
description: Check the status of bridge transactions
---

# getBridgeStatus

The `getBridgeStatus` function checks the status of a bridge transaction by querying the provider's API. It works with all supported bridge providers.

## Import

```typescript
import { getBridgeStatus } from '@silentswap/sdk';
```

## Basic Usage

```typescript
import { getBridgeStatus } from '@silentswap/sdk';

// After executing a bridge transaction, you get a requestId
const status = await getBridgeStatus(
  'request-id-from-execution', // Request ID from executeBridgeTransaction
  quoteResult.provider // Use the provider from your quote result
);

console.log('Status:', status.status); // 'pending' | 'success' | 'failed' | 'refund' | 'fallback'
console.log('Transaction Hashes:', status.txHashes);
console.log('Details:', status.details);
```

## API Reference

### Function Signature

```typescript
function getBridgeStatus(
  requestId: string,
  provider: BridgeProvider
): Promise<BridgeStatus>
```

### Parameters

- `requestId` (string): Request ID returned from `executeBridgeTransaction`
- `provider` (BridgeProvider): Bridge provider used (from your quote result)

### Return Value

```typescript
interface BridgeStatus {
  status: 'pending' | 'success' | 'failed' | 'refund' | 'fallback';
  txHashes?: Hex[];
  details?: string;
  requestId?: string;
}
```

## Status Values

- `'pending'`: Transaction is still processing
- `'success'`: Bridge completed successfully
- `'failed'`: Bridge failed
- `'refund'`: Transaction was refunded
- `'fallback'`: Transaction fell back to alternative route

## Examples

### Polling for Status

```typescript
import { getBridgeStatus, type BridgeProvider, type BridgeStatus } from '@silentswap/sdk';

async function pollBridgeStatus(
  requestId: string,
  provider: BridgeProvider,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<BridgeStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getBridgeStatus(requestId, provider);
    
    if (status.status === 'success') {
      console.log('Bridge completed successfully!');
      return status;
    }
    
    if (status.status === 'failed' || status.status === 'refund') {
      console.log('Bridge failed or refunded');
      return status;
    }
    
    // Still pending, wait and retry
    console.log(`Attempt ${i + 1}/${maxAttempts}: Still pending...`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Bridge status polling timeout');
}

// Usage
const status = await pollBridgeStatus(
  'request-id-123',
  quoteResult.provider, // Use provider from quote
  60, // Max 60 attempts
  5000 // 5 second intervals
);
```

### With Error Handling

```typescript
import { getBridgeStatus } from '@silentswap/sdk';

try {
  const status = await getBridgeStatus(requestId, provider);
  
  switch (status.status) {
    case 'success':
      console.log('Bridge completed:', status.txHashes);
      break;
    case 'pending':
      console.log('Still processing...');
      break;
    case 'failed':
      console.error('Bridge failed:', status.details);
      break;
    case 'refund':
      console.warn('Transaction refunded:', status.details);
      break;
    case 'fallback':
      console.info('Used fallback route:', status.details);
      break;
  }
} catch (err) {
  if (err.message.includes('API error')) {
    console.error('Provider API error:', err);
  } else {
    console.error('Status check error:', err);
  }
}
```

### Backend Monitoring

```typescript
import { getBridgeStatus, type BridgeProvider } from '@silentswap/sdk';

// Store bridge requests in database
interface BridgeRequest {
  id: string;
  requestId: string;
  provider: BridgeProvider;
  status: string;
  createdAt: Date;
}

async function checkPendingBridges() {
  const pendingBridges = await db.getPendingBridges();
  
  for (const bridge of pendingBridges) {
    try {
      const status = await getBridgeStatus(bridge.requestId, bridge.provider);
      
      // Update database
      await db.updateBridgeStatus(bridge.id, status.status, {
        txHashes: status.txHashes,
        details: status.details,
      });
      
      // Notify user if completed
      if (status.status === 'success') {
        await notifyUser(bridge.userId, 'Bridge completed successfully!');
      }
    } catch (err) {
      console.error(`Failed to check bridge ${bridge.id}:`, err);
    }
  }
}

// Run every 30 seconds
setInterval(checkPendingBridges, 30000);
```


## Best Practices

1. **Polling Intervals**: Use reasonable polling intervals (5-10 seconds) to avoid rate limiting
2. **Timeout Handling**: Set maximum polling attempts to avoid infinite loops
3. **Error Handling**: Always handle API errors gracefully
4. **Status Caching**: Cache status results to reduce API calls
5. **User Notifications**: Notify users when bridge status changes

## Related Functions

- [`executeBridgeTransaction`](/core/simple-bridge/execute-bridge-transaction) - Execute bridge transactions
- [`getBridgeQuote`](/core/simple-bridge/get-bridge-quote) - Get bridge quotes

---
title: Complete Example
description: Complete example of using Core SDK for bridge operations
---

# Complete Example

This example demonstrates a complete bridge flow using the Core SDK in a Node.js backend environment.

## Setup

```typescript
import { 
  getBridgeQuote,
  convertQuoteResultToQuote,
  executeBridgeTransaction,
  getBridgeStatus,
  type BridgeProvider,
  type BridgeStatus,
} from '@silentswap/sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ethereum, avalanche } from 'viem/chains';

// Create wallet client
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: ethereum,
  transport: http(),
});

// Simple connector implementation for chain switching
const connector = {
  switchChain: async ({ chainId }: { chainId: number }) => {
    // For production, you'd want to create a new client for the target chain
    // This is a simplified example
    console.log(`Switching to chain ${chainId}`);
  },
};
```

## Complete Bridge Flow

```typescript
async function bridgeTokens(
  srcChainId: number,
  srcToken: string,
  srcAmount: string,
  dstChainId: number,
  dstToken: string,
  userAddress: `0x${string}`
) {
  try {
    // Step 1: Get quote (compares providers and selects best)
    console.log('Fetching bridge quote...');
    const quoteResult = await getBridgeQuote(
      srcChainId,
      srcToken,
      srcAmount,
      dstChainId,
      dstToken,
      userAddress
    );

    console.log('Quote received:');
    console.log(`  Provider: ${quoteResult.provider}`);
    console.log(`  Output Amount: ${quoteResult.outputAmount}`);
    console.log(`  Fee (USD): $${quoteResult.feeUsd.toFixed(2)}`);
    console.log(`  Slippage: ${quoteResult.slippage.toFixed(2)}%`);
    console.log(`  Retention Rate: ${(quoteResult.retentionRate * 100).toFixed(2)}%`);
    console.log(`  Estimated Time: ${quoteResult.estimatedTime}s`);

    // Step 2: Convert to executable quote with transactions
    console.log('\nConverting to executable quote...');
    const quote = convertQuoteResultToQuote(quoteResult, srcChainId);

    // Step 3: Execute transaction
    console.log('\nExecuting bridge transaction...');
    const status = await executeBridgeTransaction(
      quote,
      walletClient,
      connector,
      (step) => {
        console.log(`  → ${step}`);
      }
    );

    if (status.status !== 'pending') {
      throw new Error(`Unexpected status: ${status.status}`);
    }

    console.log('\nTransaction submitted:');
    console.log(`  Transaction Hashes: ${status.txHashes?.join(', ')}`);
    console.log(`  Request ID: ${status.requestId}`);

    // Step 3: Monitor status
    if (status.requestId) {
      console.log('\nMonitoring bridge status...');
      const finalStatus = await pollBridgeStatus(
        status.requestId,
        quote.provider
      );

      console.log('\nFinal status:', finalStatus.status);
      if (finalStatus.txHashes) {
        console.log('Transaction Hashes:', finalStatus.txHashes);
      }

      return finalStatus;
    }

    return status;
  } catch (err) {
    console.error('Bridge error:', err);
    throw err;
  }
}

// Helper function to poll status
async function pollBridgeStatus(
  requestId: string,
  provider: BridgeProvider,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<BridgeStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getBridgeStatus(requestId, provider);
    
    if (status.status === 'success') {
      return status;
    }
    
    if (status.status === 'failed' || status.status === 'refund') {
      return status;
    }
    
    console.log(`  Attempt ${i + 1}/${maxAttempts}: ${status.status}...`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Bridge status polling timeout');
}
```

## Usage Example

```typescript
// Bridge USDC from Ethereum to Avalanche
const result = await bridgeTokens(
  1, // Ethereum
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  '1000000', // 1 USDC (6 decimals)
  43114, // Avalanche
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC.e
  account.address
);

console.log('Bridge completed:', result);
```

## Example with Optimal USDC Solving

```typescript
import { 
  getBridgeQuote,
  convertQuoteResultToQuote,
  solveOptimalUsdcAmount,
  executeBridgeTransaction,
} from '@silentswap/sdk';

async function bridgeToUsdcWithDeposit(
  srcChainId: number,
  srcToken: string,
  srcAmount: string,
  userAddress: `0x${string}`,
  depositCalldata: string
) {
  // Step 1: Solve for optimal USDC amount
  console.log('Solving for optimal USDC amount...');
  const solveResult = await solveOptimalUsdcAmount(
    srcChainId,
    srcToken,
    srcAmount,
    userAddress,
    depositCalldata
  );

  console.log('Solve result:');
  console.log(`  USDC Out: ${solveResult.usdcAmountOut.toString()}`);
  console.log(`  Amount In: ${solveResult.actualAmountIn.toString()}`);
  console.log(`  Provider: ${solveResult.provider}`);
  console.log(`  Allowance Target: ${solveResult.allowanceTarget}`);

    // Step 2: Get quote with the solved amount
    const quoteResult = await getBridgeQuote(
      srcChainId,
      srcToken,
      solveResult.actualAmountIn.toString(),
      43114, // Avalanche
      '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC on Avalanche
      userAddress
    );

    // Convert to executable quote
    const quote = convertQuoteResultToQuote(quoteResult, srcChainId);

  // Step 3: Execute transaction
  const status = await executeBridgeTransaction(
    quote,
    walletClient,
    connector,
    (step) => console.log(`  → ${step}`)
  );

  return { solveResult, quote, status };
}
```

## Error Handling Example

```typescript
async function safeBridgeTokens(...args: Parameters<typeof bridgeTokens>) {
  try {
    return await bridgeTokens(...args);
  } catch (err) {
    if (err instanceof AggregateError) {
      console.error('All providers failed:');
      err.errors.forEach((error, i) => {
        console.error(`  Provider ${i + 1}:`, error.message);
      });
    } else if (err.message.includes('Price impact too high')) {
      console.error('Price impact exceeded maximum. Try a smaller amount.');
    } else if (err.message.includes('Failed to switch to chain')) {
      console.error('Chain switching failed. Ensure the chain is supported.');
    } else if (err.message.includes('AbortError')) {
      console.error('Request was cancelled or timed out.');
    } else {
      console.error('Unexpected error:', err);
    }
    throw err;
  }
}
```

## Telegram Bot Example

```typescript
import { Telegraf } from 'telegraf';
import { getBridgeQuote } from '@silentswap/sdk';

const bot = new Telegraf(process.env.BOT_TOKEN!);

bot.command('quote', async (ctx) => {
  try {
    const quote = await getBridgeQuote(
      1, // Ethereum
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      '1000000', // 1 USDC
      43114, // Avalanche
      '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC.e
      ctx.from.id.toString() // Use user ID as identifier
    );

    await ctx.reply(
      `Bridge Quote:\n` +
      `Provider: ${quote.provider}\n` +
      `Output: ${quote.outputAmount}\n` +
      `Fee: $${quote.feeUsd.toFixed(2)}\n` +
      `Slippage: ${quote.slippage.toFixed(2)}%`
    );
  } catch (err) {
    await ctx.reply(`Error: ${err.message}`);
  }
});

bot.launch();
```

## Next Steps

- Review the [introduction](/core/simple-bridge/introduction) for overview
- Learn about [getting quotes](/core/simple-bridge/get-bridge-quote)
- Learn about [solving optimal amounts](/core/simple-bridge/solve-optimal-usdc-amount)
- Learn about [executing transactions](/core/simple-bridge/execute-bridge-transaction)
- Learn about [checking status](/core/simple-bridge/get-bridge-status)

### Swap

# Example: Account Setup

## Foreword

The SDK uses [viem](https://viem.sh) by default for all EVM signer interactions. This example assumes you are using viem.

### Prepare a signer

In order to sign messages, you will need to prepare a signer instance that implements the [`EvmSigner`](https://github.com/Auronox/silentswap-v2-sdk/blob/main/src/types/sdk.ts#L12) interface. This example imports a private key and creates a local viem account.

```ts [client.ts]
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { avalanche } from 'viem/chains';
import { publicActions } from 'viem/actions';

// [!include ~/snippets/node-viem.ts:account]
```


### Create a new client

The client is for sending requests to the SilentSwap service.

```ts [client.ts]
import { createSilentSwapClient } from '@silentswap/sdk';

// [!include ~/snippets/node-viem.ts:createClient]
```


### Sign in to SilentSwap service

Use [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) to sign in to the SilentSwap service, obtaining a secret authentication token in order to derive the secret entropy for generating facilitator wallets.

:::code-group

```ts [client.ts]
import { deriveSecretEntropy } from './helper.ts';

// [!include ~/snippets/node-viem.ts:auth]
```

```ts [derive-entropy.ts]
import type { SilentSwapClient, EvmSigner, AuthResponse } from '@silentswap/sdk';
import { createEip712DocForWalletGeneration } from '@silentswap/sdk';
import { signIn } from './sign-in.ts';

// [!include ~/snippets/node-viem.ts:deriveSecretEntropy]
```

```ts [sign-in.ts]
import type { SilentSwapClient, EvmSigner, AuthResponse } from '@silentswap/sdk';
import { createSignInMessage } from '@silentswap/sdk';

// [!include ~/snippets/node-viem.ts:signIn]
```

:::


### Create a facilitator group

At this point, `entropy` is the raw bytes behind the mnemonic seed phrase for the account's unique SilentSwap super wallet. To access a group of accounts that will be used for a specific order, use a nonce to distinguish it from previous orders based on how many times the account has deposited into the Gateway contract.

```ts [client.ts]
import { createHdFacilitatorGroupFromEntropy } from '@silentswap/sdk';

// [!include ~/snippets/node-viem.ts:group]
```


### Access a facilitator account

```ts [client.ts]
// [!include ~/snippets/node-viem.ts:facilitator]
```

# Example: Creating an Order


### Define your route parameters

In this simplified example, we send funds to a single recipient on Ethereum, who will receive 10 USDC.

```ts [client.ts]
// [!include ~/snippets/node-viem.ts:params]
```


### Derive the viewer account

Before requesting a quote, we need to derive the viewer account from the facilitator group and export its public key. The viewer is used to observe the order execution.

```ts [client.ts]
import { FacilitatorKeyType } from '@silentswap/sdk';

// [!include ~/snippets/node-viem.ts:viewer]
```


### Request a Quote

At this stage, we must commit to the facilitator accounts we will use for the order. We do this by exporting the public keys of the facilitator group using a predetermined selection of coin types, and including the viewer public key in the quote request.

```ts [client.ts]
import BigNumber from 'bignumber.js';
import { caip19FungibleEvmToken } from '@silentswap/sdk';

// [!include ~/snippets/node-viem.ts:quote]
```


### Review and sign authorizations

Assuming we are happy with the quote, we must sign the authorizations for the order (including meta txs, proxy authorizations, and the order intent itself). This is done using the EvmSigner abstraction and selecting the appropriate signer for each document.

```ts [client.ts]
import { quoteResponseToEip712Document } from '@silentswap/sdk';

// [!include ~/snippets/node-viem.ts:authorizations]
```


### Place the order

Placing the order is a simple matter of sending a request to the SilentSwap service, including the quote, signed authorizations, and facilitator replies.

The `OrderRequest` can optionally include metadata with information about the source asset, source sender, and integrator ID for tracking purposes.

```ts [client.ts]
// [!include ~/snippets/node-viem.ts:order]
```

#### Optional Metadata

You can include optional metadata in the order request:

```ts
const [orderError, orderResponse] = await silentswap.order({
    quote: quoteResponse.quote,
    quoteId: quoteResponse.quoteId,
    authorizations: signedAuths,
    eip712Domain: orderDoc.domain,
    signature: signedQuote,
    facilitators: facilitatorReplies,
    metadata: {
        sourceAsset: {
            caip19: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            amount: '1000000', // Amount in smallest unit
        },
        sourceSender: {
            contactId: 'caip10:eip155:1:0x...',
        },
        integratorId: 'my-integrator-id', // Optional: for tracking
    },
});
```
# Example: Deposit


## Deposit

Send the deposit transaction to the Gateway contract.

```ts [client.ts]
import { parseTransactionRequestForViem } from '@silentswap/sdk';

// [!include ~/snippets/node-viem.ts:deposit]
```


## Watch for finalization

Watch for an ERC-20 token transfer to the recipient's address to verify the completion of the order. The transfer will come from the facilitator account for coin type 60 (ETH) at the first output index (0).

```ts [client.ts]
// [!include ~/snippets/node-viem.ts:watch]
```
---
title: Complete Example
description: Complete example of using Core SDK for Silent Swap (hidden swaps) in Node.js backend
---

# Complete Example

This example demonstrates a complete Silent Swap flow using the Core SDK in a Node.js backend environment. Silent Swap enables private, non-custodial cross-chain swaps.

## Quick Reference

### Essential Imports

```typescript
import {
  // Client & Signer
  createSilentSwapClient,
  createViemSigner,
  parseTransactionRequestForViem,
  
  // Authentication
  createSignInMessage,
  createEip712DocForWalletGeneration,
  createEip712DocForOrder,
  
  // Facilitator Group
  createHdFacilitatorGroupFromEntropy,
  queryDepositCount,
  hexToBytes,
  
  // Order & Quote
  quoteResponseToEip712Document,
  
  // Bridge Utilities
  solveOptimalUsdcAmount,
  
  // Token Utilities
  caip19FungibleEvmToken,
  
  // Constants
  DeliveryMethod,
  FacilitatorKeyType,
  PublicKeyArgGroups,
  ENVIRONMENT,
  GATEWAY_ABI,
} from '@silentswap/sdk';
import BigNumber from 'bignumber.js';
```

## Setup

```typescript
import { 
  createSilentSwapClient,
  createViemSigner,
  parseTransactionRequestForViem,
  createSignInMessage,
  createEip712DocForOrder,
  createEip712DocForWalletGeneration,
  createHdFacilitatorGroupFromEntropy,
  quoteResponseToEip712Document,
  caip19FungibleEvmToken,
  queryDepositCount,
  solveOptimalUsdcAmount,
  GATEWAY_ABI,
  PublicKeyArgGroups,
  DeliveryMethod,
  FacilitatorKeyType,
  ENVIRONMENT,
  hexToBytes,
  type SilentSwapClient,
  type EvmSigner,
  type AuthResponse,
  type SolveUsdcResult,
} from '@silentswap/sdk';
import { createWalletClient, http, publicActions, erc20Abi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { avalanche, mainnet } from 'viem/chains';
import BigNumber from 'bignumber.js';

// Create wallet client
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const client = createWalletClient({
  account,
  chain: avalanche,
  transport: http(),
}).extend(publicActions);

// Create EVM signer
const signer = createViemSigner(account, client);

// Create SilentSwap client
const silentswap = createSilentSwapClient({
  environment: ENVIRONMENT.MAINNET,
  baseUrl: 'https://api.silentswap.com',
});
```

## Required Core Methods

The following methods from `@silentswap/sdk` are essential for executing Silent Swaps:

### Authentication & Entropy

- **`createSignInMessage(address, nonce, domain)`**: Creates a SIWE (Sign-In with Ethereum) message for authentication
- **`createEip712DocForWalletGeneration(secretToken)`**: Creates EIP-712 document for deriving entropy from auth token
- **`hexToBytes(hex)`**: Converts hex string to bytes array (required for entropy conversion)

### Facilitator Group Management

- **`queryDepositCount(userAddress)`**: Queries the Gateway contract to get the number of deposits made by a user. This count is used as a nonce for creating facilitator groups.
- **`createHdFacilitatorGroupFromEntropy(entropy, depositCount)`**: Creates a hierarchical deterministic facilitator group from entropy and deposit count. This generates:
  - Viewer account (for observing order execution)
  - Facilitator accounts (for executing swaps on different chains)

### Bridge Utilities

- **`solveOptimalUsdcAmount(srcChainId, srcToken, srcAmount, userAddress, depositCalldata?, maxImpactPercent?)`**: Calculates the optimal USDC amount that will be received after bridging a source token to Avalanche. This is essential for cross-chain swaps where you need to bridge first, then use the resulting USDC for SilentSwap.
  - **Parameters**:
    - `srcChainId`: Source chain ID (e.g., 1 for Ethereum mainnet)
    - `srcToken`: Source token address (`0x0` or `0x0000...` for native tokens)
    - `srcAmount`: Source amount in raw token units
    - `userAddress`: User's EVM address
    - `depositCalldata` (optional): Deposit calldata for post-bridge execution
    - `maxImpactPercent` (optional): Maximum price impact allowed (default from constants)
  - **Returns**: `SolveUsdcResult` with:
    - `usdcAmountOut`: USDC amount in microUSDC (6 decimals) - ready to use in quotes
    - `actualAmountIn`: Actual input amount required
    - `provider`: Bridge provider used (`'relay'` or `'debridge'`)
    - `allowanceTarget`: Allowance target address (for deBridge)

### Token & Asset Utilities

- **`caip19FungibleEvmToken(chainId, tokenAddress)`**: Creates a CAIP-19 identifier for an EVM ERC20 token
  - Example: `caip19FungibleEvmToken(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')` → `"eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"`

### Order Creation

- **`quoteResponseToEip712Document(quoteResponse)`**: Converts a quote response to an EIP-712 document for signing the order
- **`createEip712DocForOrder(quoteResponse)`**: Alternative method to create EIP-712 document for order signing

### Signer Adapters

- **`createViemSigner(account, walletClient)`**: Creates an EVM signer adapter for viem wallet clients
- **`parseTransactionRequestForViem(transactionRequest)`**: Parses a transaction request from the API into viem-compatible format

### Constants & Types

- **`DeliveryMethod.SNIP`**: Delivery method constant for SilentSwap orders
- **`FacilitatorKeyType.SECP256K1`**: Key type for EVM facilitator accounts
- **`PublicKeyArgGroups.GENERIC`**: Predefined public key argument groups for facilitator accounts
- **`ENVIRONMENT.MAINNET`**: Environment constant for mainnet configuration
- **`GATEWAY_ABI`**: ABI for the Gateway contract (for querying deposit counts)

### Method Usage Flow

```typescript
// 1. Authentication
const signInMessage = createSignInMessage(address, nonce, domain);
const entropy = await signer.signEip712TypedData(
  createEip712DocForWalletGeneration(authResponse.secretToken)
);

// 2. Facilitator Group
const depositCount = await queryDepositCount(address);
const group = await createHdFacilitatorGroupFromEntropy(
  hexToBytes(entropy),
  depositCount
);

// 3. Token Asset
const asset = caip19FungibleEvmToken(chainId, tokenAddress);

// 4. Order Signing
const orderDoc = quoteResponseToEip712Document(quoteResponse);
const signature = await signer.signEip712TypedData(orderDoc);
```

## Complete Silent Swap Flow

```typescript
async function executeSilentSwap(
  recipientAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  tokenAmount: string,
  tokenDecimals: number = 6
) {
  try {
    // Step 1: Authenticate and derive entropy
    console.log('Step 1: Authenticating with SilentSwap...');
    const entropy = await authenticateAndDeriveEntropy(silentswap, signer);
    console.log('✓ Authentication successful');

    // Step 2: Create facilitator group
    console.log('\nStep 2: Creating facilitator group...');
    const depositCount = await queryDepositCount(account.address);
    const group = await createHdFacilitatorGroupFromEntropy(
      hexToBytes(entropy),
      depositCount
    );
    console.log(`✓ Facilitator group created (deposit count: ${depositCount})`);

    // Step 3: Get quote
    console.log('\nStep 3: Requesting quote...');
    const quoteResponse = await getQuote(
      silentswap,
      signer,
      group,
      recipientAddress,
      tokenAddress,
      tokenAmount,
      tokenDecimals
    );
    console.log(`✓ Quote received (Order ID: ${quoteResponse.quoteId})`);

    // Step 4: Sign authorizations and create order
    console.log('\nStep 4: Signing authorizations and creating order...');
    const orderResponse = await createOrder(
      silentswap,
      signer,
      group,
      quoteResponse
    );
    console.log(`✓ Order created (Order ID: ${orderResponse.response.orderId})`);

    // Step 5: Execute deposit
    console.log('\nStep 5: Executing deposit transaction...');
    const depositHash = await executeDeposit(client, orderResponse);
    console.log(`✓ Deposit transaction sent: ${depositHash}`);

    // Step 6: Watch for completion
    console.log('\nStep 6: Watching for order completion...');
    await watchForCompletion(
      client,
      tokenAddress,
      recipientAddress,
      group,
      tokenDecimals
    );

    return {
      orderId: orderResponse.response.orderId,
      depositHash,
      quote: quoteResponse,
    };
  } catch (err) {
    console.error('Silent Swap error:', err);
    throw err;
  }
}

// Helper: Authenticate and derive entropy
async function authenticateAndDeriveEntropy(
  silentswap: SilentSwapClient,
  signer: EvmSigner
): Promise<`0x${string}`> {
  // Get nonce
  const [nonceError, nonceResponse] = await silentswap.nonce(signer.address);
  if (!nonceResponse || nonceError) {
    throw new Error(`Failed to get nonce: ${nonceError?.type}: ${nonceError?.error}`);
  }

  // Create sign-in message
  const signInMessage = createSignInMessage(
    signer.address,
    nonceResponse.nonce,
    'silentswap.com'
  );

  // Sign message
  const siweSignature = await signer.signEip191Message(signInMessage.message);

  // Authenticate
  const [authError, authResponse] = await silentswap.authenticate({
    siwe: {
      message: signInMessage.message,
      signature: siweSignature,
    },
  });

  if (!authResponse || authError) {
    throw new Error(`Failed to authenticate: ${authError?.type}: ${authError?.error}`);
  }

  // Derive entropy from auth token
  const eip712Doc = createEip712DocForWalletGeneration(authResponse.secretToken);
  const entropy = await signer.signEip712TypedData(eip712Doc);

  return entropy;
}

// Helper: Get quote (for direct USDC swaps on Avalanche)
async function getQuote(
  silentswap: SilentSwapClient,
  signer: EvmSigner,
  group: Awaited<ReturnType<typeof createHdFacilitatorGroupFromEntropy>>,
  recipientAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  tokenAmount: string,
  tokenDecimals: number
) {
  // Derive viewer account
  const viewer = await group.viewer();
  const { publicKeyBytes: pk65_viewer } = viewer.exportPublicKey(
    '*',
    FacilitatorKeyType.SECP256K1
  );

  // Export public keys for facilitator group
  const groupPublicKeys = await group.exportPublicKeys(1, [
    ...PublicKeyArgGroups.GENERIC,
  ]);

  // Request quote
  const [quoteError, quoteResponse] = await silentswap.quote({
    signer: signer.address,
    viewer: pk65_viewer,
    outputs: [
      {
        method: DeliveryMethod.SNIP,
        recipient: recipientAddress,
        asset: caip19FungibleEvmToken(1, tokenAddress),
        value: BigNumber(tokenAmount).shiftedBy(tokenDecimals).toFixed(0) as `${bigint}`,
        facilitatorPublicKeys: groupPublicKeys[0],
      },
    ],
  });

  if (quoteError || !quoteResponse) {
    throw new Error(`Failed to get quote: ${quoteError?.type}: ${quoteError?.error}`);
  }

  return quoteResponse;
}

// Helper: Get quote with bridge (for cross-chain swaps)
async function getQuoteWithBridge(
  silentswap: SilentSwapClient,
  signer: EvmSigner,
  group: Awaited<ReturnType<typeof createHdFacilitatorGroupFromEntropy>>,
  recipientAddress: `0x${string}`,
  destinationTokenAddress: `0x${string}`,
  sourceChainId: number,
  sourceTokenAddress: `0x${string}`,
  sourceAmount: string,
  sourceTokenDecimals: number
) {
  // Step 1: Calculate USDC amount from bridge
  const bridgeResult: SolveUsdcResult = await solveOptimalUsdcAmount(
    sourceChainId,
    sourceTokenAddress,
    BigNumber(sourceAmount).shiftedBy(sourceTokenDecimals).toFixed(0),
    signer.address
  );
  
  // bridgeResult.usdcAmountOut is already in microUSDC (6 decimals)
  const usdcAmount = bridgeResult.usdcAmountOut.toString();

  // Step 2: Derive viewer account
  const viewer = await group.viewer();
  const { publicKeyBytes: pk65_viewer } = viewer.exportPublicKey(
    '*',
    FacilitatorKeyType.SECP256K1
  );

  // Step 3: Export public keys for facilitator group
  const groupPublicKeys = await group.exportPublicKeys(1, [
    ...PublicKeyArgGroups.GENERIC,
  ]);

  // Step 4: Request quote using the bridged USDC amount
  const [quoteError, quoteResponse] = await silentswap.quote({
    signer: signer.address,
    viewer: pk65_viewer,
    outputs: [
      {
        method: DeliveryMethod.SNIP,
        recipient: recipientAddress,
        asset: caip19FungibleEvmToken(1, destinationTokenAddress),
        value: usdcAmount as `${bigint}`,
        facilitatorPublicKeys: groupPublicKeys[0],
      },
    ],
  });

  if (quoteError || !quoteResponse) {
    throw new Error(`Failed to get quote: ${quoteError?.type}: ${quoteError?.error}`);
  }

  return {
    quoteResponse,
    bridgeResult, // Include bridge info for reference
  };
}

// Helper: Create order
async function createOrder(
  silentswap: SilentSwapClient,
  signer: EvmSigner,
  group: Awaited<ReturnType<typeof createHdFacilitatorGroupFromEntropy>>,
  quoteResponse: Awaited<ReturnType<typeof getQuote>>
) {
  // Sign authorizations
  const signedAuths = await Promise.all(
    quoteResponse.authorizations.map(async (g_auth) => ({
      ...g_auth,
      signature: await (async () => {
        if ('eip3009_deposit' === g_auth.type) {
          return await signer.signEip712TypedData(g_auth.eip712);
        }
        throw Error(`Authorization instruction type not implemented: ${g_auth.type}`);
      })(),
    }))
  );

  // Sign the order's EIP-712
  const orderDoc = quoteResponseToEip712Document(quoteResponse);
  const signedQuote = await signer.signEip712TypedData(orderDoc);

  // Approve proxy authorizations
  const facilitatorReplies = await group.approveProxyAuthorizations(
    quoteResponse.facilitators,
    {
      proxyPublicKey: silentswap.proxyPublicKey,
    }
  );

  // Place the order
  const [orderError, orderResponse] = await silentswap.order({
    quote: quoteResponse.quote,
    quoteId: quoteResponse.quoteId,
    authorizations: signedAuths,
    eip712Domain: orderDoc.domain,
    signature: signedQuote,
    facilitators: facilitatorReplies,
  });

  if (orderError || !orderResponse) {
    throw new Error(`Failed to place order: ${orderError?.type}: ${orderError?.error}`);
  }

  return orderResponse;
}

// Helper: Execute deposit
async function executeDeposit(
  client: ReturnType<typeof createWalletClient>,
  orderResponse: Awaited<ReturnType<typeof createOrder>>
) {
  // Parse transaction request
  const txRequestParams = parseTransactionRequestForViem(orderResponse.transaction);

  // Send transaction
  const hash = await client.sendTransaction(txRequestParams);

  // Wait for confirmation
  const txReceipt = await client.waitForTransactionReceipt({ hash });
  console.log(
    `Deposit confirmed: ${BigNumber(orderResponse.response.order.deposit)
      .shiftedBy(-6)
      .toFixed()} USDC at ${txReceipt.transactionHash}`
  );

  return hash;
}

// Helper: Watch for completion
async function watchForCompletion(
  client: ReturnType<typeof createWalletClient>,
  tokenAddress: `0x${string}`,
  recipientAddress: `0x${string}`,
  group: Awaited<ReturnType<typeof createHdFacilitatorGroupFromEntropy>>,
  tokenDecimals: number
) {
  // Get facilitator account for coin type 60 (ETH) at output index 0
  const facilitator0Eth = await group.account('60', 0);
  const facilitator0EthEvm = await facilitator0Eth.evmSigner();

  // Create client for destination chain (Mainnet)
  const destinationClient = createWalletClient({
    chain: mainnet,
    transport: http(),
  }).extend(publicActions);

  // Watch for ERC-20 transfer event
  return new Promise<void>((resolve) => {
    destinationClient.watchContractEvent({
      address: tokenAddress,
      abi: erc20Abi,
      eventName: 'Transfer',
      args: {
        to: recipientAddress,
        from: facilitator0EthEvm.address,
      },
      onLogs: (logs) => {
        for (const log of logs) {
          const { to, value } = log.args;
          console.log(
            `✓ Recipient ${to} received ${BigNumber(value!)
              .shiftedBy(-tokenDecimals)
              .toFixed()} tokens`
          );
        }
        resolve();
      },
    });
  });
}
```

## Usage Example

### Example 1: Direct USDC Swap (Avalanche → Ethereum)

For swaps where you already have USDC on Avalanche:

```typescript
// Execute a Silent Swap: Send 10 USDC from Avalanche to Ethereum
const result = await executeSilentSwap(
  account.address, // Recipient address
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC token address (Ethereum mainnet)
  '10', // Amount in human-readable format (10 USDC)
  6 // USDC has 6 decimals
);

console.log('Silent Swap completed:', result);
// The function internally converts '10' to '10000000' (10 * 10^6)
```

### Example 2: Cross-Chain Swap with Bridge (Ethereum → Ethereum via Avalanche)

For swaps from a different chain (e.g., ETH on Ethereum → USDC on Ethereum):

```typescript
async function executeCrossChainSilentSwap(
  sourceChainId: number,
  sourceTokenAddress: `0x${string}`, // 0x0 for native tokens
  sourceAmount: string,
  sourceTokenDecimals: number,
  recipientAddress: `0x${string}`,
  destinationTokenAddress: `0x${string}`,
  destinationTokenDecimals: number = 6
) {
  try {
    // Step 1: Authenticate and derive entropy
    console.log('Step 1: Authenticating with SilentSwap...');
    const entropy = await authenticateAndDeriveEntropy(silentswap, signer);
    console.log('✓ Authentication successful');

    // Step 2: Create facilitator group
    console.log('\nStep 2: Creating facilitator group...');
    const depositCount = await queryDepositCount(account.address);
    const group = await createHdFacilitatorGroupFromEntropy(
      hexToBytes(entropy),
      depositCount
    );
    console.log(`✓ Facilitator group created (deposit count: ${depositCount})`);

    // Step 3: Calculate USDC amount from bridge
    console.log('\nStep 3: Calculating bridge USDC amount...');
    const bridgeResult = await solveOptimalUsdcAmount(
      sourceChainId,
      sourceTokenAddress,
      BigNumber(sourceAmount).shiftedBy(sourceTokenDecimals).toFixed(0),
      account.address
    );
    
    console.log(`✓ Bridge will provide ${BigNumber(bridgeResult.usdcAmountOut.toString()).shiftedBy(-6).toFixed()} USDC (provider: ${bridgeResult.provider})`);

    // Step 4: Get quote using bridged USDC amount
    console.log('\nStep 4: Requesting quote with bridged USDC...');
    const quoteResult = await getQuoteWithBridge(
      silentswap,
      signer,
      group,
      recipientAddress,
      destinationTokenAddress,
      sourceChainId,
      sourceTokenAddress,
      sourceAmount,
      sourceTokenDecimals
    );
    console.log(`✓ Quote received (Order ID: ${quoteResult.quoteResponse.quoteId})`);

    // Step 5: Sign authorizations and create order
    console.log('\nStep 5: Signing authorizations and creating order...');
    const orderResponse = await createOrder(
      silentswap,
      signer,
      group,
      quoteResult.quoteResponse
    );
    console.log(`✓ Order created (Order ID: ${orderResponse.response.orderId})`);

    // Step 6: Execute deposit (bridge + deposit in one transaction)
    console.log('\nStep 6: Executing bridge and deposit transaction...');
    const depositHash = await executeDeposit(client, orderResponse);
    console.log(`✓ Deposit transaction sent: ${depositHash}`);

    // Step 7: Watch for completion
    console.log('\nStep 7: Watching for order completion...');
    await watchForCompletion(
      client,
      destinationTokenAddress,
      recipientAddress,
      group,
      destinationTokenDecimals
    );

    return {
      orderId: orderResponse.response.orderId,
      depositHash,
      quote: quoteResult.quoteResponse,
      bridgeProvider: bridgeResult.provider,
      usdcAmountReceived: usdcAmount,
    };
  } catch (err) {
    console.error('Cross-chain Silent Swap error:', err);
    throw err;
  }
}

// Usage: Swap 1 ETH from Ethereum to USDC on Ethereum
const result = await executeCrossChainSilentSwap(
  1, // Ethereum mainnet
  '0x0000000000000000000000000000000000000000', // Native ETH
  '1', // 1 ETH
  18, // ETH has 18 decimals
  account.address, // Recipient
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
  6 // USDC has 6 decimals
);
```

### Example 3: Direct USDC Swap (Avalanche → Ethereum)

```typescript
// Example 1: Swap 1.5 ETH (18 decimals)
const ethResult = await executeSilentSwap(
  account.address,
  '0x0000000000000000000000000000000000000000', // Native ETH (use slip44:60 for native)
  '1.5', // 1.5 ETH
  18 // ETH has 18 decimals
);
// Internally converts to: 1500000000000000000

// Example 2: Swap 0.1 WBTC (8 decimals)
const wbtcResult = await executeSilentSwap(
  account.address,
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC token address
  '0.1', // 0.1 WBTC
  8 // WBTC has 8 decimals
);
// Internally converts to: 10000000

// Example 3: Swap 100 USDT (6 decimals)
const usdtResult = await executeSilentSwap(
  account.address,
  '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT token address
  '100', // 100 USDT
  6 // USDT has 6 decimals
);
// Internally converts to: 100000000
```


## Error Handling Example

```typescript
async function safeSilentSwap(...args: Parameters<typeof executeSilentSwap>) {
  try {
    return await executeSilentSwap(...args);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('Failed to get nonce')) {
        console.error('Nonce retrieval failed. Check your connection.');
      } else if (err.message.includes('Failed to authenticate')) {
        console.error('Authentication failed. Check your signature.');
      } else if (err.message.includes('Failed to get quote')) {
        console.error('Quote request failed. Check your parameters.');
      } else if (err.message.includes('Failed to place order')) {
        console.error('Order creation failed. Check your authorizations.');
      } else {
        console.error('Unexpected error:', err.message);
      }
    }
    throw err;
  }
}
```

## Backend Service Example

```typescript
import express from 'express';
import { executeSilentSwap } from './silent-swap';

const app = express();
app.use(express.json());

app.post('/api/silent-swap', async (req, res) => {
  try {
    const { recipientAddress, tokenAddress, amount, decimals } = req.body;

    const result = await executeSilentSwap(
      recipientAddress,
      tokenAddress,
      amount,
      decimals
    );

    res.json({
      success: true,
      orderId: result.orderId,
      depositHash: result.depositHash,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

app.listen(3000, () => {
  console.log('Silent Swap API server running on port 3000');
});
```

## Key Concepts

### Authentication Flow

1. **Get Nonce**: Request a nonce from the SilentSwap API
2. **Sign Message**: Create and sign a SIWE (Sign-In with Ethereum) message
3. **Authenticate**: Send the signed message to get an auth token
4. **Derive Entropy**: Sign the auth token to derive entropy for wallet generation

### Facilitator Group

The facilitator group is a hierarchical deterministic (HD) wallet system that generates:
- **Viewer Account**: Used to observe order execution
- **Facilitator Accounts**: Used to execute the swap on different chains

### Order Flow

1. **Quote**: Request a quote with your desired outputs
2. **Sign Authorizations**: Sign all required authorizations (deposits, meta-txs, etc.)
3. **Sign Order**: Sign the order's EIP-712 typed data
4. **Approve Proxies**: Approve proxy authorizations from facilitator accounts
5. **Place Order**: Submit the complete order to the API
6. **Deposit**: Execute the deposit transaction on the source chain
7. **Watch**: Monitor for completion on the destination chain

## Best Practices

1. **Secure Entropy Storage**: Store entropy securely for wallet recovery

2. **Error Handling**: Always handle errors at each step with meaningful error messages

3. **Transaction Monitoring**: Monitor deposit transactions and watch for completion

4. **Nonce Management**: Use the deposit count from `queryDepositCount()` as the nonce for facilitator groups

5. **Chain Switching**: Ensure you're on the correct chain before executing transactions

6. **Bridge Integration**: Use `solveOptimalUsdcAmount` for cross-chain swaps to automatically calculate the optimal USDC amount after bridging

## Next Steps

- Review [Account Setup](/example/account) for detailed setup instructions
- Learn about [Creating an Order](/example/order) for order creation details
- See [Deposit](/example/deposit) for deposit transaction handling



---
title: Solana Swap Examples
description: Complete examples of Solana-to-EVM and EVM-to-Solana swaps using Core SDK
---

# Solana Swap Examples

This guide demonstrates how to execute Silent Swaps with Solana assets using the Core SDK in a Node.js backend environment. Solana swaps require special handling for bridge operations and address formats.

## Prerequisites

- Solana Web3.js library
- EVM wallet (for facilitator operations and deposit calldata)
- Solana keypair or wallet adapter
- Understanding of CAIP-19 asset identifiers

## Setup

```typescript
import {
  createSilentSwapClient,
  createViemSigner,
  parseTransactionRequestForViem,
  createSignInMessage,
  createEip712DocForWalletGeneration,
  createEip712DocForOrder,
  createHdFacilitatorGroupFromEntropy,
  queryDepositCount,
  hexToBytes,
  quoteResponseToEip712Document,
  solveOptimalUsdcAmount,
  caip19FungibleEvmToken,
  caip19SplToken,
  DeliveryMethod,
  FacilitatorKeyType,
  PublicKeyArgGroups,
  ENVIRONMENT,
  N_RELAY_CHAIN_ID_SOLANA,
  SB58_ADDR_SOL_PROGRAM_SYSTEM,
  isSolanaNativeToken,
  parseSolanaCaip19,
  fetchRelayQuote,
  createPhonyDepositCalldata,
  X_MAX_IMPACT_PERCENT,
  getRelayStatus,
  type SilentSwapClient,
  type EvmSigner,
  type SolveUsdcResult,
} from '@silentswap/sdk';
import { createWalletClient, http, publicActions, erc20Abi, encodeFunctionData, erc20Abi as erc20AbiForEncode } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { avalanche, mainnet } from 'viem/chains';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount } from '@solana/spl-token';
import BigNumber from 'bignumber.js';

// Create EVM wallet client (required for facilitator operations)
const evmAccount = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);
const evmClient = createWalletClient({
  account: evmAccount,
  chain: avalanche,
  transport: http(),
}).extend(publicActions);

// Create EVM signer
const evmSigner = createViemSigner(evmAccount, evmClient);

// Create SilentSwap client
const silentswap = createSilentSwapClient({
  environment: ENVIRONMENT.MAINNET,
  baseUrl: 'https://api.silentswap.com',
});

// Create Solana connection
const solanaConnection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Load Solana keypair (in production, use secure key management)
const solanaKeypair = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(process.env.SOLANA_SECRET_KEY || '[]'))
);
const solanaAddress = solanaKeypair.publicKey.toString();
```

## Example 1: Solana Native SOL → EVM Token Swap

This example swaps native SOL on Solana to USDC on Ethereum.

```typescript
async function executeSolanaToEvmSwap(
  solAmount: string, // Human-readable amount (e.g., "1.5")
  recipientEvmAddress: `0x${string}`,
  destinationTokenAddress: `0x${string}`,
  destinationChainId: number = 1 // Ethereum mainnet
) {
  try {
    // Step 1: Authenticate and derive entropy (using EVM wallet)
    console.log('Step 1: Authenticating with SilentSwap...');
    const entropy = await authenticateAndDeriveEntropy(silentswap, evmSigner);
    console.log('✓ Authentication successful');

    // Step 2: Create facilitator group
    console.log('\nStep 2: Creating facilitator group...');
    const depositCount = await queryDepositCount(evmAccount.address);
    const group = await createHdFacilitatorGroupFromEntropy(
      hexToBytes(entropy),
      depositCount
    );
    console.log(`✓ Facilitator group created (deposit count: ${depositCount})`);

    // Step 3: Calculate optimal USDC amount from Solana bridge
    console.log('\nStep 3: Calculating bridge USDC amount...');
    
    // Parse Solana CAIP-19 for native SOL
    const solanaCaip19 = `solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/slip44:501`;
    const solanaParsed = parseSolanaCaip19(solanaCaip19);
    if (!solanaParsed) {
      throw new Error('Invalid Solana CAIP-19 format');
    }

    // Convert SOL amount to lamports (9 decimals)
    const solAmountBN = BigNumber(solAmount);
    const solAmountInLamports = solAmountBN.shiftedBy(9).toFixed(0);

    // Origin currency for relay.link: system program for native SOL
    const originCurrency = SB58_ADDR_SOL_PROGRAM_SYSTEM;

    // Create phony deposit calldata for solving (uses EVM signer address)
    const depositorAddress = silentswap.s0xDepositorAddress;
    const phonyDepositCalldata = createPhonyDepositCalldata(evmAccount.address);

    // Solve for optimal USDC amount
    // CRITICAL: Pass Solana address for 'user' parameter, EVM address for recipient and deposit calldata
    const bridgeResult: SolveUsdcResult = await solveOptimalUsdcAmount(
      N_RELAY_CHAIN_ID_SOLANA,
      originCurrency, // System program address for native SOL
      solAmountInLamports,
      solanaAddress, // Solana user address (base58)
      phonyDepositCalldata,
      X_MAX_IMPACT_PERCENT,
      depositorAddress,
      evmAccount.address, // EVM address for recipient and deposit calldata
    );

    console.log(`✓ Bridge will provide ${BigNumber(bridgeResult.usdcAmountOut.toString()).shiftedBy(-6).toFixed()} USDC (provider: ${bridgeResult.provider})`);

    // Step 4: Get quote using bridged USDC amount
    console.log('\nStep 4: Requesting quote with bridged USDC...');
    const viewer = await group.viewer();
    const { publicKeyBytes: pk65_viewer } = viewer.exportPublicKey(
      '*',
      FacilitatorKeyType.SECP256K1
    );

    const groupPublicKeys = await group.exportPublicKeys(1, [
      ...PublicKeyArgGroups.GENERIC,
    ]);

    // Request quote with USDC amount from bridge
    const [quoteError, quoteResponse] = await silentswap.quote({
      signer: evmAccount.address, // EVM signer address (matches deposit calldata)
      viewer: pk65_viewer,
      outputs: [
        {
          method: DeliveryMethod.SNIP,
          recipient: recipientEvmAddress,
          asset: caip19FungibleEvmToken(destinationChainId, destinationTokenAddress),
          value: bridgeResult.usdcAmountOut.toString() as `${bigint}`, // USDC amount in microUSDC
          facilitatorPublicKeys: groupPublicKeys[0],
        },
      ],
    });

    if (quoteError || !quoteResponse) {
      throw new Error(`Failed to get quote: ${quoteError?.type}: ${quoteError?.error}`);
    }
    console.log(`✓ Quote received (Order ID: ${quoteResponse.quoteId})`);

    // Step 5: Sign authorizations and create order
    console.log('\nStep 5: Signing authorizations and creating order...');
    const orderResponse = await createOrder(
      silentswap,
      evmSigner,
      group,
      quoteResponse,
      {
        sourceAsset: {
          caip19: solanaCaip19,
          amount: solAmountInLamports,
        },
        sourceSender: {
          contactId: `caip10:solana:*:${solanaAddress}`,
        },
      }
    );
    console.log(`✓ Order created (Order ID: ${orderResponse.response.orderId})`);

    // Step 6: Execute Solana bridge transaction
    console.log('\nStep 6: Executing Solana bridge transaction...');
    const depositTxHash = await executeSolanaBridge(
      solanaCaip19,
      solAmountInLamports,
      bridgeResult.usdcAmountOut.toString(),
      solanaAddress,
      evmAccount.address,
      orderResponse,
      bridgeResult.provider
    );
    console.log(`✓ Bridge transaction completed: ${depositTxHash}`);

    // Step 7: Watch for completion
    console.log('\nStep 7: Watching for order completion...');
    await watchForCompletion(
      evmClient,
      destinationTokenAddress,
      recipientEvmAddress,
      group,
      6 // USDC decimals
    );

    return {
      orderId: orderResponse.response.orderId,
      depositHash: depositTxHash,
      quote: quoteResponse,
      bridgeProvider: bridgeResult.provider,
      usdcAmountReceived: bridgeResult.usdcAmountOut.toString(),
    };
  } catch (err) {
    console.error('Solana to EVM swap error:', err);
    throw err;
  }
}

// Helper: Execute Solana bridge transaction
async function executeSolanaBridge(
  sourceAsset: string,
  sourceAmount: string,
  usdcAmount: string,
  solanaSenderAddress: string,
  evmSignerAddress: `0x${string}`,
  orderResponse: any,
  provider: 'relay' | 'debridge'
): Promise<string> {
  if (provider !== 'relay') {
    throw new Error('Only relay.link is supported for Solana swaps');
  }

  // Get deposit parameters from order
  const depositParams = orderResponse.transaction.metadata?.params;
  if (!depositParams) {
    throw new Error('Missing deposit parameters in order response');
  }

  // Encode deposit calldata (matches React SDK implementation)
  const depositorAddress = silentswap.s0xDepositorAddress;
  const DEPOSITOR_ABI = [
    {
      inputs: [
        {
          components: [
            { internalType: 'address', name: 'signer', type: 'address' },
            { internalType: 'bytes32', name: 'orderId', type: 'bytes32' },
            { internalType: 'address', name: 'notary', type: 'address' },
            { internalType: 'address', name: 'approver', type: 'address' },
            { internalType: 'bytes', name: 'orderApproval', type: 'bytes' },
            { internalType: 'uint256', name: 'approvalExpiration', type: 'uint256' },
            { internalType: 'uint256', name: 'duration', type: 'uint256' },
            { internalType: 'bytes32', name: 'domainSepHash', type: 'bytes32' },
            { internalType: 'bytes32', name: 'payloadHash', type: 'bytes32' },
            { internalType: 'bytes', name: 'typedDataSignature', type: 'bytes' },
            { internalType: 'bytes', name: 'receiveAuthorization', type: 'bytes' },
          ],
          internalType: 'struct SilentSwapV2Gateway.DepositParams',
          name: 'params',
          type: 'tuple',
        },
      ],
      name: 'depositProxy2',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ] as const;

  const depositCalldata = encodeFunctionData({
    abi: DEPOSITOR_ABI,
    functionName: 'depositProxy2',
    args: [
      {
        ...depositParams,
        signer: evmSignerAddress, // EVM signer address (matches quote request)
        approvalExpiration: BigInt(String(depositParams.approvalExpiration)),
        duration: BigInt(String(depositParams.duration)),
      },
    ],
  });

  // Encode USDC approval calldata
  const XG_UINT256_MAX = (1n << 256n) - 1n;
  const S0X_ADDR_USDC_AVALANCHE = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';
  const approveUsdcCalldata = encodeFunctionData({
    abi: erc20AbiForEncode,
    functionName: 'approve',
    args: [depositorAddress, XG_UINT256_MAX],
  });

  // Fetch Relay.link quote for execution (EXACT_OUTPUT with txs)
  const relayQuote = await fetchRelayQuote({
    user: solanaSenderAddress, // Solana address
    referrer: 'silentswap',
    originChainId: N_RELAY_CHAIN_ID_SOLANA,
    destinationChainId: 43114, // Avalanche
    originCurrency: SB58_ADDR_SOL_PROGRAM_SYSTEM, // Native SOL
    destinationCurrency: S0X_ADDR_USDC_AVALANCHE,
    amount: usdcAmount, // Target USDC amount
    tradeType: 'EXACT_OUTPUT', // CRITICAL: use EXACT_OUTPUT for execution
    recipient: evmSignerAddress, // EVM address for recipient
    txsGasLimit: 600_000,
    txs: [
      {
        to: S0X_ADDR_USDC_AVALANCHE,
        value: '0',
        data: approveUsdcCalldata,
      },
      {
        to: depositorAddress,
        value: '0',
        data: depositCalldata,
      },
    ],
  });

  // Execute Solana transactions from relay quote
  const transaction = new Transaction();
  
  for (const step of relayQuote.steps || []) {
    if (step.kind !== 'transaction') continue;
    
    for (const item of step.items) {
      const itemData = item.data as any;
      if ('instructions' in itemData) {
        // Add Solana instructions to transaction
        for (const instruction of itemData.instructions) {
          transaction.add({
            keys: instruction.keys.map((k: any) => ({
              pubkey: new PublicKey(k.pubkey),
              isSigner: k.isSigner,
              isWritable: k.isWritable,
            })),
            programId: new PublicKey(instruction.programId),
            data: Buffer.from(instruction.data, 'base64'),
          });
        }
      }
    }
  }

  // Sign and send Solana transaction
  transaction.recentBlockhash = (await solanaConnection.getLatestBlockhash()).blockhash;
  transaction.feePayer = solanaKeypair.publicKey;
  transaction.sign(solanaKeypair);

  const signature = await solanaConnection.sendRawTransaction(transaction.serialize());
  await solanaConnection.confirmTransaction(signature, 'confirmed');

  // Monitor bridge status
  const requestId = relayQuote.steps?.find((s) => s.requestId)?.requestId;
  if (!requestId) {
    throw new Error('Missing relay.link request ID');
  }

  const depositTxHash = await monitorRelayBridgeStatus(requestId);
  return depositTxHash;
}

// Helper: Monitor relay bridge status
async function monitorRelayBridgeStatus(requestId: string): Promise<string> {
  const { getRelayStatus } = await import('@silentswap/sdk');
  
  while (true) {
    const status = await getRelayStatus(requestId);
    
    if (status.status === 'success') {
      return status.txHashes?.[0] || '0x';
    }
    
    if (status.status === 'failed' || status.status === 'refund') {
      throw new Error(`Bridge failed: ${status.details || 'Unknown error'}`);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
```

## Example 2: EVM Token → Solana SPL Token Swap

This example swaps USDC on Avalanche to USDC SPL token on Solana.

```typescript
async function executeEvmToSolanaSwap(
  usdcAmount: string, // Human-readable amount (e.g., "100")
  recipientSolanaAddress: string, // Base58 Solana address
  destinationTokenMint: string // Base58 SPL token mint address
) {
  try {
    // Step 1: Authenticate and derive entropy
    console.log('Step 1: Authenticating with SilentSwap...');
    const entropy = await authenticateAndDeriveEntropy(silentswap, evmSigner);
    console.log('✓ Authentication successful');

    // Step 2: Create facilitator group
    console.log('\nStep 2: Creating facilitator group...');
    const depositCount = await queryDepositCount(evmAccount.address);
    const group = await createHdFacilitatorGroupFromEntropy(
      hexToBytes(entropy),
      depositCount
    );
    console.log(`✓ Facilitator group created (deposit count: ${depositCount})`);

    // Step 3: Get quote (direct USDC deposit on Avalanche)
    console.log('\nStep 3: Requesting quote...');
    const viewer = await group.viewer();
    const { publicKeyBytes: pk65_viewer } = viewer.exportPublicKey(
      '*',
      FacilitatorKeyType.SECP256K1
    );

    const groupPublicKeys = await group.exportPublicKeys(1, [
      ...PublicKeyArgGroups.GENERIC,
    ]);

    // Convert USDC amount to microUSDC (6 decimals)
    const usdcAmountBN = BigNumber(usdcAmount);
    const usdcAmountMicro = usdcAmountBN.shiftedBy(6).toFixed(0);

    // Create Solana destination CAIP-19
    const solanaDestinationCaip19 = caip19SplToken(
      '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1', // Solana mainnet chain ID
      destinationTokenMint
    );

    // Request quote
    const [quoteError, quoteResponse] = await silentswap.quote({
      signer: evmAccount.address,
      viewer: pk65_viewer,
      outputs: [
        {
          method: DeliveryMethod.SNIP,
          recipient: recipientSolanaAddress, // Base58 Solana address (NOT CAIP-10)
          asset: solanaDestinationCaip19,
          value: usdcAmountMicro as `${bigint}`,
          facilitatorPublicKeys: groupPublicKeys[0],
        },
      ],
    });

    if (quoteError || !quoteResponse) {
      throw new Error(`Failed to get quote: ${quoteError?.type}: ${quoteError?.error}`);
    }
    console.log(`✓ Quote received (Order ID: ${quoteResponse.quoteId})`);

    // Step 4: Sign authorizations and create order
    console.log('\nStep 4: Signing authorizations and creating order...');
    const orderResponse = await createOrder(
      silentswap,
      evmSigner,
      group,
      quoteResponse,
      {
        sourceAsset: {
          caip19: 'eip155:43114/erc20:0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC on Avalanche
          amount: usdcAmountMicro,
        },
        sourceSender: {
          contactId: `caip10:eip155:43114:${evmAccount.address}`,
        },
      }
    );
    console.log(`✓ Order created (Order ID: ${orderResponse.response.orderId})`);

    // Step 5: Execute deposit transaction (direct USDC deposit)
    console.log('\nStep 5: Executing deposit transaction...');
    const depositHash = await executeDeposit(evmClient, orderResponse);
    console.log(`✓ Deposit transaction sent: ${depositHash}`);

    // Step 6: Watch for completion on Solana
    console.log('\nStep 6: Watching for order completion on Solana...');
    await watchForSolanaCompletion(
      solanaConnection,
      destinationTokenMint,
      recipientSolanaAddress,
      group
    );

    return {
      orderId: orderResponse.response.orderId,
      depositHash,
      quote: quoteResponse,
    };
  } catch (err) {
    console.error('EVM to Solana swap error:', err);
    throw err;
  }
}

// Helper: Watch for completion on Solana
async function watchForSolanaCompletion(
  connection: Connection,
  tokenMint: string,
  recipientAddress: string,
  group: Awaited<ReturnType<typeof createHdFacilitatorGroupFromEntropy>>
) {
  // Get facilitator account for Solana (coin type 501)
  const facilitator0Sol = await group.account('501', 0);
  const facilitator0SolEvm = await facilitator0Sol.evmSigner();
  
  // In a real implementation, you would watch for SPL token transfers
  // This is a simplified example - you'd use Solana webhooks or polling
  const recipientPubkey = new PublicKey(recipientAddress);
  const mintPubkey = new PublicKey(tokenMint);
  const ata = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);

  console.log(`Watching for tokens at: ${ata.toString()}`);
  
  // Poll for token account balance
  return new Promise<void>((resolve) => {
    const interval = setInterval(async () => {
      try {
        const account = await getAccount(connection, ata);
        if (account.amount > 0n) {
          console.log(`✓ Recipient received ${account.amount.toString()} tokens`);
          clearInterval(interval);
          resolve();
        }
      } catch (err) {
        // Account doesn't exist yet, continue polling
      }
    }, 2000);
  });
}
```

## Usage Examples

### Example 1: Swap 1 SOL → USDC on Ethereum

```typescript
const result = await executeSolanaToEvmSwap(
  '1', // 1 SOL
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5', // Recipient EVM address
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
  1 // Ethereum mainnet
);

console.log('Swap completed:', result);
```

### Example 2: Swap 100 USDC → USDC SPL on Solana

```typescript
const result = await executeEvmToSolanaSwap(
  '100', // 100 USDC
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Recipient Solana address (base58)
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC SPL token mint
);

console.log('Swap completed:', result);
```

## Key Points

1. **Dual Address Requirement**: 
   - Solana address: For Solana transactions (source swaps)
   - EVM address: For facilitator operations and deposit calldata

2. **Bridge Provider**: Solana swaps use relay.link automatically

3. **Address Formats**:
   - Solana addresses: Base58 format (e.g., `9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM`)
   - EVM addresses: Hex format with 0x prefix

4. **CAIP-19 Identifiers**:
   - Native SOL: `solana:<chainId>/slip44:501`
   - SPL Tokens: `solana:<chainId>/erc20:<tokenMint>`

5. **Trade Type**: Execution quotes must use `EXACT_OUTPUT` with `txs` parameter for Solana swaps

## Helper Functions

These helper functions are used in the examples above. See the [Complete Example](/core/silent-swap/complete-example) for full implementations of common helpers.

```typescript
// Helper: Authenticate and derive entropy
async function authenticateAndDeriveEntropy(
  silentswap: SilentSwapClient,
  signer: EvmSigner
): Promise<`0x${string}`> {
  // Get nonce
  const [nonceError, nonceResponse] = await silentswap.nonce(signer.address);
  if (!nonceResponse || nonceError) {
    throw new Error(`Failed to get nonce: ${nonceError?.type}: ${nonceError?.error}`);
  }

  // Create sign-in message
  const signInMessage = createSignInMessage(
    signer.address,
    nonceResponse.nonce,
    'silentswap.com'
  );

  // Sign message
  const siweSignature = await signer.signEip191Message(signInMessage.message);

  // Authenticate
  const [authError, authResponse] = await silentswap.authenticate({
    siwe: {
      message: signInMessage.message,
      signature: siweSignature,
    },
  });

  if (!authResponse || authError) {
    throw new Error(`Failed to authenticate: ${authError?.type}: ${authError?.error}`);
  }

  // Derive entropy from auth token
  const eip712Doc = createEip712DocForWalletGeneration(authResponse.secretToken);
  const entropy = await signer.signEip712TypedData(eip712Doc);

  return entropy;
}

// Helper: Create order
async function createOrder(
  silentswap: SilentSwapClient,
  signer: EvmSigner,
  group: Awaited<ReturnType<typeof createHdFacilitatorGroupFromEntropy>>,
  quoteResponse: any,
  metadata?: {
    sourceAsset?: { caip19: string; amount: string };
    sourceSender?: { contactId: string };
  }
) {
  // Sign authorizations (empty for Solana swaps)
  const signedAuths = await Promise.all(
    quoteResponse.authorizations.map(async (g_auth: any) => ({
      ...g_auth,
      signature: '0x' as `0x${string}`, // No EIP-3009 for Solana
    }))
  );

  // Sign the order's EIP-712
  const orderDoc = quoteResponseToEip712Document(quoteResponse);
  const signedQuote = await signer.signEip712TypedData(orderDoc);

  // Approve proxy authorizations
  const facilitatorReplies = await group.approveProxyAuthorizations(
    quoteResponse.facilitators,
    {
      proxyPublicKey: silentswap.proxyPublicKey,
    }
  );

  // Place the order
  const [orderError, orderResponse] = await silentswap.order({
    quote: quoteResponse.quote,
    quoteId: quoteResponse.quoteId,
    authorizations: signedAuths,
    eip712Domain: orderDoc.domain,
    signature: signedQuote,
    facilitators: facilitatorReplies,
    metadata,
  });

  if (orderError || !orderResponse) {
    throw new Error(`Failed to place order: ${orderError?.type}: ${orderError?.error}`);
  }

  return orderResponse;
}

// Helper: Execute deposit (for EVM direct deposits)
async function executeDeposit(
  client: ReturnType<typeof createWalletClient>,
  orderResponse: any
) {
  // Parse transaction request
  const txRequestParams = parseTransactionRequestForViem(orderResponse.transaction);

  // Send transaction
  const hash = await client.sendTransaction(txRequestParams);

  // Wait for confirmation
  const txReceipt = await client.waitForTransactionReceipt({ hash });
  console.log(
    `Deposit confirmed: ${BigNumber(orderResponse.response.order.deposit)
      .shiftedBy(-6)
      .toFixed()} USDC at ${txReceipt.transactionHash}`
  );

  return hash;
}

// Helper: Monitor relay bridge status
async function monitorRelayBridgeStatus(requestId: string): Promise<string> {
  while (true) {
    const status = await getRelayStatus(requestId);
    
    if (status.status === 'success') {
      return status.txHashes?.[0] || '0x';
    }
    
    if (status.status === 'failed' || status.status === 'refund') {
      throw new Error(`Bridge failed: ${status.details || 'Unknown error'}`);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// Helper: Watch for completion on EVM chain
async function watchForCompletion(
  client: ReturnType<typeof createWalletClient>,
  tokenAddress: `0x${string}`,
  recipientAddress: `0x${string}`,
  group: Awaited<ReturnType<typeof createHdFacilitatorGroupFromEntropy>>,
  tokenDecimals: number
) {
  // Get facilitator account for coin type 60 (ETH) at output index 0
  const facilitator0Eth = await group.account('60', 0);
  const facilitator0EthEvm = await facilitator0Eth.evmSigner();

  // Create client for destination chain (Mainnet)
  const destinationClient = createWalletClient({
    chain: mainnet,
    transport: http(),
  }).extend(publicActions);

  // Watch for ERC-20 transfer event
  return new Promise<void>((resolve) => {
    destinationClient.watchContractEvent({
      address: tokenAddress,
      abi: erc20Abi,
      eventName: 'Transfer',
      args: {
        to: recipientAddress,
        from: facilitator0EthEvm.address,
      },
      onLogs: (logs) => {
        for (const log of logs) {
          const { to, value } = log.args;
          console.log(
            `✓ Recipient ${to} received ${BigNumber(value!)
              .shiftedBy(-tokenDecimals)
              .toFixed()} tokens`
          );
        }
        resolve();
      },
    });
  });
}
```

## Next Steps

- Review the [Complete Example](/core/silent-swap/complete-example) for general swap patterns
- Learn about [Bridge Operations](/core/simple-bridge/complete-example) for cross-chain bridging
- Check the [React Solana Examples](/react/silent-swap/solana-examples) for frontend implementations

