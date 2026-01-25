# Obscura API Reference

> Complete API documentation for the Obscura backend services.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Intent Endpoints](#intent-endpoints)
4. [Settlement Endpoints](#settlement-endpoints)
5. [Key Management](#key-management)
6. [Solana Integration](#solana-integration)
7. [Error Handling](#error-handling)

---

## Overview

Base URL: `http://localhost:3000` (development)

All endpoints return JSON responses with the following structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

---

## Authentication

Obscura uses WOTS+ signatures for post-quantum authentication.

### Headers

```
X-WOTS-Public-Key: <base64-encoded-public-key>
X-WOTS-Signature: <base64-encoded-signature>
X-WOTS-Key-Index: <key-pool-index>
X-Merkle-Proof: <base64-encoded-proof>
```

---

## Intent Endpoints

### Create Shielded Intent

```http
POST /api/v1/intents
```

**Request Body:**

```typescript
interface CreateIntentRequest {
  // Privacy level
  privacyLevel: 'TRANSPARENT' | 'SHIELDED' | 'COMPLIANT';
  
  // Intent type
  action: 'swap' | 'transfer' | 'bridge';
  
  // Encrypted payload (for SHIELDED/COMPLIANT)
  encryptedPayload?: string;
  
  // Commitment hash
  commitment: string;
  
  // Ephemeral public key for stealth addressing
  ephemeralPubKey: string;
  
  // Chain target
  targetChain: 'ethereum' | 'solana' | 'polygon' | 'arbitrum';
  
  // Deadline (Unix timestamp)
  deadline: number;
  
  // Optional: Viewing key payload for COMPLIANT mode
  viewingKeyPayload?: string;
}
```

**Response:**

```typescript
interface CreateIntentResponse {
  intentId: string;
  commitment: string;
  status: 'pending' | 'matched' | 'settled' | 'expired';
  createdAt: number;
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/intents \
  -H "Content-Type: application/json" \
  -H "X-WOTS-Public-Key: ..." \
  -H "X-WOTS-Signature: ..." \
  -d '{
    "privacyLevel": "SHIELDED",
    "action": "swap",
    "commitment": "0x7a3b...",
    "ephemeralPubKey": "0x...",
    "targetChain": "solana",
    "deadline": 1736700000
  }'
```

### Get Intent Status

```http
GET /api/v1/intents/:intentId
```

**Response:**

```typescript
interface IntentStatus {
  intentId: string;
  commitment: string;
  status: 'pending' | 'matched' | 'settled' | 'expired' | 'failed';
  matchedSolver?: string;
  settlementTx?: string;
  batchId?: number;
  createdAt: number;
  updatedAt: number;
}
```

### List User Intents

```http
GET /api/v1/intents?status=pending&limit=10&offset=0
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| limit | number | Max results (default: 20) |
| offset | number | Pagination offset |

---

## Settlement Endpoints

### Get Batch Status

```http
GET /api/v1/batches/:batchId
```

**Response:**

```typescript
interface BatchStatus {
  batchId: number;
  merkleRoot: string;
  intentCount: number;
  status: 'pending' | 'submitted' | 'confirmed' | 'finalized';
  chain: string;
  txHash?: string;
  blockNumber?: number;
  createdAt: number;
}
```

### Get Settlement Proof

```http
GET /api/v1/settlements/:commitment/proof
```

**Response:**

```typescript
interface SettlementProof {
  commitment: string;
  merkleRoot: string;
  proof: string[];
  leafIndex: number;
  batchId: number;
  verified: boolean;
}
```

### Verify Settlement

```http
POST /api/v1/settlements/verify
```

**Request Body:**

```typescript
interface VerifyRequest {
  commitment: string;
  proof: string[];
  leafIndex: number;
  root: string;
}
```

---

## Key Management

### Register Key Pool

```http
POST /api/v1/keys/register
```

**Request Body:**

```typescript
interface RegisterKeyPoolRequest {
  // Merkle root of public keys
  merkleRoot: string;
  
  // Total keys in pool
  poolSize: number;
  
  // WOTS+ parameters
  params: {
    n: number;      // Hash output length (32)
    w: number;      // Winternitz parameter (16)
    len: number;    // Chain count (67)
  };
}
```

### Get Key Pool Status

```http
GET /api/v1/keys/:merkleRoot
```

**Response:**

```typescript
interface KeyPoolStatus {
  merkleRoot: string;
  poolSize: number;
  usedKeys: number;
  availableKeys: number;
  registeredAt: number;
}
```

### Mark Key Used

```http
POST /api/v1/keys/:merkleRoot/use
```

**Request Body:**

```typescript
interface UseKeyRequest {
  keyIndex: number;
  publicKey: string;
  proof: string[];
}
```

---

## Solana Integration

### Get Priority Fee Estimate

```http
GET /api/v1/solana/priority-fee?accounts=account1,account2
```

**Response:**

```typescript
interface PriorityFeeResponse {
  low: number;      // microLamports
  medium: number;
  high: number;
  veryHigh: number;
  recommended: number;
}
```

### Get Jupiter Quote

```http
GET /api/v1/solana/quote
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| inputMint | string | Input token mint address |
| outputMint | string | Output token mint address |
| amount | string | Input amount in smallest unit |
| slippageBps | number | Max slippage in basis points |

**Response:**

```typescript
interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
}
```

### Create Private Swap Intent

```http
POST /api/v1/solana/private-swap
```

**Request Body:**

```typescript
interface PrivateSwapRequest {
  // Public quote reference
  quoteId: string;
  
  // Encrypted amounts (Arcium)
  encryptedInputAmount: string;
  encryptedMinOutput: string;
  
  // Intent commitment
  commitment: string;
  
  // Deadline
  deadline: number;
  
  // Privacy level
  privacyLevel: 'SHIELDED' | 'COMPLIANT';
}
```

### Get Compressed Account

```http
GET /api/v1/solana/compressed/:address
```

**Response:**

```typescript
interface CompressedAccountResponse {
  address: string;
  owner: string;
  lamports: number;
  data: string;
  tree: string;
  leafIndex: number;
  proof: string[];
}
```

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_SIGNATURE` | 401 | WOTS+ signature verification failed |
| `KEY_ALREADY_USED` | 400 | One-time key has been used |
| `INVALID_PROOF` | 400 | Merkle proof verification failed |
| `INTENT_NOT_FOUND` | 404 | Intent does not exist |
| `INTENT_EXPIRED` | 400 | Intent deadline has passed |
| `BATCH_NOT_FOUND` | 404 | Batch does not exist |
| `INSUFFICIENT_BALANCE` | 400 | Vault balance insufficient |
| `CHAIN_ERROR` | 500 | Blockchain interaction failed |
| `ARCIUM_ERROR` | 500 | Arcium MPC operation failed |
| `RATE_LIMITED` | 429 | Too many requests |

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

**Example:**

```json
{
  "success": false,
  "error": {
    "code": "KEY_ALREADY_USED",
    "message": "WOTS+ key at index 42 has already been used",
    "details": {
      "keyIndex": 42,
      "usedAt": 1736699000
    }
  }
}
```

---

## Rate Limits

| Tier | Requests/min | Burst |
|------|--------------|-------|
| Free | 60 | 10 |
| Pro | 600 | 100 |
| Enterprise | Unlimited | Unlimited |

Rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1736700000
```

---

## WebSocket API

### Connect

```
ws://localhost:3000/ws
```

### Subscribe to Intent Updates

```json
{
  "type": "subscribe",
  "channel": "intent",
  "intentId": "intent_123"
}
```

### Subscribe to Batch Updates

```json
{
  "type": "subscribe",
  "channel": "batch",
  "batchId": 42
}
```

### Event Format

```typescript
interface WebSocketEvent {
  type: 'intent_update' | 'batch_update' | 'settlement';
  data: {
    id: string;
    status: string;
    timestamp: number;
    [key: string]: unknown;
  };
}
```

---

## SDK Integration

For TypeScript/JavaScript integration, use the `@obscura/backend` package:

```typescript
import { ObscuraClient } from '@obscura/backend';

const client = new ObscuraClient({
  baseUrl: 'http://localhost:3000',
  keyManager: wotsKeyManager,
});

// Create intent
const intent = await client.createIntent({
  privacyLevel: 'SHIELDED',
  action: 'swap',
  targetChain: 'solana',
});

// Get status
const status = await client.getIntentStatus(intent.intentId);
```

See [SDK Documentation](./SDK.md) for complete integration guide.
