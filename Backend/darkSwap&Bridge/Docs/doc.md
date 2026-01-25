---
title: React Integration Overview
description: Get started with SilentSwap React hooks for cross-chain swaps
---

# React Integration Overview

SilentSwap provides a comprehensive React integration with hooks for Silent Swap (private/hidden swaps) functionality.

## Full Integration with SilentSwapContext

The recommended way to integrate SilentSwap is using the `SilentSwapProvider`. This consolidated context handles all aspects of the protocol:

- **Authentication** - Automatic SIWE (Sign-In with Ethereum) management
- **Wallet Management** - Generation and caching of facilitator wallets
- **Quoting** - Automated quote fetching and validation
- **Order Tracking** - Real-time monitoring of swap status
- **Balances & Prices** - Global access to user balances and asset prices

## Installation

```bash
pnpm add @silentswap/react @silentswap/sdk
```

## Quick Start

### Full Integration Example

SilentSwap provides a consolidated `SilentSwapProvider` that handles authentication, wallet management, quoting, and order tracking in one place.

```tsx
import { SilentSwapProvider, useSilentSwap, useSwap } from '@silentswap/react';
import { createSilentSwapClient, ENVIRONMENT } from '@silentswap/sdk';
import { useAccount } from 'wagmi';

// 1. Setup the provider at the root of your app
import { useAccount, useWalletClient } from 'wagmi';
import { useUserAddress, useSolanaAdapter } from '@/hooks'; // Your custom hooks

// Initialize the client
const client = createSilentSwapClient({ environment: ENVIRONMENT.STAGING });

function AppProvider({ children }) {
  const { isConnected, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { evmAddress, solAddress } = useUserAddress();
  const { solanaConnector, solanaConnectionAdapter } = useSolanaAdapter();
  
  return (
    <SilentSwapProvider 
      client={client} 
      environment={ENVIRONMENT.STAGING}
      evmAddress={evmAddress}
      solAddress={solAddress}
      isConnected={isConnected}
      connector={connector}
      walletClient={walletClient}
      solanaConnector={solanaConnector}
      solanaConnection={solanaConnectionAdapter}
    >
      {children}
    </SilentSwapProvider>
  );
}

// 2. Use the hook in your components
function SwapForm() {
  const { executeSwap, swapLoading, orderComplete } = useSilentSwap();
  const { tokenIn, inputAmount, destinations, splits } = useSwap();
  const { evmAddress } = useUserAddress();

  const handleSwap = async () => {
    if (!tokenIn || !inputAmount || !evmAddress) return;
    
    const result = await executeSwap({
      sourceAsset: tokenIn.caip19,
      sourceAmount: inputAmount,
      destinations: destinations,
      splits: splits,
      senderContactId: `caip10:eip155:1:${evmAddress}`, // Format: caip10:chainId:address
      integratorId: process.env.NEXT_PUBLIC_INTEGRATOR_ID, // Optional: for tracking
    });
    console.log('Swap initiated:', result);
  };

  return (
    <div>
      <button onClick={handleSwap} disabled={swapLoading}>
        {swapLoading ? 'Swapping...' : 'Execute Swap'}
      </button>
      {orderComplete && <p>Swap Successful!</p>}
    </div>
  );
}
```

## Next Steps

- Learn about [Silent Swap Introduction](/react/silent-swap/introduction)
- Check out the [Complete Example](/react/silent-swap/complete-example)
- Explore [Balances, Prices and Orders hooks](/react/silent-swap/hooks)
- Try the [interactive demos](https://silentswap-sdk-react.vercel.app/)


---
title: Simple Bridge - React
description: Get started with non-hidden cross-chain swaps using React hooks
---

# Simple Bridge - React

The SilentSwap React SDK provides specialized hooks for implementing non-hidden cross-chain swaps (Simple Bridge) in your applications. These hooks handle the complexities of quoting, chain switching, and transaction execution.

## Overview

The Simple Bridge functionality is ideal for users who want to move assets between chains without the overhead of private pools. It uses top-tier bridge providers like **Relay.link** and **deBridge**.

## Core Hooks

- **`useQuote`**: Fetch and compare bridge quotes from multiple providers to find the best rate.
- **`useTransaction`**: Execute the bridge transaction, including token approvals and chain switching.

## Installation

Ensure you have the React SDK and its dependencies installed:

```bash
pnpm add @silentswap/react @silentswap/sdk viem wagmi @tanstack/react-query
```

## Next Steps

- Learn how to fetch [bridge quotes](/react/simple-bridge/use-quote)
- Execute [bridge transactions](/react/simple-bridge/use-transaction)
- See a [complete example](/react/simple-bridge/complete-example)

---
title: useQuote Hook
description: How to fetch cross-chain bridge quotes using the useQuote hook
---

# useQuote

The `useQuote` hook allows you to fetch and compare bridge quotes from multiple providers (Relay.link and deBridge) to find the best rate for a cross-chain swap.

## Usage

```tsx
import { useQuote } from '@silentswap/react';
import { useAccount } from 'wagmi';

function QuoteComponent() {
  const { address } = useAccount();
  const { getQuote, isLoading, error } = useQuote({ address });

  const handleFetchQuote = async () => {
    try {
      const quote = await getQuote(
        1, // Source chain ID (Ethereum)
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Source token (USDC)
        '1000000', // Amount (1e6 units = 1 USDC)
        43114, // Destination chain ID (Avalanche)
        '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' // Destination token (USDC.e)
      );
      
      console.log('Best provider:', quote.provider);
      console.log('Estimated output:', quote.outputAmount);
    } catch (err) {
      console.error('Failed to fetch quote:', err);
    }
  };

  return (
    <button onClick={handleFetchQuote} disabled={isLoading}>
      {isLoading ? 'Fetching Quote...' : 'Get Best Quote'}
    </button>
  );
}
```

## Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `address` | `string` | - | User's address (required for provider-specific optimizations). |
| `maxImpactPercent` | `number` | `5` | Maximum allowed price impact percentage. |

## Return Values

| Property | Type | Description |
| :--- | :--- | :--- |
| `getQuote` | `Function` | Async function to fetch the best quote. Signature: `(srcChainId, srcToken, srcAmount, dstChainId, dstToken, recipientAddress?, sourceAddress?) => Promise<BridgeQuoteResult>`. Optional `recipientAddress` and `sourceAddress` are required for Solana destinations. |
| `estimateLive` | `Function` | Get live estimate for a given direction. Signature: `(direction: 'ingress' \| 'egress', assetCaip19, chainId, tokenAddress, amount, usdPrice, externalSignal?, recipientAddress?, isReverseCalculation?, targetAmount?) => Promise<EstimateResult>`. |
| `interpolateSamples` | `Function` | Interpolate retention rate from samples. Signature: `(samples: EstimateSample[], usdValue: number, marginHi?: number) => number`. |
| `isLoading` | `boolean` | Whether a quote request is currently in flight. |
| `error` | `Error \| null` | Error object if the last request failed. |
| `ingressEstimates` | `Record<string, Estimate>` | Cache of ingress estimates indexed by CAIP-19. |
| `egressEstimates` | `Record<string, Estimate>` | Cache of egress estimates indexed by CAIP-19. |

---
title: useTransaction Hook
description: How to execute cross-chain transactions using the useTransaction hook
---

# useTransaction

The `useTransaction` hook provides a high-level interface for executing bridge transactions. It handles chain switching, token approvals (ERC-20), and transaction submission automatically.

## Usage

```tsx
import { useTransaction, useQuote } from '@silentswap/react';
import { useAccount, useWalletClient } from 'wagmi';

function BridgeAction({ quote }) {
  const { address, connector } = useAccount();
  const { data: walletClient } = useWalletClient();

  const { executeTransaction, isLoading, currentStep, error } = useTransaction({
    address: address!,
    walletClient,
    connector,
  });

  const handleBridge = async () => {
    if (!quote) return;
    
    const result = await executeTransaction(quote);
    if (result) {
      console.log('Bridge transaction submitted:', result.requestId);
    }
  };

  return (
    <div>
      {isLoading && <p>Current Step: {currentStep}</p>}
      <button onClick={handleBridge} disabled={isLoading || !quote}>
        Execute Bridge
      </button>
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
    </div>
  );
}
```

## Options

| Property | Type | Description |
| :--- | :--- | :--- |
| `address` | `string` | User's EVM address (required). |
| `walletClient` | `WalletClient` | Viem wallet client for signing (required for EVM transactions). |
| `connector` | `Connector` | Wagmi connector for chain switching (required for EVM transactions). |
| `solanaConnector` | `SolanaWalletConnector` | Solana wallet connector (required for Solana transactions). |
| `solanaConnection` | `SolanaConnection` | Solana RPC connection (required for Solana transactions). |
| `solanaRpcUrl` | `string` | Optional custom Solana RPC URL. |
| `setCurrentStep` | `Function` | Optional callback to set current step externally. |
| `onStatus` | `Function` | Optional callback for status updates. |

## Return Values

| Property | Type | Description |
| :--- | :--- | :--- |
| `executeTransaction` | `Function` | Async function to execute the bridge based on a `BridgeQuote`. Signature: `(quote: BridgeQuote) => Promise<BridgeStatus \| null>`. Supports both EVM and Solana transactions. |
| `executeSwapTransaction` | `Function` | Execute a deposit transaction from an `OrderResponse`. Signature: `(orderResponse: OrderResponse) => Promise<SwapTransaction>`. |
| `approveTokenSpending` | `Function` | Approve token spending for a given allowance target. Signature: `(chainId, tokenAddress, allowanceTarget, amount, userAddress) => Promise<Hex \| null>`. Returns transaction hash if approval was needed, null otherwise. |
| `getStatus` | `Function` | Fetch the current status of a bridge request. Signature: `(requestId: string, provider: BridgeProvider) => Promise<BridgeStatus \| null>`. |
| `isLoading` | `boolean` | Whether a transaction is being processed. |
| `currentStep` | `string` | Human-readable description of the current step (e.g., "Approving token", "Switching chain"). |
| `error` | `Error \| null` | Error object if the transaction failed. |

---
title: Complete Simple Bridge Example
description: A full React component implementation of a cross-chain bridge
---

# Complete Simple Bridge Example

This example demonstrates a complete bridge component that fetches a quote and executes the transaction.

```tsx
import React, { useState } from 'react';
import { useQuote, useTransaction } from '@silentswap/react';
import { useAccount, useWalletClient } from 'wagmi';

export function SimpleBridge() {
  const { address, connector, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [quote, setQuote] = useState<any>(null);

  // 1. Hook for fetching quotes
  const { getQuote, isLoading: isQuoteLoading } = useQuote({ address });

  // 2. Hook for executing transactions
  const { 
    executeTransaction, 
    isLoading: isTxLoading, 
    currentStep, 
    error: txError 
  } = useTransaction({
    address: address!,
    walletClient,
    connector,
  });

  const handleFetchQuote = async () => {
    const result = await getQuote(
      1, // Source chain ID (Ethereum)
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Source token (USDC)
      '10000000', // Source amount (10 USDC in token units)
      43114, // Destination chain ID (Avalanche)
      '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Destination token (USDC.e)
      // Optional: recipientAddress (required for Solana destinations)
      // Optional: sourceAddress (for relay.link, must match source chain format)
    );
    setQuote(result);
  };

  const handleBridge = async () => {
    if (!quote) return;
    const status = await executeTransaction(quote);
    if (status) {
      alert('Bridge Initiated! Request ID: ' + status.requestId);
    }
  };

  if (!isConnected) return <p>Please connect your wallet.</p>;

  return (
    <div className="bridge-container">
      <h2>Simple Cross-Chain Bridge</h2>
      
      <button onClick={handleFetchQuote} disabled={isQuoteLoading || isTxLoading}>
        {isQuoteLoading ? 'Fetching Quote...' : '1. Get Quote'}
      </button>

      {quote && (
        <div className="quote-details">
          <p>Provider: {quote.provider}</p>
          <p>You will receive: {quote.outputAmount} USDC.e</p>
          
          <button onClick={handleBridge} disabled={isTxLoading}>
            {isTxLoading ? `Step: ${currentStep}` : '2. Execute Bridge'}
          </button>
        </div>
      )}

      {txError && <p className="error">{txError.message}</p>}
    </div>
  );
}
```

## Summary of Flow

1.  **Initialize Hooks**: Use `useQuote` and `useTransaction` with the user's wallet information.
2.  **Fetch Quote**: Call `getQuote` with source and destination details.
3.  **Execute**: Pass the received quote to `executeTransaction`.
4.  **Track**: Monitor the `currentStep` and `isLoading` states for UI updates.

# Silent Swap Introduction

Silent Swap provides private, cross-chain swaps where the connection between the depositor and the recipient is hidden on-chain.

## High-Level Workflow

The Silent Swap process involves several steps, all managed automatically by the `SilentSwapProvider`:

1.  **Authentication**: The user signs a message (SIWE) to authenticate with the SilentSwap backend.
2.  **Wallet Generation**: A temporary, secure facilitator wallet is generated for the user.
3.  **Facilitator Accounts**: User accounts are created on the facilitator wallet, each with its own state.
4.  **Quoting**: The user requests a swap quote.
5.  **Execution**: The user deposits funds into a gateway contract, starting the private swap process.
6.  **Tracking**: The progress of the swap is monitored until the funds are delivered to the destination(s).

## Core Integration Components

### SilentSwapProvider

The `SilentSwapProvider` is the primary entry point for Silent Swap. It encapsulates all the necessary providers and logic to make integration seamless.

```tsx
import { SilentSwapProvider } from '@silentswap/react';
import { createSilentSwapClient, ENVIRONMENT } from '@silentswap/sdk';

const client = createSilentSwapClient({ environment: ENVIRONMENT.STAGING });

function App() {
  const { isConnected, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { evmAddress, solAddress } = useUserAddress();
  const { solanaConnector, solanaConnectionAdapter } = useSolanaAdapter();

  return (
    <SilentSwapProvider 
      client={client} 
      environment={ENVIRONMENT.STAGING}
      evmAddress={evmAddress}
      solAddress={solAddress}
      isConnected={isConnected}
      connector={connector}
      walletClient={walletClient}
      solanaConnector={solanaConnector}
      solanaConnection={solanaConnectionAdapter}
      solanaRpcUrl="https://api.mainnet-beta.solana.com" // Optional: custom RPC URL
      baseUrl={undefined} // Optional: override base URL for API calls
    >
      {/* Your app components */}
    </SilentSwapProvider>
  );
}
```

### useSilentSwap Hook

The `useSilentSwap` hook provides access to the consolidated state and methods for executing swaps and tracking their progress.

```tsx
import { useSilentSwap } from '@silentswap/react';

function SwapForm() {
  const { 
    executeSwap, 
    isSwapping, 
    orderId, 
    orderComplete,
    orderStatusTexts
  } = useSilentSwap();

  // ... implementation
}
```

#### Key Return Values

**Swap Execution:**
- `executeSwap(params)`: Execute a swap with required parameters
  - Parameters:
    - `sourceAsset`: Source asset CAIP-19 identifier (string)
    - `sourceAmount`: Source amount in human-readable units (string, e.g., "1.5")
    - `destinations`: Array of destination objects (Destination[])
    - `splits`: Array of split percentages (number[])
    - `senderContactId`: Contact ID of the sender (string, e.g., "caip10:eip155:*:0x...")
    - `integratorId`: Optional integrator ID for tracking (string, optional)
- `swapLoading`: Boolean indicating if swap is being executed
- `isSwapping`: Boolean indicating if swap is in progress
- `currentStep`: Current step description (e.g., "Fetching quote...")
- `swapError`: Error object if swap failed

**Order Tracking:**
- `orderId`: Current order ID (string | null)
- `orderComplete`: Boolean indicating if order is complete
- `orderProgresses`: Array of progress percentages for each output
- `orderStatusTexts`: Array of status text for each output
- `orderOutputs`: Array of output status objects
- `orderTrackingError`: Error object if tracking failed
- `viewingAuth`: Viewing auth token for the current order

**Fees & Estimates:**
- `serviceFeeUsd`: Service fee in USD
- `bridgeFeeIngressUsd`: Bridge fee for ingress in USD
- `bridgeFeeEgressUsd`: Bridge fee for egress in USD
- `slippageUsd`: Slippage amount in USD
- `overheadUsd`: Overhead fee in USD
- `serviceFeeRate`: Service fee rate (percentage)
- `egressEstimatesLoading`: Boolean indicating if egress estimates are loading
- `fetchEstimates(direction?)`: Function to fetch estimates (input-to-output or output-to-input)

**Wallet & Auth:**
- `wallet`: SilentSwap wallet instance (null if not loaded)
- `walletLoading`: Boolean indicating if wallet is being generated
- `auth`: Auth response (null if not authenticated)
- `authLoading`: Boolean indicating if authentication is in progress

**Utilities:**
- `handleNewSwap()`: Reset form and start a new swap
- `clearQuote()`: Clear the current quote
- `client`: SilentSwap client instance
- `environment`: Current environment
- `config`: Client configuration

### useSwap Hook (Zustand)

The `useSwap` hook manages the local form state, including selected tokens, amounts, and destinations.

```tsx
import { useSwap } from '@silentswap/react';

function SwapForm() {
  const { 
    tokenIn, 
    tokenOut, 
    inputAmount,
    setInputAmount,
    setTokenIn
  } = useSwap();

  // ... implementation
}
```

## Supported Features

- **Cross-Chain Privacy**: Hide the link between sender and recipient.
- **Multi-Output Swaps**: Split a single deposit into multiple destinations.
- **Dynamic Fees**: Real-time service and bridge fee estimation.
- **Automatic Auth**: Seamless SIWE authentication flow.
- **Order Tracking**: Real-time status updates for multi-stage swaps.
- **Solana Support**: Integrated support for Solana both as source and destination.

## Next Steps

- Learn about [Full Integration Example](/react/silent-swap/complete-example)
- Explore [Balances, Prices and Orders hooks](/react/silent-swap/hooks)
# Data & Utility Hooks

The SilentSwap SDK provides several hooks to access protocol data, user balances, and asset prices. These hooks are automatically available within the `SilentSwapProvider`.

## Balances Hook

The `useBalancesContext` hook provides access to the user's cross-chain balances across all supported EVM and Solana chains.

```tsx
import { useBalancesContext, formatBalance } from '@silentswap/react';

function BalanceDisplay() {
  const { balances, loading, totalUsdValue, refetch } = useBalancesContext();

  if (loading) return <div>Loading balances...</div>;

  return (
    <div>
      <h3>Total Portfolio: ${totalUsdValue.toFixed(2)}</h3>
      <ul>
        {Object.values(balances).map((info) => (
          <li key={info.asset.caip19}>
            {info.asset.symbol}: {formatBalance(info.balance, info.asset)} (${info.usdValue.toFixed(2)})
          </li>
        ))}
      </ul>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Return Values
- `balances`: Record of `UserBalance` indexed by CAIP-19 ID
- `loading`: Boolean indicating if balances are being fetched
- `totalUsdValue`: The total value of all tracked assets in USD
- `errors`: Record mapping chain ID (number) or 'solana' to error messages
- `refetch`: Function to manually trigger a balance update for all chains
- `refetchChains`: Function to refetch balances for specific chains: `(chainIds: (number | 'solana')[]) => Promise<void>`

## Prices Hook

The `usePricesContext` hook provides access to real-time asset prices and caching logic.

```tsx
import { usePricesContext } from '@silentswap/react';

function PriceInfo({ asset }) {
  const { getPrice, prices, loadingPrices } = usePricesContext();
  const price = getPrice(asset);

  return (
    <div>
      <p>Current Price: {price ? `$${price.toFixed(2)}` : 'Loading...'}</p>
    </div>
  );
}
```

### Return Values
- `prices`: Record of cached prices indexed by CAIP-19
- `getPrice(asset)`: Function that returns the price for an asset (triggers fetch if not cached)
- `loadingPrices`: Boolean indicating if any price requests are in flight

## Orders Hook

The `useOrdersContext` hook manages the history of Silent Swap orders and provides methods to track them.

```tsx
import { useOrdersContext, type OrdersContextOrder } from '@silentswap/react';

function RecentOrders() {
  const { orders, loading, refreshOrders } = useOrdersContext();

  return (
    <div>
      <h2>Your Swap History</h2>
      {orders.map((order: OrdersContextOrder) => (
        <div key={order.orderId}>
          <span>Order: {order.orderId}</span>
          <span>Status: {order.status}</span>
        </div>
      ))}
    </div>
  );
}
```

### Return Values
- `orders`: Array of recent swap orders
- `loading`: Boolean indicating if orders are being loaded
- `facilitatorGroups`: Array of facilitator groups used for order viewing
- `orderIdToViewingAuth`: Record mapping order IDs to viewing auth tokens
- `orderIdToDefaultPublicKey`: Record mapping order IDs to default public keys
- `refreshOrders()`: Manually refresh the order history
- `addFacilitatorGroup(group)`: Add a facilitator group for order viewing
- `setFacilitatorGroups(groups)`: Replace all facilitator groups
- `clearFacilitatorGroups()`: Clear all facilitator groups and orders
- `setOrderDefaultPublicKey(orderId, publicKey)`: Set default public key for an order
- `getOrderAgeText(modified?)`: Get human-readable order age (e.g., "5 min ago")
- `getStatusInfo(status, refundEligibility?)`: Get status display info with text, color, and pulsing state

## Swap State Hook

The `useSwap` hook provides access to the global swap form state, which is shared across the `SilentSwapProvider`.

```tsx
import { useSwap } from '@silentswap/react';

function AssetSelector() {
  const { tokenIn, setTokenIn } = useSwap();
  
  // Update tokenIn will automatically trigger re-quoting
  // in the SilentSwapProvider
  return (
    <select onChange={(e) => setTokenIn(e.target.value)}>
      {/* ... options */}
    </select>
  );
}
```

### Key State Properties
- `tokenIn`: Currently selected input asset (AssetInfo | null)
- `inputAmount`: Amount of input asset to swap (string)
- `destinations`: Array of swap outputs (recipients and amounts)
- `splits`: Array of split percentages for multi-output swaps (number[])
- `slippage`: Allowed slippage percentage (number)
- `isAutoSlippage`: Whether auto-slippage is enabled (boolean)
- `privacyEnabled`: Whether private swap features are active (boolean)
- `usdInputMode`: Whether input mode is in USD (boolean)

### Key Methods
- `setTokenIn(token)`: Set the input asset
- `setInputAmount(amount)`: Set the input amount
- `setDestinations(updater)`: Update destinations (accepts array or function)
- `setSplits(updater)`: Update splits array (accepts array or function)
- `setSlippage(value)`: Set slippage percentage
- `setIsAutoSlippage(value)`: Enable/disable auto-slippage
- `updateDestinationAsset(index, asset)`: Update asset for a destination
- `updateDestinationContact(index, contact)`: Update contact/address for a destination
- `updateDestinationAmount(index, amount)`: Update amount for a destination
- `handleAddOutput(caip19Asset?, defaultAddress?)`: Add a new output destination
- `handleDeleteOutput(index)`: Delete an output destination
- `toggleUsdInputMode()`: Toggle between token and USD input mode
- `getCanAddOutput()`: Check if more outputs can be added (max 5)
- `getHasMultipleOutputs()`: Check if there are multiple outputs
# Complete Integration Example

This example demonstrates how to integrate SilentSwap into a React application using the `SilentSwapProvider` and the `useSilentSwap` hook.

## 1. Setup Provider

The first step is to wrap your application with the `SilentSwapProvider`. This provider manages the global state and provides the necessary context for the hooks.

```tsx
// providers/provider.tsx
'use client';

import React from 'react';
import { SilentSwapProvider, useSolanaAdapter } from '@silentswap/react';
import { createSilentSwapClient, ENVIRONMENT } from '@silentswap/sdk';
import { useAccount, useWalletClient } from 'wagmi';
import { useUserAddress } from '@/hooks/useUserAddress';

// Initialize the client
const environment = ENVIRONMENT.STAGING;
const client = createSilentSwapClient({ environment });

export default function Provider({ children }: { children: React.ReactNode }) {
  const { isConnected, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { evmAddress, solAddress } = useUserAddress();
  
  // Use the built-in Solana adapter hook if you need Solana support
  const { solanaConnector, solanaConnectionAdapter } = useSolanaAdapter();

  return (
    <SilentSwapProvider
      client={client}
      environment={environment}
      evmAddress={evmAddress}
      solAddress={solAddress}
      isConnected={isConnected}
      connector={connector}
      walletClient={walletClient}
      solanaConnector={solanaConnector}
      solanaConnection={solanaConnectionAdapter}
      solanaRpcUrl="https://api.mainnet-beta.solana.com" // Optional: custom RPC URL
      baseUrl={undefined} // Optional: override base URL for API calls
    >
      {children}
    </SilentSwapProvider>
  );
}
```

## 2. Implement Swap Form

The `useSilentSwap` hook provides everything you need to execute and track a swap.

```tsx
// components/SwapForm.tsx
'use client';

import React from 'react';
import { useSilentSwap, useSwap, formatUsdValue } from '@silentswap/react';
import { useUserAddress } from '@/hooks/useUserAddress';

export function SwapForm() {
  // 1. Get swap settings from useSwap (managed via Zustand)
  const { 
    tokenIn, 
    tokenOut, 
    inputAmount, 
    setInputAmount, 
    destinations,
    splits
  } = useSwap();

  // 2. Get swap logic and status from useSilentSwap
  const {
    executeSwap,
    isSwapping,
    swapLoading,
    currentStep,
    orderId,
    orderComplete,
    orderStatusTexts,
    handleNewSwap,
    serviceFeeUsd,
    bridgeFeeIngressUsd,
    bridgeFeeEgressUsd,
    slippageUsd,
    overheadUsd,
    egressEstimatesLoading
  } = useSilentSwap();

  // Get user address for senderContactId
  const { evmAddress, solAddress } = useUserAddress();

  const handleExecute = async () => {
    try {
      if (!tokenIn || !inputAmount) {
        alert('Please select a token and enter an amount');
        return;
      }

      // Determine sender contact ID based on source asset chain
      const isSourceSolana = tokenIn.caip19.startsWith('solana:');
      const senderContactId = isSourceSolana && solAddress
        ? `caip10:solana:*:${solAddress}`
        : evmAddress
        ? `caip10:eip155:1:${evmAddress}`
        : '';

      if (!senderContactId) {
        alert('Wallet address required');
        return;
      }

      // Execute swap with all required parameters
      const result = await executeSwap({
        sourceAsset: tokenIn.caip19,
        sourceAmount: inputAmount,
        destinations: destinations,
        splits: splits,
        senderContactId: senderContactId,
        integratorId: process.env.NEXT_PUBLIC_INTEGRATOR_ID, // Optional: for tracking
      });
      
      if (result) {
        console.log('Swap initiated:', result.orderId);
      }
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  if (orderComplete && orderId) {
    return (
      <div className="p-6 bg-green-50 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Swap Complete!</h2>
        <p>Order ID: {orderId}</p>
        <button 
          onClick={handleNewSwap}
          className="mt-4 px-6 py-2 bg-yellow text-black font-semibold rounded-lg"
        >
          New Swap
        </button>
      </div>
    );
  }

  const totalFeesUsd = serviceFeeUsd + bridgeFeeIngressUsd + bridgeFeeEgressUsd;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-md mx-auto bg-zinc-900 rounded-2xl text-white">
      {/* Input Section */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">Input Amount ({tokenIn?.symbol})</label>
        <input 
          type="text" 
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
          placeholder="0.00"
          className="p-4 bg-zinc-800 border-none rounded-xl text-xl outline-none focus:ring-1 focus:ring-yellow/50"
          disabled={isSwapping}
        />
      </div>

      {/* Fee Breakdown */}
      <div className="space-y-2 p-4 bg-zinc-800/50 rounded-xl text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">Total Fees:</span>
          <span>${formatUsdValue(totalFeesUsd)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Price Impact:</span>
          <span className="text-red-400">-${formatUsdValue(slippageUsd)}</span>
        </div>
      </div>

      {/* Status Tracking */}
      {isSwapping && (
        <div className="p-4 bg-yellow/10 border border-yellow/20 rounded-xl">
          <p className="font-semibold text-yellow mb-2">Status: {currentStep || 'Processing'}</p>
          <div className="space-y-2">
            {orderStatusTexts.map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow animate-pulse" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleExecute}
        disabled={isSwapping || swapLoading || egressEstimatesLoading || !inputAmount}
        className="w-full py-4 bg-yellow text-black font-bold rounded-xl disabled:opacity-20 disabled:cursor-not-allowed transition-opacity"
      >
        {isSwapping ? 'Executing Swap...' : 'Swap Now'}
      </button>
    </div>
  );
}
```

## 3. Using Data Hooks

SilentSwap also provides hooks for accessing shared data like balances, prices, and orders.

```tsx
import { useBalancesContext, usePricesContext, useOrdersContext } from '@silentswap/react';

function UserInfo() {
  const { balances, totalUsdValue } = useBalancesContext();
  const { prices } = usePricesContext();
  const { orders } = useOrdersContext();

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-bold">Your Portfolio (${totalUsdValue.toFixed(2)})</h3>
      <div className="grid grid-cols-2 gap-4">
        {Object.values(balances).map(b => (
          <div key={b.asset.caip19} className="p-3 border rounded">
            {b.asset.symbol}: {b.balance.toString()} (${b.usdValue.toFixed(2)})
          </div>
        ))}
      </div>
      
      <h3 className="text-lg font-bold mt-4">Recent Orders</h3>
      <ul className="space-y-2">
        {orders.map(o => (
          <li key={o.orderId} className="text-sm">
            {o.orderId.slice(0, 8)}... - {o.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
```
---
title: Solana Swap Examples
description: Complete examples of Solana-to-EVM and EVM-to-Solana swaps using React hooks
---

# Solana Swap Examples

This guide demonstrates how to execute Silent Swaps with Solana assets using the React SDK. Solana swaps require special handling for both source (Solana → EVM) and destination (EVM → Solana) scenarios.

## Prerequisites

- Solana wallet adapter configured (e.g., Phantom, Solflare)
- EVM wallet connected (for facilitator operations)
- Both wallets must be connected simultaneously

## Example 1: Solana Native SOL → EVM Token Swap

This example swaps native SOL on Solana to a token on an EVM chain (e.g., USDC on Ethereum).

```tsx
'use client';

import React, { useState } from 'react';
import { useSilentSwap, useSwap } from '@silentswap/react';
import { useAccount, useWalletClient } from 'wagmi';
import { useSolanaAdapter } from '@silentswap/react';
import { useUserAddress } from '@/hooks/useUserAddress';

export function SolanaToEvmSwap() {
  const { evmAddress, solAddress } = useUserAddress();
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { solanaConnector, solanaConnectionAdapter } = useSolanaAdapter();
  
  const {
    executeSwap,
    isSwapping,
    currentStep,
    orderId,
    orderComplete,
    swapError,
  } = useSilentSwap();

  const { tokenIn, inputAmount, setInputAmount, destinations, setDestinations } = useSwap();
  const [amount, setAmount] = useState('');

  const handleSwap = async () => {
    if (!solAddress || !evmAddress) {
      alert('Both Solana and EVM wallets must be connected');
      return;
    }

    if (!solanaConnector?.publicKey) {
      alert('Solana wallet not connected');
      return;
    }

    try {
      // Set source asset to native SOL on Solana
      // CAIP-19 format: solana:<chainId>/slip44:501
      setInputAmount(amount);
      
      // Set destination (e.g., USDC on Ethereum)
      setDestinations([{
        asset: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
        contact: `caip10:eip155:1:${evmAddress}`, // Recipient EVM address
        amount: '',
      }]);

      // Execute swap - all parameters are required
      const result = await executeSwap({
        sourceAsset: 'solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/slip44:501', // Native SOL
        sourceAmount: amount,
        destinations: [{
          asset: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          contact: `caip10:eip155:1:${evmAddress}`,
          amount: '',
        }],
        splits: [1], // Split percentages (must sum to 1.0)
        senderContactId: `caip10:solana:*:${solAddress}`, // Solana sender in CAIP-10 format
        integratorId: process.env.NEXT_PUBLIC_INTEGRATOR_ID, // Optional: for tracking
      });

      if (result) {
        console.log('Swap initiated:', result.orderId);
      }
    } catch (error) {
      console.error('Swap failed:', error);
      alert(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 max-w-md mx-auto bg-zinc-900 rounded-2xl text-white">
      <h2 className="text-2xl font-bold mb-4">Swap SOL → USDC</h2>
      
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">SOL Amount</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="p-4 bg-zinc-800 border-none rounded-xl text-xl outline-none"
          disabled={isSwapping}
        />
        <p className="text-xs text-zinc-500">
          Solana Address: {solAddress?.slice(0, 8)}...{solAddress?.slice(-8)}
        </p>
      </div>

      {isSwapping && (
        <div className="p-4 bg-yellow/10 border border-yellow/20 rounded-xl">
          <p className="font-semibold text-yellow">Status: {currentStep || 'Processing'}</p>
        </div>
      )}

      {swapError && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
          <p className="text-red-400">Error: {swapError.message}</p>
        </div>
      )}

      {orderComplete && orderId && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
          <p className="text-green-400">Swap Complete! Order ID: {orderId}</p>
        </div>
      )}

      <button
        onClick={handleSwap}
        disabled={isSwapping || !amount || !solAddress || !evmAddress}
        className="w-full py-4 bg-yellow text-black font-bold rounded-xl disabled:opacity-20 disabled:cursor-not-allowed"
      >
        {isSwapping ? 'Executing Swap...' : 'Swap SOL → USDC'}
      </button>
    </div>
  );
}
```

## Example 2: EVM Token → Solana SPL Token Swap

This example swaps a token on an EVM chain (e.g., USDC on Avalanche) to an SPL token on Solana.

```tsx
'use client';

import React, { useState } from 'react';
import { useSilentSwap, useSwap } from '@silentswap/react';
import { useAccount, useWalletClient } from 'wagmi';
import { useSolanaAdapter } from '@silentswap/react';
import { useUserAddress } from '@/hooks/useUserAddress';

export function EvmToSolanaSwap() {
  const { evmAddress, solAddress } = useUserAddress();
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { solanaConnector, solanaConnectionAdapter } = useSolanaAdapter();
  
  const {
    executeSwap,
    isSwapping,
    currentStep,
    orderId,
    orderComplete,
    swapError,
  } = useSilentSwap();

  const { tokenIn, inputAmount, setInputAmount, destinations, setDestinations } = useSwap();
  const [amount, setAmount] = useState('');

  const handleSwap = async () => {
    if (!solAddress || !evmAddress) {
      alert('Both Solana and EVM wallets must be connected');
      return;
    }

    if (!solanaConnector?.publicKey) {
      alert('Solana wallet not connected');
      return;
    }

    try {
      // Set source asset to USDC on Avalanche
      setInputAmount(amount);
      
      // Set destination to USDC SPL token on Solana
      // CAIP-19 format: solana:<chainId>/erc20:<tokenAddress>
      setDestinations([{
        asset: 'solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/erc20:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC SPL
        contact: `caip10:solana:*:${solAddress}`, // Recipient Solana address (base58)
        amount: '',
      }]);

      // Execute swap - all parameters are required
      const result = await executeSwap({
        sourceAsset: 'eip155:43114/erc20:0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC on Avalanche
        sourceAmount: amount,
        destinations: [{
          asset: 'solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/erc20:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          contact: `caip10:solana:*:${solAddress}`, // Must be base58 Solana address in CAIP-10 format
          amount: '',
        }],
        splits: [1], // Split percentages (must sum to 1.0)
        senderContactId: `caip10:eip155:43114:${evmAddress}`, // EVM sender in CAIP-10 format
        integratorId: process.env.NEXT_PUBLIC_INTEGRATOR_ID, // Optional: for tracking
      });

      if (result) {
        console.log('Swap initiated:', result.orderId);
      }
    } catch (error) {
      console.error('Swap failed:', error);
      alert(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 max-w-md mx-auto bg-zinc-900 rounded-2xl text-white">
      <h2 className="text-2xl font-bold mb-4">Swap USDC → SOL USDC</h2>
      
      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">USDC Amount (Avalanche)</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="p-4 bg-zinc-800 border-none rounded-xl text-xl outline-none"
          disabled={isSwapping}
        />
        <p className="text-xs text-zinc-500">
          EVM Address: {evmAddress?.slice(0, 8)}...{evmAddress?.slice(-8)}
        </p>
        <p className="text-xs text-zinc-500">
          Solana Address: {solAddress?.slice(0, 8)}...{solAddress?.slice(-8)}
        </p>
      </div>

      {isSwapping && (
        <div className="p-4 bg-yellow/10 border border-yellow/20 rounded-xl">
          <p className="font-semibold text-yellow">Status: {currentStep || 'Processing'}</p>
        </div>
      )}

      {swapError && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
          <p className="text-red-400">Error: {swapError.message}</p>
        </div>
      )}

      {orderComplete && orderId && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
          <p className="text-green-400">Swap Complete! Order ID: {orderId}</p>
        </div>
      )}

      <button
        onClick={handleSwap}
        disabled={isSwapping || !amount || !solAddress || !evmAddress}
        className="w-full py-4 bg-yellow text-black font-bold rounded-xl disabled:opacity-20 disabled:cursor-not-allowed"
      >
        {isSwapping ? 'Executing Swap...' : 'Swap USDC → SOL USDC'}
      </button>
    </div>
  );
}
```

## Key Points for Solana Swaps

### Address Format Requirements

1. **Solana Addresses**: Must be base58 format (e.g., `9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM`)
2. **Contact IDs**: Use CAIP-10 format:
   - Solana: `caip10:solana:*:${solanaAddress}`
   - EVM: `caip10:eip155:${chainId}:${evmAddress}`

### CAIP-19 Asset Identifiers

- **Native SOL**: `solana:<chainId>/slip44:501`
- **SPL Tokens**: `solana:<chainId>/erc20:<tokenAddress>` (base58 token mint address)

### Important Notes

1. **Dual Wallet Requirement**: Both Solana and EVM wallets must be connected:
   - Solana wallet: For signing Solana transactions (source swaps)
   - EVM wallet: For facilitator operations and deposit calldata

2. **Bridge Provider**: Solana swaps automatically use relay.link for bridging to Avalanche

3. **Recipient Address Validation**: 
   - For Solana destinations, the `contact` field must contain a valid base58 Solana address
   - The SDK validates this automatically and will throw an error if invalid

4. **Deposit Calldata**: For Solana source swaps, the deposit calldata uses the EVM signer address (not the Solana address), matching the quote request signer

## Complete Provider Setup

```tsx
// providers/provider.tsx
'use client';

import React from 'react';
import { SilentSwapProvider, useSolanaAdapter } from '@silentswap/react';
import { createSilentSwapClient, ENVIRONMENT } from '@silentswap/sdk';
import { useAccount, useWalletClient } from 'wagmi';
import { useUserAddress } from '@/hooks/useUserAddress';

const environment = ENVIRONMENT.STAGING;
const client = createSilentSwapClient({ environment });

export default function Provider({ children }: { children: React.ReactNode }) {
  const { isConnected, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { evmAddress, solAddress } = useUserAddress();
  
  // Solana adapter hook - required for Solana swaps
  const { solanaConnector, solanaConnectionAdapter } = useSolanaAdapter();

  return (
    <SilentSwapProvider
      client={client}
      environment={environment}
      evmAddress={evmAddress}
      solAddress={solAddress}
      isConnected={isConnected}
      connector={connector}
      walletClient={walletClient}
      solanaConnector={solanaConnector}
      solanaConnection={solanaConnectionAdapter}
      solanaRpcUrl="https://api.mainnet-beta.solana.com" // Optional: custom RPC URL
    >
      {children}
    </SilentSwapProvider>
  );
}
```

## Error Handling

Common errors and solutions:

```tsx
try {
  await executeSwap({...});
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('Solana address required')) {
      // Solana wallet not connected
      alert('Please connect your Solana wallet');
    } else if (error.message.includes('EVM address required')) {
      // EVM wallet not connected
      alert('Please connect your EVM wallet');
    } else if (error.message.includes('Invalid Solana recipient address')) {
      // Invalid address format in destination contact field
      alert('Invalid Solana address. Must be base58 format.');
    } else if (error.message.includes('Price impact too high')) {
      // Bridge price impact exceeded
      alert('Price impact too high. Try a smaller amount.');
    }
  }
}
```

## Next Steps

- Review the [Complete Example](/react/silent-swap/complete-example) for general swap patterns
- Learn about [Data & Utility Hooks](/react/silent-swap/hooks) for accessing balances and prices
- Check the [Core SDK Solana Examples](/core/silent-swap/solana-examples) for backend implementations
