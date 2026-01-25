# EVM Settlement Contracts

Minimal settlement contracts for the SIP + WOTS system.

## Design Principles

1. **No WOTS verification on-chain** — Too expensive
2. **No privacy logic on-chain** — SIP handles that
3. **Only finality and replay protection** — Minimal state
4. **Merkle root verification** — Efficient batch commitment

## Contracts

- `SIPSettlement.sol` — Main settlement contract
- `SIPVault.sol` — Asset custody with commitment-based access
- `MerkleVerifier.sol` — Optimized Merkle proof verification

## Usage

```bash
# Install dependencies
forge install

# Build
forge build

# Test
forge test

# Deploy (example)
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

## Security

The contracts CANNOT tell:
- Who sent what
- What amounts are involved
- What the recipient addresses are

They ONLY enforce:
- Commitment was approved (Merkle proof)
- Commitment was not already used (replay protection)
- Settlement was executed correctly
