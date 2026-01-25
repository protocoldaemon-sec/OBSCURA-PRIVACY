# OBSCURA

<p align="center">
  <strong>Privacy-Preserving DeFi Infrastructure for Web3</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#components">Components</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solana-Devnet-purple.svg" alt="Solana">
  <img src="https://img.shields.io/badge/Ethereum-Sepolia-blue.svg" alt="Ethereum">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
</p>

---

## Overview

OBSCURA is a comprehensive privacy-focused DeFi ecosystem enabling secure, private trading across multiple blockchains. Built with cutting-edge cryptographic technologies including Zero-Knowledge Proofs, Multi-Party Computation (MPC), and Post-Quantum Signatures, OBSCURA provides institutional-grade privacy for decentralized finance.

## Features

### 🔒 Privacy-First Design

- **Zero-Knowledge Proofs** - Transaction details hidden while maintaining verifiability
- **Stealth Addresses** - Unlinkable one-time addresses for each transaction
- **WOTS+ Post-Quantum Signatures** - Future-proof cryptographic security (2208 bytes)
- **Encrypted Order Flow** - MEV protection and front-running prevention
- **Pedersen Commitments** - Cryptographic hiding of amounts and prices

### 💱 Trading Infrastructure

- **Dark Pool Trading** - Private order matching via Arcium MPC with sub-100ms matching
- **OTC RFQ System** - Privacy-preserving Request for Quote trading with encrypted order books
- **Cross-Chain Bridge** - Seamless multi-chain asset transfers (Relay.link & deBridge)
- **Silent Swap** - Private, non-custodial token swaps with hidden sender-recipient links

### 🛡️ Compliance & Security

- **Regulatory Compliance** - Address screening via Range API for sanctions & blacklists
- **Relayer Network** - Private transaction submission through Obscura infrastructure
- **Off-Chain Balance Tracking** - Encrypted balance management via Arcium cSPL
- **ZK Compression** - 1000x cheaper Solana storage via Light Protocol

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                          OBSCURA                                  │
├───────────────────────────────────────────────────────────────────┤
│  Frontend                                                         │
│  ├── Web Dashboard (Next.js + Tailwind + Solana React Hooks)     │
│  ├── Landing Page (Next.js 14 + TypeScript)                      │
│  ├── Documentation Site (Next.js)                                │
│  └── Mobile App (Expo 54 + React Native + Mobile Wallet Adapter) │
├───────────────────────────────────────────────────────────────────┤
│  Backend Services                                                 │
│  ├── darkPool      → MPC-based private order matching (Redis)    │
│  ├── darkOTC       → Privacy-preserving RFQ system (Supabase)    │
│  ├── darkSwap      → Private cross-chain swaps & bridge          │
│  ├── vault         → Post-quantum secure privacy protocol        │
│  └── Compliance    → Address compliance checking (Range API)     │
├───────────────────────────────────────────────────────────────────┤
│  Privacy Infrastructure                                           │
│  ├── Arcium SDK v0.6.3  → MPC encrypted computation               │
│  ├── Light Protocol     → ZK compression (1000x storage savings) │
│  ├── WOTS+              → Post-quantum signatures                │
│  ├── SilentSwap SDK     → Private cross-chain swaps              │
│  └── Elusiv             → Private settlement layer               │
├───────────────────────────────────────────────────────────────────┤
│  Blockchain Layer                                                 │
│  ├── Solana Devnet                                               │
│  ├── Ethereum Sepolia                                            │
│  ├── Polygon, Arbitrum, Avalanche (via SilentSwap)               │
│  └── Multi-chain support (CAIP-10 & CAIP-19)                     │
└───────────────────────────────────────────────────────────────────┘
```

## Components

### Backend

| Component                                        | Description                                                                     | Tech Stack                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------- | ----------------------------------- |
| **[darkPool](./Backend/darkPool)**               | Production-ready dark pool trading with encrypted order matching via Arcium MPC | Node.js, Redis, Solana, Arcium     |
| **[darkOTC](./Backend/darkOTC)**                 | Privacy-preserving RFQ system with stealth addresses and WOTS+ signatures       | Express, TypeScript, Supabase      |
| **[darkSwap&Bridge](./Backend/darkSwap&Bridge)** | Cross-chain bridging and private swaps using SilentSwap SDK                     | Node.js, SilentSwap SDK, MCP Server|
| **[vault](./Backend/vault)**                     | Post-quantum secure privacy protocol with WOTS+ and stealth addresses          | Next.js, Hono, Anchor, Foundry     |
| **[Compliance](./Backend/Compliance)**           | Address compliance checking against Range API for sanctions & blacklists        | Node.js, Range API                 |

### Frontend

| Component                                            | Description                                       | Tech Stack                                           |
| ---------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| **[Dashboard](./Frontend/web/dashboard)**            | Web dashboard for OBSCURA DeFi operations         | Next.js, React, Tailwind                             |
| **[Landing Page](./Frontend/web/obscura-landing)**   | Modern landing page                               | Next.js 14, TypeScript, TailwindCSS                  |
| **[Documentation](./Frontend/web/obscura-docs)**     | Project documentation site                        | Next.js                                               |
| **[Mobile App](./Frontend/mobile-app/obscura-dapp)** | Native mobile application with wallet integration | Expo 54, React Native, Mobile Wallet Adapter         |

## Getting Started

### Prerequisites

- Node.js v18+
- npm v9+ or pnpm
- Redis (for darkPool)
- Supabase account (for darkOTC)
- Solana CLI (optional, for development)
- Docker (optional, for containerized deployment)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/mzf11125/OBSCURA-PRIVACY.git
   cd OBSCURA-PRIVACY
   ```

2. **Backend Setup** (choose component)

   ```bash
   # Dark Pool
   cd Backend/darkPool
   npm install
   cp .env.example .env
   redis-server
   npm start

   # Dark OTC
   cd Backend/darkOTC
   npm install
   cp .env.example .env
   # Set up Supabase database (see README.md)
   npm run dev

   # Dark Swap & Bridge
   cd Backend/darkSwap&Bridge
   pnpm install
   cp .env.example .env
   pnpm dev

   # Vault
   cd Backend/vault/obscura-landing
   npm install
   cp .env.example .env
   npm run dev

   # Compliance
   cd Backend/Compliance
   npm install
   cp .env.example .env
   npm start
   ```

3. **Frontend Setup**

   ```bash
   # Web Dashboard
   cd Frontend/web/dashboard
   npm install
   npm run dev

   # Landing Page
   cd Frontend/web/obscura-landing
   npm install
   npm run dev

   # Mobile App
   cd Frontend/mobile-app/obscura-dapp
   npm install
   npx expo start
   ```

## Privacy Model

### Visible (Fair Trading)

- Asset pairs, directions, amounts, and prices
- Quote counts and expiration times
- Transaction timestamps
- Order book aggregation

### Hidden (Privacy Protected)

- User identities via stealth addresses
- Transaction linkability via WOTS+ one-time signatures
- Settlement details via ZK proofs
- On-chain activity via relayer network
- Order details in dark pool (MPC-encrypted)

## Technology Stack

### Core Technologies

| Technology                  | Purpose                                   |
| --------------------------- | ----------------------------------------- |
| **Arcium SDK v0.6.3**       | MPC-based encrypted computation           |
| **Light Protocol**          | ZK compression for Solana (1000x cheaper) |
| **WOTS+ (mochimo-wots-v2)** | Post-quantum one-time signatures          |
| **SilentSwap SDK**          | Private cross-chain swaps                 |
| **Range API**               | Compliance & sanctions screening          |

### Blockchain Networks

- **Solana Devnet** - Primary chain for high-performance DeFi
- **Ethereum Sepolia** - EVM compatibility for cross-chain operations
- **Multi-chain Support** - Polygon, Arbitrum, Avalanche (via SilentSwap)

## API Documentation

Each backend service includes comprehensive API documentation:

- [Dark Pool API](./Backend/darkPool/README.md#-api-endpoints) - REST & WebSocket APIs
- [Dark OTC API](./Backend/darkOTC/README.md#api-documentation) - RFQ operations
- [Dark Swap & Bridge API](./Backend/darkSwap&Bridge/README.md#-api-endpoints) - Cross-chain swaps
- [Vault API](./Backend/vault/README.md#-rest-endpoints) - Privacy vault operations
- [Compliance API](./Backend/Compliance/README.md#api-endpoints) - Address screening

## Security

### Cryptographic Primitives

- **WOTS+ Signatures** - Post-quantum secure (2208 bytes)
- **Stealth Addresses** - Unlinkable one-time addresses
- **Pedersen Commitments** - Cryptographic hiding of amounts
- **Nullifiers** - Double-spending prevention
- **x25519 ECDH** - Secure key exchange with Rescue cipher

### Security Features

- MEV protection through encrypted order flow
- Signature reuse prevention (WOTS+ tracking)
- Rate limiting and DDoS protection
- Comprehensive audit logging
- OFAC & AML compliance

## Deployment

### Docker

```bash
# Dark Pool
cd Backend/darkPool
docker build -t obscura-darkpool .
docker run -p 3001:3001 -p 3003:3003 --env-file .env obscura-darkpool

# Dark OTC
cd Backend/darkOTC
docker build -t obscura-darkotc .
docker run -p 3000:3000 --env-file .env obscura-darkotc

# Vault
cd Backend/vault
docker build -t obscura-vault .
docker run -p 3000:3000 --env-file .env obscura-vault
```

### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)

See individual component READMEs for detailed deployment instructions.

## MCP Integration

The darkSwap&Bridge component includes a Model Context Protocol (MCP) server for AI assistant integration:

```bash
cd Backend/darkSwap&Bridge/mcp
pwsh setup.ps1  # Windows
# or
bash setup.sh   # Linux/Mac
```

Supported AI assistants: Claude Desktop, Kiro IDE, any MCP-compatible client.

See [MCP Guide](./Backend/darkSwap&Bridge/Docs/MCP_GUIDE.md) for details.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This is a testnet/devnet implementation for development and testing purposes. Do not use with real funds on mainnet without proper security audits.

## Links

- **Arcium Docs**: https://docs.arcium.com
- **Light Protocol**: https://lightprotocol.com
- **SilentSwap**: https://docs.silentswap.com
- **Solana Explorer**: https://explorer.solana.com/?cluster=devnet
- **Sepolia Explorer**: https://sepolia.etherscan.io

---

<p align="center">
  Built with privacy in mind. Secured by quantum-resistant cryptography.
</p>
