# Obscura Vault

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.0-black?logo=next.js)](https://nextjs.org/)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://solana.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/fikriaf/obscura-vault)

**Post-Quantum Secure Privacy Protocol for Cross-Chain Asset Management**

Obscura Vault combines WOTS+ (Winternitz One-Time Signatures) with advanced privacy technologies to provide quantum-resistant, privacy-preserving asset management across Solana and EVM chains.

---

## Features

### Core Capabilities

- **Post-Quantum Security**: WOTS+ signatures resistant to quantum computer attacks
- **Privacy-Preserving Transfers**: Stealth addresses and Pedersen commitments hide transaction details
- **Multi-Chain Support**: Seamless operations across Solana Devnet and Ethereum Sepolia
- **Dark OTC Trading**: Private peer-to-peer trading with encrypted order books
- **ZK Compression**: 1000x cheaper storage using Light Protocol on Solana
- **Confidential Computing**: Arcium MPC integration for enhanced privacy

### Privacy Technologies

| Technology | Purpose | Status |
|------------|---------|--------|
| WOTS+ | Post-quantum signatures | Production |
| Stealth Addresses | Transaction privacy | Production |
| Pedersen Commitments | Amount hiding | Production |
| ZK Compression | Cost reduction | Production |
| Arcium MPC | Confidential computing | Beta |

---

## Architecture

```
obscura-vault/
├── obscura-landing/          # Next.js frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom React hooks (WOTS+)
│   │   ├── lib/             # API clients and utilities
│   │   └── providers/       # Wallet providers (Solana, EVM)
│   └── public/              # Static assets
│
├── backend/                  # Backend services
│   ├── packages/
│   │   ├── backend/         # Main API server (Hono)
│   │   └── crypto/          # Cryptographic primitives
│   └── contracts/
│       ├── evm/             # Solidity contracts (Foundry)
│       └── solana/          # Anchor programs
│
└── contracts/               # Additional contract implementations
```

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm
- Solana CLI (for contract deployment)
- Foundry (for EVM contracts)

### Installation

```bash
# Clone repository
git clone https://github.com/fikriaf/obscura-vault.git
cd obscura-vault

# Install dependencies
cd obscura-landing
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Start frontend development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Backend Setup

```bash
cd backend
pnpm install

# Start backend server
cd packages/backend
pnpm dev
```

---

## Environment Configuration

### Required Variables

```env
# Solana Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key

# Ethereum Configuration
NEXT_PUBLIC_ETH_RPC_URL=https://rpc.sepolia.org

# API Endpoints
NEXT_PUBLIC_API_URL=https://obscura-api.daemonprotocol.com
NEXT_PUBLIC_DARK_OTC_API=http://localhost:3000

# Contract Addresses
NEXT_PUBLIC_SOLANA_PROGRAM_ID=GG9U34H1xXkuzvv8Heoy4UWav5vUgrQFEVwrYMi84QuE
NEXT_PUBLIC_SOLANA_VAULT_PDA=6owJu2yXoPvTbM67XwmRguVRQhCADaswHkAVhVHSvoH7
NEXT_PUBLIC_SEPOLIA_VAULT=0xc4937Ba6418eE72EDABF72694198024b5a3599CC
```

---

## Smart Contracts

### Solana (Anchor)

**Program ID**: `GG9U34H1xXkuzvv8Heoy4UWav5vUgrQFEVwrYMi84QuE`

**Vault PDA**: `6owJu2yXoPvTbM67XwmRguVRQhCADaswHkAVhVHSvoH7`

```bash
# Build Solana contracts
cd backend/contracts/solana
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Ethereum (Foundry)

**Vault Contract**: `0xc4937Ba6418eE72EDABF72694198024b5a3599CC`

**Settlement Contract**: `0x88dA9c5D9801cb33615f0A516eb1098dF1889DA9`

```bash
# Build EVM contracts
cd backend/contracts/evm
forge build

# Run tests
forge test

# Deploy to Sepolia
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast
```

---

## Key Features

### 1. Privacy Transfers

Deposit assets into the privacy vault and withdraw to any address without revealing the link between sender and recipient.

**Supported Tokens**:
- Solana: SOL, USDC, USDT
- Ethereum: ETH, USDC, USDT

### 2. Dark OTC Trading

Private peer-to-peer trading with:
- Encrypted order books
- WOTS+ signed quotes
- Automatic settlement
- Real-time price feeds from CoinGecko

### 3. Multi-Token Support

Seamless handling of multiple token types with automatic decimal conversion and proper balance tracking.

---

## Security

### Cryptographic Primitives

- **WOTS+**: Winternitz One-Time Signature scheme for post-quantum security
- **SHA-256**: Hash function for commitments and nullifiers
- **Pedersen Commitments**: Cryptographic hiding of transaction amounts
- **Stealth Addresses**: Privacy-preserving recipient addressing

### Audit Status

- Smart contracts: Pending external audit
- Cryptographic implementation: Internal review completed
- Frontend security: Ongoing security assessments

---

## Integrations

### Solana Ecosystem

| Integration | Purpose | Status |
|-------------|---------|--------|
| Helius | Enhanced RPC, priority fees | Active |
| Light Protocol | ZK Compression | Active |
| Arcium | Confidential computing | Beta |

### EVM Ecosystem

| Integration | Purpose | Status |
|-------------|---------|--------|
| Wagmi | Wallet connection | Active |
| Viem | Ethereum interactions | Active |
| MetaMask | Browser wallet | Active |

---

## API Documentation

### REST Endpoints

```
POST   /api/v1/deposit          # Register deposit
POST   /api/v1/withdraw         # Submit withdrawal request
GET    /api/v1/batches          # Get batch information
GET    /health                  # Health check

# Dark OTC
POST   /api/v1/rfq/quote-request           # Create quote request
GET    /api/v1/rfq/quote-requests          # List all requests
POST   /api/v1/rfq/quote                   # Submit quote
GET    /api/v1/rfq/quote-request/:id/quotes # Get quotes for request
```

Full API documentation: [API.md](backend/docs/API.md)

---

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Testing

```bash
# Frontend tests
cd obscura-landing
npm test

# Backend tests
cd backend
pnpm test

# Smart contract tests (Solana)
cd backend/contracts/solana
anchor test

# Smart contract tests (EVM)
cd backend/contracts/evm
forge test
```

---

## Deployment

### Frontend (Vercel)

```bash
# Build production bundle
npm run build

# Deploy to Vercel
vercel --prod
```

### Backend (Railway)

```bash
# Deploy backend services
railway up
```

---

## Performance

- **Transaction Speed**: < 2 seconds on Solana, < 15 seconds on Ethereum
- **Gas Optimization**: ZK Compression reduces costs by 1000x on Solana
- **Scalability**: Supports 1000+ concurrent users
- **Uptime**: 99.9% availability target

---

## Roadmap

### Q1 2024
- [x] Core privacy vault implementation
- [x] Multi-chain support (Solana + Ethereum)
- [x] Dark OTC trading platform
- [x] WOTS+ integration

### Q2 2024
- [ ] External security audit
- [ ] Mainnet deployment
- [ ] Additional chain support (Polygon, Arbitrum)
- [ ] Mobile application

### Q3 2024
- [ ] Advanced trading features
- [ ] Liquidity pools
- [ ] Governance token launch
- [ ] DAO formation

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

**Powered By**:
- [Arcium](https://arcium.com/) - Confidential computing infrastructure
- [Helius](https://helius.dev/) - Enhanced Solana RPC services
- [Light Protocol](https://lightprotocol.com/) - ZK Compression technology
- [Daemon Protocol](https://daemonprotocol.com/) - Privacy infrastructure

**Built With**:
- Next.js 14
- Solana Web3.js
- Anchor Framework
- Foundry
- TypeScript
- TailwindCSS

---

## Support

- **Documentation**: [docs/](backend/docs/)
- **Issues**: [GitHub Issues](https://github.com/fikriaf/obscura-vault/issues)
- **Discord**: [Join our community](https://discord.gg/obscura)
- **Twitter**: [@ObscuraVault](https://twitter.com/obscuravault)

---

## Disclaimer

This software is provided "as is" without warranty of any kind. Use at your own risk. Always verify transactions and never share your private keys.

**Security Notice**: This is experimental software running on testnets. Do not use with real funds on mainnet until official mainnet launch and security audit completion.

---

<div align="center">

**Built with privacy in mind. Secured by quantum-resistant cryptography.**

[Website](https://obscura.daemonprotocol.com) • [Documentation](backend/docs/) • [GitHub](https://github.com/fikriaf/obscura-vault)

</div>
