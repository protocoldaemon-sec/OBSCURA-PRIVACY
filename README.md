# OBSCURA

<p align="center">
  <strong>Privacy-Preserving DeFi Infrastructure for Web3</strong>
</p>

<p align="center">
  <a href="#quick-reference">Quick Reference</a> •
  <a href="#deployed-contracts">Deployed Contracts</a> •
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#components">Components</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-documentation">API Documentation</a> •
  <a href="#demos--screenshots">Demos</a> •
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

The platform combines WOTS+ (Winternitz One-Time Signatures) with advanced privacy technologies to provide quantum-resistant, privacy-preserving asset management across Solana and EVM chains.

---

## Quick Reference

| Service | Purpose | Tech Stack | Status | README |
|---------|---------|------------|--------|--------|
| **Vault** | Post-quantum privacy protocol | Next.js 14, Hono, Anchor, Foundry | Devnet | [Link](Backend/vault) |
| **DarkOTC** | Private RFQ trading | Express 4.18, TypeScript 5.3, Supabase | Devnet | [Link](Backend/darkOTC) |
| **DarkPool** | MPC order matching | Node.js 18+, Redis, Solana, Arcium SDK | Devnet | [Link](Backend/darkPool) |
| **DarkSwap** | Cross-chain swaps | Node.js, SilentSwap SDK, MCP Server | Devnet | [Link](Backend/darkSwap&Bridge) |
| **Compliance** | Address screening | Node.js, Range API | Active | [Link](Backend/Compliance) |
| **Dashboard** | Web UI | Next.js 14.2, React 18, Tailwind, Wagmi, Viem | Active | - |
| **Landing** | Marketing site | React 18, TypeScript 5.0, Vite, TailwindCSS | Active | [Link](Frontend/web/obscura-landing) |
| **Docs** | Documentation | Vite 7.2, React 19, TypeScript 5.9 | Active | - |
| **Mobile App** | Native app | Expo 54, React Native 0.81, Mobile Wallet Adapter | Active | - |

---

## Deployed Contracts

### Ethereum Sepolia

| Contract | Address |
|----------|---------|
| SIPSettlement | `0xA8dd037787334843d13B76a84D6C6DA7E99780c8` |
| SIPVault | `0x583Cb82c7af835B4Eb943ed2BE258DAE9637ac8a` |
| Vault Contract | `0xc4937Ba6418eE72EDABF72694198024b5a3599CC` |
| Settlement Contract | `0x88dA9c5D9801cb33615f0A516eb1098dF1889DA9` |

### Solana Devnet

| Contract | Address |
|----------|---------|
| sip_settlement | `F9H4qhdinmvW73J4TFEDyDiEmnhzt1uWimPeXaQqYdEE` |
| Program ID | `GG9U34H1xXkuzvv8Heoy4UWav5vUgrQFEVwrYMi84QuE` |
| Vault PDA | `6owJu2yXoPvTbM67XwmRguVRQhCADaswHkAVhVHSvoH7` |

---

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

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                          OBSCURA                                  │
├───────────────────────────────────────────────────────────────────┤
│  Frontend                                                         │
│  ├── Web Dashboard (Next.js + Tailwind + Solana React Hooks)     │
│  ├── Landing Page (React 18 + TypeScript + Vite)                 │
│  ├── Documentation Site (Vite + React + TypeScript)              │
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

---

## Components

### Backend

| Component | Description | Tech Stack | Key Endpoints |
|-----------|-------------|------------|---------------|
| **[darkPool](Backend/darkPool)** | Production-ready dark pool trading with encrypted order matching via Arcium MPC | Node.js 18+, Redis, Solana Web3.js, Arcium SDK v0.6.3 | `POST /api/orders/submit`, `GET /api/market/orderbook/:tokenPair`, `WS ws://localhost:3003` |
| **[darkOTC](Backend/darkOTC)** | Privacy-preserving RFQ system with stealth addresses and WOTS+ signatures | Express 4.18, TypeScript 5.3, Supabase, Solana Web3.js 1.95.8, Ethers.js 6.13.0+ | `POST /api/v1/rfq/quote-request`, `POST /api/v1/rfq/quote`, `POST /api/v1/rfq/quote/:id/accept` |
| **[darkSwap&Bridge](Backend/darkSwap&Bridge)** | Cross-chain bridging and private swaps using SilentSwap SDK | Node.js, SilentSwap SDK, MCP Server, pnpm | `GET /api/swap/quote`, `GET /api/swap/assets`, `POST /api/webhooks/swap-status` |
| **[vault](Backend/vault)** | Post-quantum secure privacy protocol with WOTS+ and stealth addresses | Next.js 14, Hono, Anchor 0.30.0, Foundry, TypeScript 5.3 | `POST /api/v1/deposit`, `POST /api/v1/withdraw`, `GET /api/v1/batches` |
| **[Compliance](Backend/Compliance)** | Address compliance checking against Range API for sanctions & blacklists | Node.js, Range API, Express | `GET /api/v1/addresses/search`, `GET /api/v1/addresses/stats`, `POST /api/v1/addresses/check` |

### Frontend

| Component | Description | Tech Stack | Setup |
|-----------|-------------|------------|-------|
| **[Dashboard](Frontend/web/dashboard)** | Web dashboard for OBSCURA DeFi operations with wallet integration | Next.js 14.2, React 18, Tailwind, Wagmi 2.12, Viem 2.17, Solana Wallet Adapter, Ethers.js 6.16, Framer Motion | See below |
| **[Landing Page](Frontend/web/obscura-landing)** | Modern landing page with pixel-perfect Figma design | React 18, TypeScript 5.0, Vite, TailwindCSS | `cd Frontend/web/obscura-landing && npm install && npm run dev` |
| **[Documentation](Frontend/web/obscura-docs)** | Project documentation site with React Router | Vite 7.2, React 19, TypeScript 5.9, Tailwind 4.1, React Router DOM 7.12 | See below |
| **[Mobile App](Frontend/mobile-app/obscura-app)** | Native mobile application with wallet integration | Expo 54, React Native 0.81, Mobile Wallet Adapter, Solana Web3.js 1.98, React Navigation 7 | See below |

---

## Getting Started

### Prerequisites

- **Node.js** v18+ (v20+ recommended)
- **npm** v9+ or **pnpm** v8+
- **Redis** (for darkPool)
- **Supabase** account (for darkOTC)
- **Solana CLI** (optional, for contract development)
- **Foundry** (for EVM contracts)
- **Docker** (optional, for containerized deployment)

### Global Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mzf11125/OBSCURA-PRIVACY.git
   cd OBSCURA-PRIVACY
   ```

---

## Backend Setup Guide

### 1. Vault (Post-Quantum Privacy Protocol)

The Vault provides the core privacy infrastructure with WOTS+ signatures, stealth addresses, and ZK compression.

**Prerequisites:**
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Foundry (for EVM contracts)
- Anchor 0.30.0 (for Solana)

**Installation:**

```bash
cd Backend/vault/backend
pnpm install
```

**Configuration:**

```bash
cp .env.example .env
# Edit .env with your configuration:
# - NEXT_PUBLIC_SOLANA_RPC_URL
# - NEXT_PUBLIC_HELIUS_API_KEY
# - NEXT_PUBLIC_ETH_RPC_URL
# - NEXT_PUBLIC_SOLANA_PROGRAM_ID
```

**Start Development Server:**

```bash
pnpm dev
```

**Verification:**

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok"}
```

---

### 2. DarkOTC (Private RFQ Trading)

Privacy-preserving Request for Quote system with stealth addresses and WOTS+ signatures.

**Prerequisites:**
- Node.js >= 18.0.0
- Supabase account with project created
- Solana Devnet RPC access
- Sepolia Testnet RPC URL

**Installation:**

```bash
cd Backend/darkOTC
npm install
```

**Database Setup:**

1. Run SQL migrations in your Supabase SQL editor:
   ```bash
   # Execute migrations from:
   # Backend/darkOTC/supabase/migrations/
   ```

2. Required tables:
   - `quote_requests`
   - `quotes`
   - `messages`
   - `whitelist`
   - `whitelist_audit_log`
   - `used_signatures`

**Configuration:**

```bash
cp .env.example .env
# Edit .env with:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - SOLANA_RPC_URL
# - SEPOLIA_RPC_URL
# - OBSCURA_LLMS_BASE_URL
```

**Start Development Server:**

```bash
npm run dev
```

**Verification:**

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

### 3. DarkPool (MPC Order Matching)

Production-ready dark pool with encrypted order matching via Arcium MPC.

**Prerequisites:**
- Node.js v18+
- Redis server running
- Arcium CLI installed
- Rust and Solana CLI

**Installation:**

```bash
cd Backend/darkPool
npm install
```

**Start Redis:**

```bash
redis-server
```

**Configuration:**

```bash
cp .env.example .env
# Edit .env with your Arcium and Solana configuration
```

**Build and Deploy:**

```bash
npm run build
npm run deploy:devnet
npm run init:comp-defs
```

**Start Server:**

```bash
npm start
```

**Verification:**

```bash
curl http://localhost:3001/api/health
# Expected: {"status":"healthy"}
```

---

### 4. DarkSwap & Bridge (Cross-Chain Swaps)

Private cross-chain swaps powered by SilentSwap V2.

**Prerequisites:**
- Node.js v18+
- pnpm package manager

**Installation:**

```bash
cd Backend/darkSwap&Bridge/backend
pnpm install
```

**Configuration:**

```bash
cp .env.example .env
# Edit .env with SilentSwap and bridge provider keys
```

**Start Development Server:**

```bash
pnpm dev
```

**Verification:**

```bash
curl http://localhost:PORT/health
# Expected: {"status":"ok"}
```

---

### 5. Compliance (Address Screening)

Compliance service for checking addresses against Range API.

**Prerequisites:**
- Node.js v18+
- Range API key

**Installation:**

```bash
cd Backend/Compliance
npm install
```

**Configuration:**

```bash
# .env already configured with RANGE_API_KEY
# Update if needed:
# RANGE_API_KEY=your_api_key
# PORT=3000
```

**Start Server:**

```bash
npm start
```

**For development with auto-reload:**

```bash
npm run dev
```

**Verification:**

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok"}
```

---

## Frontend Setup Guide

### 1. Web Dashboard

Main web dashboard for OBSCURA DeFi operations with wallet integration.

**Prerequisites:**
- Node.js v18+
- npm or pnpm

**Installation:**

```bash
cd Frontend/web/dashboard
npm install
```

**Configuration:**

```bash
cp .env.example .env
# Edit .env with:
# - NEXT_PUBLIC_SOLANA_RPC_URL
# - NEXT_PUBLIC_HELIUS_API_KEY
# - NEXT_PUBLIC_API_URL
# - Contract addresses
```

**Start Development Server:**

```bash
npm run dev
```

**Access:**

Open http://localhost:3000 in your browser.

**Build for Production:**

```bash
npm run build
npm start
```

---

### 2. Landing Page

Modern landing page with pixel-perfect Figma design.

**Prerequisites:**
- Node.js v18+
- npm

**Installation:**

```bash
cd Frontend/web/obscura-landing
npm install
```

**Start Development Server:**

```bash
npm run dev
```

**Access:**

Open http://localhost:5173 in your browser.

**Build for Production:**

```bash
npm run build
npm run preview
```

---

### 3. Documentation Site

Project documentation with interactive examples.

**Prerequisites:**
- Node.js v18+
- npm

**Installation:**

```bash
cd Frontend/web/obscura-docs/obscura-docs
npm install
```

**Start Development Server:**

```bash
npm run dev
```

**Access:**

Open http://localhost:5174 in your browser.

**Build for Production:**

```bash
npm run build
npm run preview
```

**Run Tests:**

```bash
npm test
npm run test:watch
```

---

### 4. Mobile App (React Native)

Native mobile application with Solana wallet integration.

**Prerequisites:**
- Node.js v18+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Expo Go app on physical device (for testing)

**Installation:**

```bash
cd Frontend/mobile-app/obscura-app
npm install
```

**Start Development Server:**

```bash
npx expo start
```

**Run on Platform:**

```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Web browser
npx expo start --web

# Scan QR code with Expo Go app
# Just press 'a' for Android or 'i' for iOS after starting
```

**Common Issues:**

- If遇到 EAS Build issues, ensure `eas-cli` is installed
- For wallet connection issues, ensure Mobile Wallet Adapter is supported
- Clear cache if needed: `npx expo start -c`

---

## Development Workflow

### Running Multiple Services

For a complete local development environment:

```bash
# Terminal 1 - Compliance
cd Backend/Compliance && npm start

# Terminal 2 - DarkOTC
cd Backend/darkOTC && npm run dev

# Terminal 3 - DarkPool (with Redis)
redis-server --daemonize yes
cd Backend/darkPool && npm start

# Terminal 4 - Vault Backend
cd Backend/vault/backend && pnpm dev

# Terminal 5 - Dashboard
cd Frontend/web/dashboard && npm run dev
```

### Docker Deployment

All backend services support Docker deployment:

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

### Railway Deployment

One-click deployment to Railway:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)

See individual component READMEs for detailed deployment instructions.

---

## Privacy Model

### Privacy Levels

| Level | Description |
|-------|-------------|
| `TRANSPARENT` | All visible - for debugging/auditing |
| `SHIELDED` | Sender, recipient, amount hidden - maximum privacy |
| `COMPLIANT` | Encrypted with viewing keys - regulatory friendly |

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

---

## API Documentation

### Vault API

```
POST   /api/v1/deposit          # Register deposit
POST   /api/v1/withdraw         # Submit withdrawal request
GET    /api/v1/batches          # Get batch information
GET    /health                  # Health check
```

### DarkOTC API

```
POST   /api/v1/rfq/quote-request           # Create quote request
GET    /api/v1/rfq/quote-requests          # List all requests
POST   /api/v1/rfq/quote                   # Submit quote (market makers)
GET    /api/v1/rfq/quote-request/:id/quotes # Get quotes for request
POST   /api/v1/rfq/quote/:id/accept        # Accept quote
POST   /api/v1/rfq/message                 # Send encrypted message
```

### DarkPool API

```
POST   /api/orders/submit              # Submit order
DELETE /api/orders/:orderId            # Cancel order
GET    /api/orders/:orderId            # Get order status
GET    /api/market/orderbook/:tokenPair # Get order book
GET    /api/market/trades/:tokenPair    # Get recent trades
WS     ws://localhost:3003              # WebSocket for real-time updates
```

### DarkSwap API

```
GET    /api/swap/quote               # Get swap quote
GET    /api/swap/assets              # Get supported assets
POST   /api/webhooks/swap-status     # Webhook for swap updates
```

### Compliance API

```
GET    /api/v1/addresses/search      # Search addresses
GET    /api/v1/addresses/stats       # Get address statistics
POST   /api/v1/addresses/check       # Batch compliance check
```

For detailed API documentation, see individual component READMEs.

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Arcium SDK** | v0.6.3 | MPC-based encrypted computation |
| **Light Protocol** | 0.22.1-alpha.1 | ZK compression for Solana (1000x cheaper) |
| **WOTS+** | mochimo-wots-v2 1.1.1 | Post-quantum one-time signatures |
| **SilentSwap SDK** | Latest | Private cross-chain swaps |
| **Range API** | Latest | Compliance & sanctions screening |
| **Solana Web3.js** | 1.95.8+ | Solana blockchain interaction |
| **Ethers.js** | 6.13.0+ | Ethereum blockchain interaction |

### Blockchain Networks

- **Solana Devnet** - Primary chain for high-performance DeFi
- **Ethereum Sepolia** - EVM compatibility for cross-chain operations
- **Multi-chain Support** - Polygon, Arbitrum, Avalanche (via SilentSwap)

### Integrations

#### Solana Ecosystem

| Integration | Purpose | Status |
|-------------|---------|--------|
| Helius | Enhanced RPC, priority fees | Active |
| Light Protocol | ZK Compression | Active |
| Arcium | Confidential computing | Beta |

#### EVM Ecosystem

| Integration | Purpose | Status |
|-------------|---------|--------|
| Wagmi | Wallet connection | Active |
| Viem | Ethereum interactions | Active |
| MetaMask | Browser wallet | Active |

---

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

---

## Performance

| Metric | Value |
|--------|-------|
| **Transaction Speed (Solana)** | < 2 seconds |
| **Transaction Speed (Ethereum)** | < 15 seconds |
| **Order Matching** | < 100ms with MPC |
| **Gas Optimization** | 1000x reduction with ZK Compression |
| **WebSocket Latency** | < 10ms |

---

## Demos & Screenshots

### Privacy Transfer Demo

Private deposits and withdrawals with quantum-resistant security and true anonymity.

- [Watch Full Demo](Backend/vault/docs/Privacy%20Transfer/Video_Privacy%20Transfer.mp4) 📹
- Backend Logs Screenshot
- Solflare History Screenshot

**Key Features:**
- Vault PDA hides relayer address (TRUE privacy)
- Arcium cSPL for off-chain balance verification
- Light Protocol ZK Compression (1000x cheaper)
- No graph tracing possible

### Dark OTC Trading Demo

Private peer-to-peer trading with encrypted order books and automatic settlement.

- [Market Maker Demo - Device 1](Backend/vault/docs/Dark%20OCT/Video%20Device%201_Dark%20OCT.mp4) 📹
- [Taker Demo - Device 2](Backend/vault/docs/Dark%20OCT/Video%20Device%202_Dark%20OCT.mp4) 📹
- Backend Logs Screenshot
- Solflare History Screenshot

**Key Features:**
- WOTS+ signed quotes (post-quantum secure)
- Encrypted order books
- Automatic settlement with dual nullifiers
- Real-time price feeds

### Light Protocol ZK Compression Proof

1000x cheaper storage on Solana using Light Protocol ZK Compression.

- [View Proof Screenshot](Backend/vault/docs/proof_LP_ZK.png)

---

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

---

## MCP Integration

The darkSwap&Bridge component includes a Model Context Protocol (MCP) server for AI assistant integration:

```bash
cd Backend/darkSwap&Bridge/mcp
pwsh setup.ps1  # Windows
# or
bash setup.sh   # Linux/Mac
```

Supported AI assistants: Claude Desktop, Kiro IDE, any MCP-compatible client.

See [MCP Guide](Backend/darkSwap&Bridge/Docs/MCP_GUIDE.md) for details.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

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
