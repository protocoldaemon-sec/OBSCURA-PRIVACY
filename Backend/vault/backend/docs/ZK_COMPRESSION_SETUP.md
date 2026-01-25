# ZK Compression Setup Guide

This guide explains how to set up and use Light Protocol ZK Compression for ~1000x cheaper on-chain storage.

## Prerequisites

1. **Solana CLI** installed
2. **Devnet SOL** for transaction fees
3. **Helius API Key** (recommended for reliable RPC)

## Step 1: Generate Payer Keypair

The payer keypair is used to sign and pay for compressed transactions.

```bash
# Generate new keypair
solana-keygen new --outfile light-payer.json

# Get the public key
solana-keygen pubkey light-payer.json

# Fund with devnet SOL (need ~0.1 SOL for fees)
solana airdrop 1 <PUBLIC_KEY> --url devnet
```

## Step 2: Convert Keypair to Base64

```bash
# On Linux/Mac
cat light-payer.json | base64 -w 0

# On Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("light-payer.json"))
```

## Step 3: Configure Environment Variables

Add to your `.env` file:

```bash
# Light Protocol Configuration
PHOTON_URL=https://devnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
LIGHT_PROVER_URL=https://prover.lightprotocol.com
LIGHT_PAYER_PRIVATE_KEY=<BASE64_FROM_STEP_2>
ENABLE_COMPRESSION=true
```

## Step 4: Verify Setup

Start the backend and check logs:

```bash
cd backend/packages/backend
pnpm dev
```

Look for:
```
[Light] Connected to Light Protocol (indexer: healthy, lag: 0 slots)
[Light] Payer configured: <YOUR_PUBLIC_KEY>
```

## How It Works

### Without ZK Compression (Traditional)
```
1000 settlement records = 1000 accounts = ~2 SOL rent
Cost: ~$200 (at $100/SOL)
```

### With ZK Compression
```
1000 settlement records = 1 Merkle tree = ~0.002 SOL
Cost: ~$0.20 (at $100/SOL)
Savings: 99.9% (~1000x cheaper)
```

## What Gets Compressed

1. **Settlement Records** - Batch settlement data
2. **Intent Commitments** - Intent hashes and metadata
3. **Audit Records** - Compliance data (compliant mode only)

## Transaction Flow

### 1. Store Settlement Record
```typescript
// Called automatically after batch settlement
await lightClient.storeSettlementRecord({
  batchId: 'batch-123',
  chain: 'solana',
  txHash: '5fmG66Xz...',
  status: 'confirmed',
  settledAt: Date.now()
});
```

**On-Chain Result:**
- Creates compressed PDA with settlement data
- Stores in Merkle tree (not regular account)
- Returns transaction signature

### 2. Store Intent Commitment
```typescript
// Called when creating private transfer
await lightClient.storeIntentCommitment(
  'intent-456',
  commitmentHash,
  expiresAt
);
```

**On-Chain Result:**
- Compressed PDA with intent commitment
- Indexed by Photon for fast queries
- Verifiable via Merkle proof

### 3. Query Compressed Data
```typescript
// Query via Photon indexer
const record = await lightClient.getSettlementRecord('batch-123');
const intent = await lightClient.getIntentCommitment('intent-456');
```

## Monitoring

### Check Payer Balance
```bash
solana balance <PAYER_PUBLIC_KEY> --url devnet
```

### View Compressed Accounts
Use Photon API:
```bash
curl https://devnet.helius-rpc.com/?api-key=YOUR_KEY \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getCompressedAccountsByOwner",
    "params": ["<PAYER_PUBLIC_KEY>"]
  }'
```

### Check Transaction Status
```bash
solana confirm <SIGNATURE> --url devnet
```

## Troubleshooting

### "No payer configured"
- Check `LIGHT_PAYER_PRIVATE_KEY` is set in `.env`
- Verify base64 encoding is correct
- Ensure no extra whitespace in the key

### "Insufficient funds"
- Check payer balance: `solana balance <PUBKEY> --url devnet`
- Airdrop more SOL: `solana airdrop 1 <PUBKEY> --url devnet`

### "Transaction failed"
- Check Photon indexer health: `/api/v1/privacy/status`
- Verify RPC URL is correct
- Try with Helius RPC for better reliability

### "Simulation failed"
- Transactions fall back to simulation if payer not configured
- Check logs for `[Light] No payer configured - returning simulated result`
- This is OK for testing, but won't store on-chain

## Production Checklist

- [ ] Generate production payer keypair
- [ ] Fund with mainnet SOL (~0.5 SOL recommended)
- [ ] Update `SOLANA_RPC_URL` to mainnet
- [ ] Update `PHOTON_URL` to mainnet Photon
- [ ] Set `SOLANA_CLUSTER=mainnet-beta`
- [ ] Secure `LIGHT_PAYER_PRIVATE_KEY` (use secrets manager)
- [ ] Monitor payer balance (set up alerts)
- [ ] Enable compression: `ENABLE_COMPRESSION=true`

## Cost Estimation

### Devnet (Free)
- Transaction fees: 0.000005 SOL per tx
- Rent: Minimal (compressed storage)
- Total: ~0.01 SOL per 1000 records

### Mainnet (at $100/SOL)
- Transaction fees: ~$0.0005 per tx
- Rent: ~$0.0002 per record (compressed)
- Total: ~$0.50 per 1000 records
- **vs Traditional: ~$200 per 1000 records**
- **Savings: 99.75%**

## References

- [Light Protocol Docs](https://www.zkcompression.com/developers/intro)
- [Photon Indexer API](https://www.zkcompression.com/developers/json-rpc-methods)
- [Compressed Token Program](https://www.zkcompression.com/developers/compressed-token)
- [State Compression](https://www.zkcompression.com/learn/core-concepts/state-trees)
