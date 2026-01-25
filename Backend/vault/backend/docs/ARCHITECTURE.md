# Obscura Architecture

> Technical architecture documentation for the Obscura post-quantum private intent settlement system.

## Table of Contents

1. [System Overview](#system-overview)
2. [Layer Architecture](#layer-architecture)
3. [Data Flow](#data-flow)
4. [Solana Integration Stack](#solana-integration-stack)
5. [Privacy Flow](#privacy-flow)
6. [Settlement Flow](#settlement-flow)

---

## System Overview

Obscura is a layered system that separates concerns for security, privacy, and efficiency:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                                │
│                    Obscura Mobile App | SDK | API                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PRICE DISCOVERY LAYER                               │
│              Orb Explorer | Jupiter Aggregator | DFlow                   │
│                    (Public quotes for reference)                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRIVACY LAYER (SIP)                              │
│         Stealth Addresses | Pedersen Commitments | Encryption            │
│              Privacy Levels: TRANSPARENT | SHIELDED | COMPLIANT          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   CONFIDENTIAL COMPUTING LAYER (Arcium)                  │
│              MPC Auctions | cSPL Tokens | Sealing/Re-encryption          │
│                    (Private execution of intents)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUTHORIZATION LAYER (WOTS+)                           │
│           Post-Quantum Signatures | Key Pool Management                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       AGGREGATION LAYER                                  │
│            Intent Batching | Merkle Tree | Solver Network                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SETTLEMENT LAYER                                   │
│                                                                          │
│   ┌─────────────────────────┐       ┌─────────────────────────────────┐ │
│   │      EVM Contracts      │       │        Solana Programs          │ │
│   │  • SIPSettlement.sol    │       │  • sip-settlement (Anchor)      │ │
│   │  • SIPVault.sol         │       │  • Light Protocol (ZK Compress) │ │
│   │  • MerkleVerifier.sol   │       │  • Helius (Priority Fees)       │ │
│   └─────────────────────────┘       └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Architecture

### 1. Price Discovery Layer

**Purpose:** Obtain public market prices for reference without revealing user intent.

**Components:**
- **Orb Explorer** - Helius block explorer for token research
- **Jupiter Aggregator** - Best swap routes across Solana DEXes
- **DFlow** - Meta-aggregator for optimal execution

**Flow:**
```typescript
// Get public quote (amounts visible)
const quote = await priceDiscovery.getQuote({
  inputMint: KNOWN_MINTS.SOL,
  outputMint: KNOWN_MINTS.USDC,
  amount: '1000000000', // 1 SOL
});

// Use quote as reference for private execution
const privateIntent = await arcium.encryptIntent({
  referenceOutput: quote.outAmount,
  maxSlippage: 50, // 0.5%
});
```

### 2. Privacy Layer (SIP)

**Purpose:** Hide transaction details while maintaining verifiability.

**Components:**
- **Stealth Addresses** (EIP-5564) - One-time recipient addresses
- **Pedersen Commitments** - Amount hiding with homomorphic properties
- **Viewing Keys** - Selective disclosure for compliance

**Privacy Levels:**

| Level | Sender | Recipient | Amount | Use Case |
|-------|--------|-----------|--------|----------|
| TRANSPARENT | Visible | Visible | Visible | Debugging |
| SHIELDED | Hidden | Hidden | Hidden | Maximum privacy |
| COMPLIANT | Encrypted | Encrypted | Encrypted | Regulatory |

### 3. Confidential Computing Layer (Arcium)

**Purpose:** Execute private computations without revealing inputs.

**Components:**
- **MXE Clusters** - Multi-party computation nodes
- **cSPL Tokens** - Confidential SPL token balances
- **Sealing** - Re-encrypt data for specific recipients

**Key Operations:**
```typescript
// Encrypt amount for MPC
const encryptedAmount = await mxe.encryptAmount(1000000000n);

// Run confidential auction (solvers don't see each other's bids)
const winner = await mxe.runConfidentialAuction(solverBids);

// Seal result for user (only user can decrypt)
const sealedResult = await mxe.seal(result, userPubKey);
```

### 4. Authorization Layer (WOTS+)

**Purpose:** Quantum-resistant authorization of intents.

**Components:**
- **WOTSScheme** - Winternitz One-Time Signature implementation
- **KeyManager** - Key pool management with one-time enforcement
- **MerkleTree** - Efficient key membership proofs

**Security Properties:**
- Post-quantum secure (hash-based)
- One-time use enforcement
- Merkle proof of key validity

### 5. Settlement Layer

**Purpose:** Final on-chain execution with minimal state.

**EVM Contracts:**
- `SIPSettlement.sol` - Commitment verification, replay protection
- `SIPVault.sol` - Asset custody, batch withdrawals
- `MerkleVerifier.sol` - Gas-efficient proof verification

**Solana Programs:**
- `sip-settlement` - Anchor program for settlement
- Light Protocol - ZK Compression (~1000x cheaper storage)
- Helius - Priority fees, smart transactions

---

## Data Flow

### Complete Intent Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. PRICE DISCOVERY                                                        │
│    User: "I want to swap 1 SOL for USDC"                                 │
│    → Jupiter Quote: ~150 USDC (public reference)                         │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. INTENT CREATION                                                        │
│    • Generate stealth address for recipient                              │
│    • Create Pedersen commitment for amount                               │
│    • Set privacy level (SHIELDED)                                        │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. ENCRYPTION (Arcium)                                                    │
│    • Encrypt input amount with MXE cluster key                           │
│    • Encrypt minimum output                                              │
│    • Generate intent commitment                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. AUTHORIZATION (WOTS+)                                                  │
│    • Select unused key from pool                                         │
│    • Sign intent commitment                                              │
│    • Mark key as used                                                    │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. SOLVER AUCTION (Arcium MPC)                                           │
│    • Solvers submit encrypted quotes                                     │
│    • MPC compares quotes without revealing amounts                       │
│    • Winner selected fairly                                              │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 6. BATCH AGGREGATION                                                      │
│    • Collect multiple intents                                            │
│    • Build Merkle tree of commitments                                    │
│    • Compute batch root                                                  │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 7. SETTLEMENT                                                             │
│    • Submit batch root on-chain                                          │
│    • Verify Merkle proofs                                                │
│    • Execute transfers via cSPL                                          │
│    • Store compressed records (Light Protocol)                           │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 8. COMPLETION                                                             │
│    • User receives sealed result                                         │
│    • Decrypts with private key                                           │
│    • Funds available at stealth address                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Solana Integration Stack

### Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           OBSCURA BACKEND                                │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐
│     HELIUS      │  │ LIGHT PROTOCOL  │  │          ARCIUM             │
│                 │  │                 │  │                             │
│ • Priority Fees │  │ • ZK Compress   │  │ • MPC Clusters              │
│ • Smart Tx      │  │ • Photon Index  │  │ • cSPL Tokens               │
│ • Webhooks      │  │ • Compressed    │  │ • Confidential Auctions     │
│ • Orb Explorer  │  │   PDAs          │  │ • Sealing/Re-encryption     │
└─────────────────┘  └─────────────────┘  └─────────────────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │  SOLANA DEVNET  │
                    └─────────────────┘
```

### Helius Integration

**Purpose:** Enhanced RPC with priority fees and transaction monitoring.

```typescript
import { HeliusClient, createHeliusClient } from '@obscura/backend/solana';

const helius = createHeliusClient();

// Get priority fee estimate
const fees = await helius.getPriorityFeeEstimate([
  'arcaborPMqYhZbLqPKPRXpBKyCMgH8kApNoxp4cLKg', // Arcium program
]);

// Send smart transaction with auto-retry
const signature = await helius.sendSmartTransaction(serializedTx, {
  maxRetries: 3,
  skipPreflight: false,
});

// Log with Orb explorer link
helius.logTransaction(signature, 'Settlement');
// [Settlement] Explorer: https://orb.helius.dev/tx/...?cluster=devnet
```

### Light Protocol Integration

**Purpose:** ~1000x cheaper state storage via ZK Compression.

```typescript
import { LightProtocolClient } from '@obscura/backend/solana';

const light = new LightProtocolClient(config);

// Compress settlement record
const compressed = await light.compressSettlementRecord(record);
// Cost: ~0.002 SOL vs ~2 SOL for 1000 records

// Query via Photon indexer
const records = await light.getCompressedAccountsByOwner(owner);
```

### Arcium Integration

**Purpose:** Confidential computing for private execution.

```typescript
import { ArciumClient, createArciumClient } from '@obscura/backend/solana';

const arcium = createArciumClient();
await arcium.connect();

// Encrypt swap intent
const encryptedIntent = await arcium.encryptIntent({
  action: 'swap',
  inputAmount: 1000000000n,
  outputAmount: 150000000n,
  deadline: Date.now() + 60000,
});

// Run confidential solver auction
const { winnerId, proof } = await arcium.runSolverAuction(quotes);

// Create compliance disclosure (COMPLIANT mode)
const disclosure = await arcium.getMXEClient().createComplianceDisclosure(
  encryptedSender,
  encryptedRecipient,
  encryptedAmount,
  auditorPubKey,
  intentCommitment
);
```

---

## Privacy Flow

### Public → Private Execution

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PUBLIC PRICE DISCOVERY                            │
│                                                                          │
│   Jupiter Quote: 1 SOL → 150 USDC                                       │
│   Route: Orca (60%) → Raydium (40%)                                     │
│   Price Impact: 0.1%                                                    │
│                                                                          │
│   ⚠️  This is PUBLIC - anyone can see the quote                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Reference price only
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRIVATE INTENT CREATION                           │
│                                                                          │
│   Encrypted Input: [ciphertext]                                         │
│   Encrypted Min Output: [ciphertext]                                    │
│   Commitment: 0x7a3b...                                                 │
│                                                                          │
│   ✅ Amounts are HIDDEN - only commitment is visible                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Encrypted intent
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     CONFIDENTIAL SOLVER AUCTION                          │
│                                                                          │
│   Solver A: [encrypted bid]                                             │
│   Solver B: [encrypted bid]                                             │
│   Solver C: [encrypted bid]                                             │
│                                                                          │
│   MPC Result: Solver B wins (no one knows the amounts)                  │
│                                                                          │
│   ✅ Auction is FAIR - solvers can't see each other's bids             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Winner + proof
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRIVATE SETTLEMENT                                │
│                                                                          │
│   On-chain: Only commitment hash visible                                │
│   cSPL Transfer: Encrypted balances                                     │
│   Result: Sealed for user only                                          │
│                                                                          │
│   ✅ Settlement is PRIVATE - amounts never revealed on-chain            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Compliance Mode (COMPLIANT)

For regulatory requirements, Obscura supports selective disclosure:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COMPLIANT PRIVACY LEVEL                           │
│                                                                          │
│   User Transaction:                                                      │
│   • Public: commitment hash only                                        │
│   • Auditor: can decrypt sender, recipient, amount                      │
│   • Others: cannot see any details                                      │
│                                                                          │
│   Sealing Flow:                                                          │
│   1. User creates intent (encrypted)                                    │
│   2. MPC seals details for auditor's public key                         │
│   3. Auditor can decrypt with their private key                         │
│   4. No one else can see the details                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Settlement Flow

### EVM Settlement

```solidity
// 1. Executor submits batch root
settlement.updateRoot(newRoot);

// 2. Individual settlements with Merkle proofs
settlement.settle(commitment, proof, leafIndex);

// 3. Vault releases funds
vault.executeWithdrawal(commitment, token, recipient, amount, proof, leafIndex, root);
```

### Solana Settlement

```rust
// 1. Update root
sip_settlement::update_root(ctx, new_root)?;

// 2. Settle with proof
sip_settlement::settle(ctx, commitment, proof, leaf_index)?;

// 3. Compressed record storage (Light Protocol)
light_protocol::create_compressed_account(ctx, record_data)?;
```

---

## Configuration

### Environment Variables

```bash
# Helius
HELIUS_API_KEY=your-api-key
HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=...

# Light Protocol
PHOTON_URL=https://devnet.helius-rpc.com/?api-key=...

# Arcium
ARCIUM_CLUSTER_OFFSET=123  # 123, 456, or 789 for devnet
ARCIUM_RPC_URL=https://devnet.helius-rpc.com/?api-key=...
ARCIUM_PROGRAM_ID=arcaborPMqYhZbLqPKPRXpBKyCMgH8kApNoxp4cLKg
```

### Deployed Contracts

| Chain | Contract | Address |
|-------|----------|---------|
| Sepolia | SIPSettlement | `0xA8dd037787334843d13B76a84D6C6DA7E99780c8` |
| Sepolia | SIPVault | `0x583Cb82c7af835B4Eb943ed2BE258DAE9637ac8a` |
| Solana Devnet | sip_settlement | `F9H4qhdinmvW73J4TFEDyDiEmnhzt1uWimPeXaQqYdEE` |

---

## Next Steps

- [API Reference](./API.md)
- [SDK Guide](./SDK.md)
- [Security Model](./SECURITY.md)
