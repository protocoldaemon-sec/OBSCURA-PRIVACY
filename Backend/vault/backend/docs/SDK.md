# Obscura SDK Guide

> Integration guide for the Obscura TypeScript SDK.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Crypto Package](#crypto-package)
4. [Backend Package](#backend-package)
5. [Solana Integrations](#solana-integrations)
6. [Examples](#examples)

---

## Installation

```bash
# Install all packages
pnpm add @obscura/crypto @obscura/backend

# Or install individually
pnpm add @obscura/crypto    # Cryptographic primitives only
pnpm add @obscura/backend   # Backend services (includes crypto)
```

**Requirements:**
- Node.js ≥ 18.0.0
- TypeScript ≥ 5.0 (recommended)

---

## Quick Start

```typescript
import { WOTSScheme, MerkleTree } from '@obscura/crypto';
import { SIPClient, PrivacyLevel } from '@obscura/backend';

// 1. Generate WOTS+ key pair
const wots = new WOTSScheme();
const privateKey = wots.generatePrivateKey();
const publicKey = wots.computePublicKey(privateKey);

// 2. Create SIP client
const client = new SIPClient({
  network: 'devnet',
  chain: 'solana',
  privacyLevel: PrivacyLevel.SHIELDED,
});

// 3. Create shielded intent
const intent = await client.createIntent({
  action: 'swap',
  inputToken: 'SOL',
  outputToken: 'USDC',
  amount: '1000000000', // 1 SOL
});

// 4. Sign with WOTS+
const signature = wots.sign(privateKey, intent.commitment);

// 5. Submit
await client.submitIntent(intent, signature, publicKey);
```

---

## Crypto Package

### WOTSScheme

Core WOTS+ signature implementation.

```typescript
import { WOTSScheme, WOTSParams } from '@obscura/crypto';

// Default parameters (n=32, w=16)
const wots = new WOTSScheme();

// Custom parameters
const customWots = new WOTSScheme({
  n: 32,      // Hash output length
  w: 16,      // Winternitz parameter
  hashFn: 'sha256',
});
```

#### Key Generation

```typescript
// Generate random private key
const privateKey = wots.generatePrivateKey();
// Returns: Uint8Array[] (67 elements, each 32 bytes)

// Compute public key from private key
const publicKey = wots.computePublicKey(privateKey);
// Returns: Uint8Array (32 bytes - compressed)
```

#### Signing

```typescript
// Sign a message (must be 32 bytes or will be hashed)
const message = new Uint8Array(32); // Your message hash
const signature = wots.sign(privateKey, message);
// Returns: Uint8Array[] (67 elements, each 32 bytes)

// ⚠️ IMPORTANT: Each private key can only sign ONE message!
// Reusing a key compromises security.
```

#### Verification

```typescript
// Verify signature
const isValid = wots.verify(publicKey, message, signature);
// Returns: boolean
```

### MerkleTree

Efficient Merkle tree for batch commitments and key pools.

```typescript
import { MerkleTree } from '@obscura/crypto';

// Create tree from leaves
const leaves = [
  new Uint8Array(32), // leaf 0
  new Uint8Array(32), // leaf 1
  // ...
];
const tree = new MerkleTree(leaves);

// Get root
const root = tree.getRoot();
// Returns: Uint8Array (32 bytes)

// Generate proof for leaf at index
const proof = tree.getProof(0);
// Returns: { siblings: Uint8Array[], path: number[] }

// Verify proof
const isValid = MerkleTree.verify(root, leaves[0], proof);
// Returns: boolean
```

### KeyManager

Manages WOTS+ key pools with one-time enforcement.

```typescript
import { KeyManager } from '@obscura/crypto';

// Create key manager with pool size
const keyManager = new KeyManager({
  poolSize: 1000,
  wots: new WOTSScheme(),
});

// Generate all keys (do this once, store securely)
await keyManager.generatePool();

// Get Merkle root (register this on-chain)
const merkleRoot = keyManager.getMerkleRoot();

// Get next available key
const { privateKey, publicKey, index, proof } = keyManager.getNextKey();

// Mark key as used (after successful transaction)
keyManager.markUsed(index);

// Check available keys
const available = keyManager.getAvailableCount();
```

### Hash Utilities

```typescript
import { sha256, domainSeparatedHash } from '@obscura/crypto';

// Simple SHA-256
const hash = sha256(data);

// Domain-separated hash (prevents cross-protocol attacks)
const intentHash = domainSeparatedHash('OBSCURA-INTENT-V1', intentData);
const keyHash = domainSeparatedHash('OBSCURA-WOTS-KEY', keyData);
```

---

## Backend Package

### SIPClient

Main client for interacting with the Obscura protocol.

```typescript
import { SIPClient, PrivacyLevel, Chain } from '@obscura/backend';

const client = new SIPClient({
  // Network configuration
  network: 'devnet',           // 'devnet' | 'mainnet'
  chain: 'solana',             // 'solana' | 'ethereum' | 'polygon'
  
  // Privacy settings
  privacyLevel: PrivacyLevel.SHIELDED,
  
  // Optional: Custom endpoints
  backendUrl: 'http://localhost:3000',
  rpcUrl: 'https://devnet.helius-rpc.com/?api-key=...',
});
```

#### Creating Intents

```typescript
// Swap intent
const swapIntent = await client.createIntent({
  action: 'swap',
  inputToken: 'SOL',
  outputToken: 'USDC',
  amount: '1000000000',
  slippageBps: 50,        // 0.5%
  deadline: Date.now() + 60000,
});

// Transfer intent
const transferIntent = await client.createIntent({
  action: 'transfer',
  token: 'USDC',
  amount: '1000000',
  recipient: recipientStealthAddress,
});

// Bridge intent
const bridgeIntent = await client.createIntent({
  action: 'bridge',
  token: 'USDC',
  amount: '1000000',
  sourceChain: 'ethereum',
  targetChain: 'solana',
  recipient: solanaStealthAddress,
});
```

#### Stealth Addresses

```typescript
// Generate stealth address for recipient
const { stealthAddress, ephemeralPubKey } = await client.generateStealthAddress(
  recipientSpendingKey,
  recipientViewingKey,
);

// Scan for incoming payments (recipient)
const payments = await client.scanStealthPayments(
  viewingPrivateKey,
  spendingPrivateKey,
);
```

### AuthService

WOTS+ authorization service.

```typescript
import { AuthService } from '@obscura/backend';

const auth = new AuthService({
  keyManager,
  backendUrl: 'http://localhost:3000',
});

// Register key pool
await auth.registerKeyPool();

// Authorize intent
const authorization = await auth.authorizeIntent(intent);
// Returns: { signature, publicKey, keyIndex, proof }

// Verify authorization (server-side)
const isValid = await auth.verifyAuthorization(authorization, intent.commitment);
```

---

## Solana Integrations

### Helius Client

Enhanced RPC with priority fees.

```typescript
import { createHeliusClient } from '@obscura/backend/solana';

const helius = createHeliusClient({
  apiKey: process.env.HELIUS_API_KEY,
  cluster: 'devnet',
});

// Get priority fee estimate
const fees = await helius.getPriorityFeeEstimate([
  'arcaborPMqYhZbLqPKPRXpBKyCMgH8kApNoxp4cLKg',
]);
console.log(`Recommended fee: ${fees.recommended} microLamports`);

// Send smart transaction with auto-retry
const signature = await helius.sendSmartTransaction(serializedTx, {
  maxRetries: 3,
  skipPreflight: false,
});

// Log with Orb explorer link
helius.logTransaction(signature, 'Settlement');
```

### Light Protocol Client

ZK Compression for cheap storage.

```typescript
import { LightProtocolClient } from '@obscura/backend/solana';

const light = new LightProtocolClient({
  rpcUrl: process.env.SOLANA_RPC_URL,
  photonUrl: process.env.PHOTON_URL,
});

// Compress settlement record
const compressed = await light.compressSettlementRecord({
  commitment: '0x7a3b...',
  batchId: 42n,
  timestamp: Date.now(),
});

// Query compressed accounts
const accounts = await light.getCompressedAccountsByOwner(ownerPubkey);

// Get Merkle proof for compressed account
const proof = await light.getCompressedAccountProof(accountHash);
```

### Arcium Client

Confidential computing via MPC.

```typescript
import { createArciumClient } from '@obscura/backend/solana';

const arcium = createArciumClient({
  clusterOffset: 123,  // 123, 456, or 789 for devnet
  rpcUrl: process.env.ARCIUM_RPC_URL,
  keypairPath: '~/.config/solana/id.json',
});

await arcium.connect();

// Encrypt intent for MPC
const encryptedIntent = await arcium.encryptIntent({
  action: 'swap',
  inputAmount: 1000000000n,
  outputAmount: 150000000n,
  deadline: Date.now() + 60000,
});

// Run confidential solver auction
const { winnerId, proof } = await arcium.runSolverAuction([
  { solverId: 'A', encryptedQuote: '...' },
  { solverId: 'B', encryptedQuote: '...' },
]);

// cSPL token operations
const cspl = arcium.getCSPLClient();
await cspl.transfer({
  mint: tokenMint,
  from: senderAccount,
  to: recipientAccount,
  encryptedAmount: encryptedAmount,
});
```

### Price Discovery (Orb/Jupiter)

```typescript
import { PriceDiscoveryClient, MarketDataClient } from '@obscura/backend/solana/orb';

// Get swap quote
const priceDiscovery = new PriceDiscoveryClient();
const quote = await priceDiscovery.getQuote({
  inputMint: 'So11111111111111111111111111111111111111112',
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: '1000000000',
  slippageBps: 50,
});

console.log(`Expected output: ${quote.outAmount} USDC`);
console.log(`Price impact: ${quote.priceImpactPct}%`);

// Get market data
const marketData = new MarketDataClient();
const tokenInfo = await marketData.getTokenInfo('SOL');
const price = await marketData.getPrice('SOL');
```

### Private Execution Bridge

Connect public quotes to private execution.

```typescript
import { PrivateExecutionBridge } from '@obscura/backend/solana/orb';

const bridge = new PrivateExecutionBridge({
  arciumClient: arcium,
  priceDiscovery: priceDiscovery,
});

// Get public quote, execute privately
const result = await bridge.executePrivateSwap({
  inputMint: 'SOL',
  outputMint: 'USDC',
  amount: '1000000000',
  maxSlippageBps: 50,
  privacyLevel: 'SHIELDED',
});

console.log(`Intent ID: ${result.intentId}`);
console.log(`Commitment: ${result.commitment}`);
```

---

## Examples

### Complete Swap Flow

```typescript
import { WOTSScheme, KeyManager } from '@obscura/crypto';
import { SIPClient, PrivacyLevel } from '@obscura/backend';
import { createArciumClient, PriceDiscoveryClient } from '@obscura/backend/solana';

async function privateSwap() {
  // 1. Setup
  const wots = new WOTSScheme();
  const keyManager = new KeyManager({ poolSize: 100, wots });
  await keyManager.generatePool();
  
  const client = new SIPClient({
    network: 'devnet',
    chain: 'solana',
    privacyLevel: PrivacyLevel.SHIELDED,
  });
  
  const arcium = createArciumClient();
  await arcium.connect();
  
  // 2. Get public quote (reference only)
  const priceDiscovery = new PriceDiscoveryClient();
  const quote = await priceDiscovery.getQuote({
    inputMint: 'SOL',
    outputMint: 'USDC',
    amount: '1000000000',
  });
  
  // 3. Create private intent
  const intent = await client.createIntent({
    action: 'swap',
    inputToken: 'SOL',
    outputToken: 'USDC',
    amount: '1000000000',
    referenceOutput: quote.outAmount,
    slippageBps: 50,
  });
  
  // 4. Encrypt with Arcium
  const encryptedIntent = await arcium.encryptIntent({
    action: 'swap',
    inputAmount: BigInt(intent.amount),
    outputAmount: BigInt(quote.outAmount),
    deadline: intent.deadline,
  });
  
  // 5. Sign with WOTS+
  const { privateKey, publicKey, index, proof } = keyManager.getNextKey();
  const signature = wots.sign(privateKey, intent.commitment);
  keyManager.markUsed(index);
  
  // 6. Submit
  const result = await client.submitIntent(intent, {
    signature,
    publicKey,
    keyIndex: index,
    proof,
    encryptedIntent,
  });
  
  console.log(`Swap submitted: ${result.intentId}`);
  return result;
}
```

### Batch Settlement

```typescript
import { MerkleTree } from '@obscura/crypto';
import { ExecutorService } from '@obscura/backend';

async function batchSettle(intents: Intent[]) {
  const executor = new ExecutorService({
    chain: 'solana',
    settlementProgram: 'F9H4qhdinmvW73J4TFEDyDiEmnhzt1uWimPeXaQqYdEE',
  });
  
  // Build Merkle tree from commitments
  const commitments = intents.map(i => i.commitment);
  const tree = new MerkleTree(commitments);
  const root = tree.getRoot();
  
  // Submit batch root
  const batchId = await executor.submitBatchRoot(root);
  
  // Generate proofs for each intent
  const settlements = intents.map((intent, index) => ({
    commitment: intent.commitment,
    proof: tree.getProof(index),
    leafIndex: index,
  }));
  
  // Execute settlements
  for (const settlement of settlements) {
    await executor.settle(settlement, batchId);
  }
  
  return batchId;
}
```

---

## TypeScript Types

All types are exported from the packages:

```typescript
import type {
  // Crypto types
  WOTSParams,
  WOTSPrivateKey,
  WOTSPublicKey,
  WOTSSignature,
  MerkleProof,
  
  // Backend types
  Intent,
  ShieldedIntent,
  PrivacyLevel,
  Chain,
  SettlementProof,
  
  // Solana types
  ArciumConfig,
  JupiterQuote,
  CompressedAccount,
} from '@obscura/backend';
```

---

## Next Steps

- [API Reference](./API.md) - Complete endpoint documentation
- [Solana Integrations](./SOLANA-INTEGRATIONS.md) - Detailed Solana setup
- [Architecture](./ARCHITECTURE.md) - System design overview
