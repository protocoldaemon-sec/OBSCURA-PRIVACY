<h1 align="center">Obscura</h1>

<p align="center">
  Post-quantum secure intent settlement system combining WOTS+ (Winternitz One-Time Signatures), SIP (Shielded Intent Protocol), and minimal on-chain settlement contracts.
</p>

<p align="center">
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  </a>
  <a href="https://soliditylang.org/">
    <img src="https://img.shields.io/badge/Solidity-0.8.24-363636?style=flat-square&logo=solidity&logoColor=white" alt="Solidity">
  </a>
  <a href="https://www.anchor-lang.com/">
    <img src="https://img.shields.io/badge/Anchor-0.30.0-9945FF?style=flat-square&logo=solana&logoColor=white" alt="Anchor">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
  </a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> |
  <a href="#packages">Packages</a> |
  <a href="#contracts">Contracts</a> |
  <a href="GLOSSARY.md">Glossary</a>
</p>

---

## Overview

Obscura enables **private, quantum-resistant** cross-chain intent settlement.

## Features

| Feature | Description |
|---------|-------------|
| Post-Quantum Security | WOTS+ signatures resist quantum computer attacks |
| Privacy-Preserving | Stealth addresses + Pedersen commitments hide transaction details |
| Gas Efficient | Heavy crypto happens off-chain; contracts only verify commitments |
| Multi-Chain | EVM (Ethereum, L2s) and Solana settlement support |
| ZK Compression | Light Protocol integration for ~1000x cheaper Solana storage |
| Confidential Computing | Arcium MPC for encrypted solver auctions and cSPL tokens |
| Price Discovery | Jupiter/Orb integration for optimal swap routes |

## Use Cases

- Private token swaps without revealing amounts or parties
- Cross-chain transfers with privacy
- Stealth payments without linking addresses
- Quantum-resistant custody for future-proof asset security
- Batch settlements for gas efficiency

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User / Wallet                          │
│   • WOTS key manager (quantum-resistant key pool)           │
│   • SIP client (privacy layer)                              │
└─────────────────────────┬───────────────────────────────────┘
                          │ Shielded Intent
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   SIP Protocol Layer                        │
│   • EIP-5564 stealth addressing                             │
│   • Pedersen commitments (amount hiding)                    │
│   • Privacy levels: TRANSPARENT | SHIELDED | COMPLIANT      │
└─────────────────────────┬───────────────────────────────────┘
                          │ Encrypted + Committed Intent
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 PQ Authorization Layer                      │
│   • WOTS+ signature verification (off-chain)                │
│   • One-time key index enforcement                          │
│   • Merkle proof of key membership                          │
└─────────────────────────┬───────────────────────────────────┘
                          │ Authorized Intent Batch
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Aggregator / Executor                      │
│   • Intent batching & Merkle root construction              │
│   • Solver quote integration                                │
│   • Multi-chain routing                                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ Commitment Root + Proofs
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Settlement Contracts                       │
│   • EVM: SIPSettlement.sol, SIPVault.sol                    │
│   • Solana: sip-settlement program                          │
│   • Minimal state: verify commitment, prevent replay        │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
obscura/
├── packages/
│   ├── crypto/                 # WOTS+ & Merkle tree primitives
│   └── backend/                # Off-chain services & API
├── contracts/
│   ├── evm/                    # Solidity contracts (Foundry)
│   └── solana/                 # Anchor programs
├── obscura/                    # Mobile app (React Native/Expo)
└── examples/                   # Demo applications
```

## Quick Start

### Prerequisites

- Node.js ≥ 18.0.0
- pnpm ≥ 8.0.0
- [Foundry](https://book.getfoundry.sh/) (for EVM contracts)
- [Anchor](https://www.anchor-lang.com/) 0.30.0 (for Solana)

### Installation

```bash
git clone https://github.com/protocoldaemon-sec/obscura-vault.git
cd obscura-vault
pnpm install
pnpm build
```

### Run Tests

```bash
pnpm test              # All tests
pnpm test:crypto       # Crypto package only
pnpm forge:test        # EVM contracts
```

## Packages

### @obscura/crypto

Core cryptographic primitives for post-quantum security.

```typescript
import { WOTSScheme, MerkleTree } from '@obscura/crypto';

const wots = new WOTSScheme();
const privateKey = wots.generatePrivateKey();
const publicKey = wots.computePublicKey(privateKey);
```

### @obscura/backend

Off-chain services with SIP SDK integration.

```typescript
import { SIPClient, PrivacyLevel } from '@obscura/backend';

const client = new SIPClient({
  network: 'testnet',
  chain: 'ethereum',
  privacyLevel: PrivacyLevel.SHIELDED,
});
```

## Contracts

| Contract | Description |
|----------|-------------|
| `SIPSettlement.sol` | Main settlement, verifies commitment proofs |
| `SIPVault.sol` | Asset vault with escrow and batch release |
| `MerkleVerifier.sol` | Gas-efficient Merkle proof verification |

## Privacy Levels

| Level | Description |
|-------|-------------|
| `TRANSPARENT` | All visible - for debugging/auditing |
| `SHIELDED` | Sender, recipient, amount hidden - maximum privacy |
| `COMPLIANT` | Encrypted with viewing keys - regulatory friendly |

## Design Principles

1. **Never verify WOTS on-chain** - Signature verification is too expensive (~50M gas)
2. **SIP owns privacy** - Intent data never touches contracts unencrypted
3. **Contracts own finality only** - Minimal state: commitment verification + replay protection
4. **Everything heavy is off-chain** - PQ auth, validation, batching, routing

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [API Reference](docs/API.md) - Complete endpoint documentation
- [SDK Guide](docs/SDK.md) - TypeScript integration guide
- [Solana Integrations](docs/SOLANA-INTEGRATIONS.md) - Helius, Light Protocol, Arcium, Orb setup
- [Glossary](GLOSSARY.md) - Comprehensive terminology reference
- [Whitepaper](WHITEPAPER.md) - Technical deep-dive

## Solana Privacy Stack

Obscura leverages a comprehensive Solana integration stack:

| Integration | Purpose | Benefit |
|-------------|---------|---------|
| [Helius](https://helius.dev) | Enhanced RPC | Priority fees, smart transactions |
| [Light Protocol](https://lightprotocol.com) | ZK Compression | ~1000x cheaper storage |
| [Arcium](https://arcium.com) | Confidential Computing | MPC auctions, cSPL tokens |
| [Jupiter](https://jup.ag) | Price Discovery | Best swap routes |

```
Flow: Jupiter Quote (public) → Arcium Encrypt → MPC Auction → cSPL Execution → Settlement
```

## Deployed Contracts

| Chain | Contract | Address |
|-------|----------|---------|
| Sepolia | SIPSettlement | `0xA8dd037787334843d13B76a84D6C6DA7E99780c8` |
| Sepolia | SIPVault | `0x583Cb82c7af835B4Eb943ed2BE258DAE9637ac8a` |
| Solana Devnet | sip_settlement | `F9H4qhdinmvW73J4TFEDyDiEmnhzt1uWimPeXaQqYdEE` |

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built for quantum-resistant privacy-preserving settlements
</p>
