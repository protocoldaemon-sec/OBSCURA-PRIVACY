# Solana Integrations Guide

> Detailed setup and usage guide for Obscura's Solana privacy stack.

## Table of Contents

1. [Overview](#overview)
2. [Helius Setup](#helius-setup)
3. [Light Protocol Setup](#light-protocol-setup)
4. [Arcium Setup](#arcium-setup)
5. [Orb/Jupiter Integration](#orbjupiter-integration)
6. [Environment Configuration](#environment-configuration)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Obscura leverages four key Solana integrations:

| Integration | Purpose | Cost Savings |
|-------------|---------|--------------|
| Helius | Enhanced RPC, priority fees | Faster confirmations |
| Light Protocol | ZK Compression | ~1000x cheaper storage |
| Arcium | Confidential computing | Private execution |
| Orb/Jupiter | Price discovery | Best swap rates |

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           OBSCURA BACKEND                                │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   ORB/JUPITER   │  │     HELIUS      │  │ LIGHT PROTOCOL  │  │     ARCIUM      │
│   Price Quotes  │  │   Priority Fees │  │  ZK Compression │  │   MPC Clusters  │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Helius Setup

### 1. Get API Key

1. Visit [helius.dev](https://helius.dev)
2. Create account and get API key
3. Add to environment:

```bash
HELIUS_API_KEY=your-api-key-here
```

### 2. Configure Client

```typescript
import { createHeliusClient, HeliusCluster } from '@obscura/backend/solana';

const helius = createHeliusClient({
  apiKey: process.env.HELIUS_API_KEY!,
  cluster: 'devnet', // 'devnet' | 'mainnet-beta'
});
```

### 3. Priority Fees

```typescript
// Get fee estimate for specific accounts
const fees = await helius.getPriorityFeeEstimate([
  'arcaborPMqYhZbLqPKPRXpBKyCMgH8kApNoxp4cLKg', // Arcium program
  'F9H4qhdinmvW73J4TFEDyDiEmnhzt1uWimPeXaQqYdEE', // Settlement program
]);

console.log('Priority fees (microLamports):');
console.log(`  Low: ${fees.low}`);
console.log(`  Medium: ${fees.medium}`);
console.log(`  High: ${fees.high}`);
console.log(`  Recommended: ${fees.recommended}`);
```

### 4. Smart Transactions

```typescript
// Send with auto-retry and priority fee
const signature = await helius.sendSmartTransaction(serializedTx, {
  maxRetries: 3,
  skipPreflight: false,
  priorityLevel: 'high', // 'low' | 'medium' | 'high' | 'veryHigh'
});

// Log with Orb explorer link
helius.logTransaction(signature, 'Settlement');
// Output: [Settlement] Explorer: https://orb.helius.dev/tx/...?cluster=devnet
```

### 5. Webhooks (Optional)

```typescript
// Register webhook for settlement events
await helius.createWebhook({
  webhookURL: 'https://your-server.com/webhook',
  transactionTypes: ['TRANSFER', 'SWAP'],
  accountAddresses: ['F9H4qhdinmvW73J4TFEDyDiEmnhzt1uWimPeXaQqYdEE'],
});
```

---

## Light Protocol Setup

### 1. Configure Photon Indexer

```bash
# Use Helius as Photon endpoint (recommended)
PHOTON_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Or use dedicated Photon endpoint
PHOTON_URL=https://photon.lightprotocol.com
```

### 2. Initialize Client

```typescript
import { LightProtocolClient } from '@obscura/backend/solana';

const light = new LightProtocolClient({
  rpcUrl: process.env.SOLANA_RPC_URL!,
  photonUrl: process.env.PHOTON_URL!,
});
```

### 3. Compress Settlement Records

```typescript
// Traditional storage: ~0.002 SOL per account
// Compressed storage: ~0.000002 SOL per record (1000x cheaper)

const compressed = await light.compressSettlementRecord({
  commitment: commitmentHash,
  batchId: 42n,
  timestamp: Date.now(),
  status: 'settled',
});

console.log(`Compressed record: ${compressed.hash}`);
console.log(`Tree: ${compressed.tree}`);
console.log(`Leaf index: ${compressed.leafIndex}`);
```

### 4. Query Compressed Accounts

```typescript
// Get all compressed accounts for owner
const accounts = await light.getCompressedAccountsByOwner(ownerPubkey);

for (const account of accounts) {
  console.log(`Account: ${account.hash}`);
  console.log(`  Lamports: ${account.lamports}`);
  console.log(`  Data: ${account.data.length} bytes`);
}

// Get specific account with proof
const { account, proof } = await light.getCompressedAccountWithProof(accountHash);
```

### 5. Verify Compressed Proofs

```typescript
// Verify on-chain (in Anchor program)
const isValid = await light.verifyProof({
  root: merkleRoot,
  leaf: accountHash,
  proof: proof.siblings,
  leafIndex: proof.leafIndex,
});
```

---

## Arcium Setup

### 1. Install CLI

```bash
# Install Arcium CLI
cargo install arcium-cli

# Verify installation
arcium --version
```

### 2. Configure Environment

```bash
# Cluster offset (123, 456, or 789 for devnet v0.5.1)
ARCIUM_CLUSTER_OFFSET=123

# RPC URL (use Helius for reliability)
ARCIUM_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Program ID
ARCIUM_PROGRAM_ID=arcaborPMqYhZbLqPKPRXpBKyCMgH8kApNoxp4cLKg
```

### 3. Deploy MXE (First Time)

```bash
# Deploy MXE to devnet
arcium deploy --cluster-offset 123 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url https://devnet.helius-rpc.com/?api-key=YOUR_KEY \
  --mempool-size Tiny

# Output:
# MXE deployed successfully
# Cluster: 123
# MXE Address: <your-mxe-address>
```

### 4. Initialize Client

```typescript
import { createArciumClient } from '@obscura/backend/solana';

const arcium = createArciumClient({
  clusterOffset: parseInt(process.env.ARCIUM_CLUSTER_OFFSET!),
  rpcUrl: process.env.ARCIUM_RPC_URL!,
  keypairPath: '~/.config/solana/id.json',
});

await arcium.connect();
console.log('Connected to Arcium cluster');
```

### 5. Encrypt Data

```typescript
// Encrypt intent for MPC processing
const encryptedIntent = await arcium.encryptIntent({
  action: 'swap',
  inputAmount: 1000000000n,  // 1 SOL
  outputAmount: 150000000n,   // 150 USDC
  deadline: Date.now() + 60000,
});

console.log(`Encrypted intent: ${encryptedIntent.ciphertext}`);
console.log(`Commitment: ${encryptedIntent.commitment}`);
```

### 6. Confidential Solver Auction

```typescript
// Solvers submit encrypted quotes
const solverQuotes = [
  { solverId: 'solver-a', encryptedQuote: await arcium.encryptQuote(151000000n) },
  { solverId: 'solver-b', encryptedQuote: await arcium.encryptQuote(150500000n) },
  { solverId: 'solver-c', encryptedQuote: await arcium.encryptQuote(149000000n) },
];

// MPC compares quotes without revealing amounts
const { winnerId, proof } = await arcium.runSolverAuction(solverQuotes);

console.log(`Winner: ${winnerId}`); // 'solver-a' (best quote)
// No one knows the actual bid amounts!
```

### 7. cSPL Token Operations

```typescript
const cspl = arcium.getCSPLClient();

// Create confidential token account
const account = await cspl.createAccount(tokenMint);

// Transfer with encrypted amount
await cspl.transfer({
  mint: tokenMint,
  from: senderAccount,
  to: recipientAccount,
  encryptedAmount: await arcium.encryptAmount(1000000n),
});

// Get encrypted balance (only owner can decrypt)
const encryptedBalance = await cspl.getBalance(account);
const balance = await arcium.decryptAmount(encryptedBalance);
```

### 8. Sealing for Compliance

```typescript
const mxe = arcium.getMXEClient();

// Re-encrypt data for specific recipient (auditor)
const sealedDisclosure = await mxe.createComplianceDisclosure(
  encryptedSender,
  encryptedRecipient,
  encryptedAmount,
  auditorPubKey,      // Only auditor can decrypt
  intentCommitment,
);

// Auditor decrypts with their private key
const disclosure = await mxe.decryptDisclosure(sealedDisclosure, auditorPrivKey);
console.log(`Sender: ${disclosure.sender}`);
console.log(`Recipient: ${disclosure.recipient}`);
console.log(`Amount: ${disclosure.amount}`);
```

---

## Orb/Jupiter Integration

### 1. Price Discovery

```typescript
import { PriceDiscoveryClient, KNOWN_MINTS } from '@obscura/backend/solana/orb';

const priceDiscovery = new PriceDiscoveryClient({
  cluster: 'devnet',
});

// Get swap quote
const quote = await priceDiscovery.getQuote({
  inputMint: KNOWN_MINTS.SOL,
  outputMint: KNOWN_MINTS.USDC,
  amount: '1000000000', // 1 SOL in lamports
  slippageBps: 50,      // 0.5%
});

console.log('Quote:');
console.log(`  Input: ${quote.inAmount} lamports`);
console.log(`  Output: ${quote.outAmount} USDC`);
console.log(`  Price impact: ${quote.priceImpactPct}%`);
console.log(`  Route: ${quote.routePlan.map(r => r.swapInfo.label).join(' → ')}`);
```

### 2. Market Data

```typescript
import { MarketDataClient } from '@obscura/backend/solana/orb';

const marketData = new MarketDataClient();

// Get token price
const price = await marketData.getPrice('SOL');
console.log(`SOL price: $${price.usd}`);

// Get token info
const tokenInfo = await marketData.getTokenInfo(KNOWN_MINTS.USDC);
console.log(`Token: ${tokenInfo.name}`);
console.log(`Symbol: ${tokenInfo.symbol}`);
console.log(`Decimals: ${tokenInfo.decimals}`);
console.log(`Verified: ${tokenInfo.verified}`);

// Get market stats
const stats = await marketData.getMarketStats('SOL');
console.log(`24h Volume: $${stats.volume24h}`);
console.log(`Market Cap: $${stats.marketCap}`);
```

### 3. Explorer URLs

```typescript
import { OrbExplorer } from '@obscura/backend/solana/orb';

const explorer = new OrbExplorer('devnet');

// Generate explorer URLs
const txUrl = explorer.getTransactionUrl(signature);
const accountUrl = explorer.getAccountUrl(address);
const tokenUrl = explorer.getTokenUrl(mintAddress);

console.log(`Transaction: ${txUrl}`);
// https://orb.helius.dev/tx/...?cluster=devnet
```

### 4. Private Execution Bridge

```typescript
import { PrivateExecutionBridge } from '@obscura/backend/solana/orb';

const bridge = new PrivateExecutionBridge({
  arciumClient: arcium,
  priceDiscovery: priceDiscovery,
});

// Public quote → Private execution
const result = await bridge.executePrivateSwap({
  inputMint: KNOWN_MINTS.SOL,
  outputMint: KNOWN_MINTS.USDC,
  amount: '1000000000',
  maxSlippageBps: 50,
  privacyLevel: 'SHIELDED',
});

console.log(`Intent ID: ${result.intentId}`);
console.log(`Commitment: ${result.commitment}`);
console.log(`Status: ${result.status}`);
```

---

## Environment Configuration

### Complete `.env` Example

```bash
# ===================
# Solana Configuration
# ===================
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# ===================
# Helius
# ===================
HELIUS_API_KEY=your-helius-api-key

# ===================
# Light Protocol
# ===================
PHOTON_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# ===================
# Arcium
# ===================
ARCIUM_CLUSTER_OFFSET=123
ARCIUM_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
ARCIUM_PROGRAM_ID=arcaborPMqYhZbLqPKPRXpBKyCMgH8kApNoxp4cLKg

# ===================
# Settlement Program
# ===================
SOLANA_SETTLEMENT_PROGRAM=F9H4qhdinmvW73J4TFEDyDiEmnhzt1uWimPeXaQqYdEE
```

### Cluster Configuration

| Cluster | RPC URL | Arcium Offsets |
|---------|---------|----------------|
| Devnet | `https://devnet.helius-rpc.com/?api-key=...` | 123, 456, 789 |
| Mainnet | `https://mainnet.helius-rpc.com/?api-key=...` | TBD |

---

## Troubleshooting

### Helius Issues

**Error: "Rate limit exceeded"**
```
Solution: Upgrade Helius plan or reduce request frequency
```

**Error: "Transaction simulation failed"**
```typescript
// Enable preflight checks for debugging
const signature = await helius.sendSmartTransaction(tx, {
  skipPreflight: false, // Enable simulation
});
```

### Light Protocol Issues

**Error: "Photon indexer unavailable"**
```
Solution: Use Helius RPC as Photon endpoint
PHOTON_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

**Error: "Compressed account not found"**
```typescript
// Wait for indexer to catch up
await new Promise(resolve => setTimeout(resolve, 2000));
const account = await light.getCompressedAccount(hash);
```

### Arcium Issues

**Error: "Cluster not found"**
```bash
# Verify cluster offset is valid (123, 456, or 789)
ARCIUM_CLUSTER_OFFSET=123

# Redeploy MXE if needed
arcium deploy --cluster-offset 123 ...
```

**Error: "MPC computation timeout"**
```typescript
// Increase timeout for complex computations
const result = await arcium.runComputation(input, {
  timeout: 60000, // 60 seconds
});
```

**Error: "Insufficient SOL for rent"**
```bash
# Airdrop SOL on devnet
solana airdrop 2 --url devnet
```

### Jupiter Issues

**Error: "No route found"**
```typescript
// Try with higher slippage
const quote = await priceDiscovery.getQuote({
  ...params,
  slippageBps: 100, // 1%
});

// Or try direct routes only
const quote = await priceDiscovery.getQuote({
  ...params,
  onlyDirectRoutes: true,
});
```

---

## Best Practices

1. **Use Helius RPC** for all Solana operations (reliability + priority fees)
2. **Compress settlement records** with Light Protocol (cost savings)
3. **Encrypt sensitive data** with Arcium before any on-chain operation
4. **Use public quotes as reference only** - actual execution is private
5. **Monitor cluster health** before submitting transactions
6. **Implement retry logic** for network failures

---

## Next Steps

- [API Reference](./API.md) - Complete endpoint documentation
- [SDK Guide](./SDK.md) - TypeScript integration
- [Architecture](./ARCHITECTURE.md) - System design overview
