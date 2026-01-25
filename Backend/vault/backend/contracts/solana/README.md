# Solana Settlement Program

Minimal settlement program for the SIP + WOTS system on Solana.

## Design Principles

Same as EVM contracts:
1. **No WOTS verification on-chain** — Done off-chain by aggregators
2. **No privacy logic on-chain** — SIP layer handles privacy
3. **Only finality and replay protection** — Minimal state
4. **Merkle root verification** — Efficient batch commitment

## Program Structure

```
programs/sip-settlement/
├── src/
│   ├── lib.rs           # Program entrypoint
│   ├── state.rs         # Account state definitions
│   ├── instructions.rs  # Instruction handlers
│   └── error.rs         # Error definitions
```

## Accounts

- **SettlementState** — Program state (PDA)
- **UsedCommitment** — Replay protection (PDA per commitment)
- **BatchRoot** — Historical batch records (PDA per batch)

## Instructions

1. `initialize` — Set up program state
2. `update_root` — Submit new batch Merkle root
3. `settle` — Settle a commitment with proof
4. `add_executor` — Authorize a new executor
5. `remove_executor` — Revoke executor authorization

## Build & Deploy

```bash
# Build
anchor build

# Test
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Security

The program cannot determine:
- Who sent what
- What amounts are involved  
- What the recipient addresses are

It only enforces:
- Commitment was approved (Merkle proof)
- Commitment was not already used (PDA existence check)
- Settlement was executed correctly
