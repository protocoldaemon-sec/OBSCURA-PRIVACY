# Obscura Swap

Privacy-focused cross-chain swap platform powered by SilentSwap V2.

> **Obscura Swap** enables private, non-custodial cross-chain swaps where the connection between sender and recipient is hidden on-chain.

## ⭐ Quick Start

**New to Obscura Swap?** Start here: **[START_HERE.md](./START_HERE.md)** 🚀

**Complete setup guide:** [SETUP.md](./SETUP.md)

**Project summary:** [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

## 🌟 Features

- 🔒 **Private Swaps** - Hide the sender-recipient link on-chain using facilitator accounts
- 🌐 **Multi-chain Support** - Ethereum, Polygon, Arbitrum, Avalanche, and Solana
- 🚀 **Fast Bridging** - Automatic provider comparison (Relay.link & deBridge)
- 💼 **Portfolio Tracking** - View balances and swap history across all chains
- 🔐 **Non-Custodial** - You always control your funds
- ✅ **Compliant** - OFAC & AML compliant privacy solution

## 📚 Documentation

- **[Documentation Index](./Docs/DOCUMENTATION_INDEX.md)** - Complete guide to all documentation
- **[Getting Started](./Docs/GETTING_STARTED.md)** - Quick start guide and installation
- **[How It Works](./Docs/HOW_IT_WORKS.md)** - Understanding the privacy architecture
- **[Core SDK Guide](./Docs/CORE_SDK_GUIDE.md)** - Complete API reference for backend
- **[React Integration](./REACT_INTEGRATION.md)** - Complete React integration guide
- **[Integration Guide](./INTEGRATION.md)** - Frontend integration overview
- **[MCP Guide](./Docs/MCP_GUIDE.md)** - Model Context Protocol for AI assistants
- **[Official Docs](https://docs.silentswap.com)** - SilentSwap documentation

## 🚀 Quick Start

### Installation

```bash
# Install backend dependencies
cd backend
pnpm install
```

### Configuration

```bash
# Setup environment
cd backend
cp .env.example .env
# Edit .env with your configuration
```

### Run Backend Server

```bash
# From backend folder
cd backend
pnpm dev

# Or from root
pnpm backend:dev
```

### Run Tests

```bash
# Test imports
cd backend
pnpm test:imports

# Test API (server must be running)
cd backend
pnpm test:api
```

**📖 Detailed setup guide:** [SETUP.md](./SETUP.md)

## 🏗️ Architecture

Obscura Swap provides two main services:

### 1. Simple Bridge

Fast cross-chain token transfers using top-tier bridge providers.

```
User (Chain A) → Bridge Provider → User (Chain B)
```

**Use Cases:**
- Quick cross-chain transfers
- Portfolio rebalancing
- DeFi operations
- No privacy requirements

### 2. Silent Swap

Private cross-chain swaps where the sender-recipient link is hidden.

```
User → Gateway → Facilitators (TEE) → Bridge → Recipient
```

**Use Cases:**
- Private transfers
- Confidential business payments
- Portfolio privacy
- DeFi privacy

**How Privacy Works:**
1. Generate single-use facilitator accounts per swap
2. Facilitators operate in Trusted Execution Environment (TEE)
3. Break the on-chain link between sender and recipient
4. Facilitators are discarded after use

[Learn more about how it works →](./HOW_IT_WORKS.md)

## 📁 Project Structure

```
obscura-swap/
├── backend/                  # Backend API
│   ├── src/                 # Source code
│   │   ├── config/         # Configuration
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   └── index.js        # Server entry point
│   ├── examples/            # Example scripts
│   ├── test/                # Test files
│   ├── package.json
│   └── README.md
├── frontend/                 # React components
│   ├── components/          # Swap UI components
│   ├── providers/           # React providers
│   └── hooks/               # Custom hooks
├── mcp/                      # Model Context Protocol
│   ├── server/              # MCP server for AI assistants
│   ├── client/              # MCP client for testing
│   └── README.md
├── docs/                     # Documentation
│   ├── GETTING_STARTED.md
│   ├── HOW_IT_WORKS.md
│   ├── CORE_SDK_GUIDE.md
│   ├── MCP_GUIDE.md
│   └── ...
├── package.json             # Root package.json
├── SETUP.md                 # Setup guide
└── README.md                # This file
```

## 🔌 API Endpoints

### Get Quote
```
GET /api/swap/quote
```

Query parameters:
- `fromChainId` - Source chain ID (e.g., 1 for Ethereum)
- `toChainId` - Destination chain ID
- `fromToken` - Source token address
- `toToken` - Destination token address
- `amount` - Amount to swap (in token units)
- `userAddress` - User's wallet address

### Get Supported Assets
```
GET /api/swap/assets
```

Returns supported chains and tokens in CAIP-19 format.

### Health Check
```
GET /health
```

### Webhook
```
POST /api/webhooks/swap-status
```

Receives swap status updates from SilentSwap.

## 🌐 Supported Chains & Tokens

### EVM Chains
- **Ethereum** (Chain ID: 1) - ETH, USDC, USDT
- **Polygon** (Chain ID: 137) - MATIC, USDC
- **Arbitrum** (Chain ID: 42161) - ETH, USDC
- **Avalanche** (Chain ID: 43114) - AVAX, USDC

### Solana
- **Solana** - SOL, USDC (SPL)

## 💻 Usage Examples

### Simple Bridge (Backend)

```javascript
import { getBridgeQuote, convertQuoteResultToQuote, executeBridgeTransaction } from '@silentswap/sdk';

// Get quote
const quoteResult = await getBridgeQuote(
  1, // Ethereum
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  '1000000', // 1 USDC
  43114, // Avalanche
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC.e
  userAddress
);

// Convert to executable quote
const quote = convertQuoteResultToQuote(quoteResult, 1);

// Execute
const status = await executeBridgeTransaction(quote, walletClient, connector, console.log);
```

### Silent Swap (React)

```tsx
import { useSilentSwap, useSwap } from '@silentswap/react';

function SwapForm() {
  const { executeSwap, isSwapping, orderComplete } = useSilentSwap();
  const { tokenIn, inputAmount, destinations, splits } = useSwap();
  const { evmAddress } = useUserAddress();

  const handleSwap = async () => {
    await executeSwap({
      sourceAsset: tokenIn.caip19,
      sourceAmount: inputAmount,
      destinations: destinations,
      splits: splits,
      senderContactId: `caip10:eip155:1:${evmAddress}`,
      integratorId: process.env.NEXT_PUBLIC_INTEGRATOR_ID,
    });
  };

  return (
    <button onClick={handleSwap} disabled={isSwapping}>
      {isSwapping ? 'Swapping...' : 'Execute Swap'}
    </button>
  );
}
```

## 🔐 Security

- ✅ **Non-Custodial**: Users maintain full control of funds
- ✅ **Open Source**: SDK and SCA code are fully auditable
- ✅ **TEE Protected**: Facilitators operate in Trusted Execution Environment
- ✅ **Compliant**: OFAC & AML compliant
- ✅ **Audited**: Smart contracts are audited
- ✅ **Decentralized**: No single point of failure

## 🛠️ Development

### Backend Development

The backend provides REST APIs for:
- Getting swap quotes
- Fetching supported assets
- Receiving webhook notifications

### Frontend Development

React components using:
- `@silentswap/react` - React hooks and providers
- `@silentswap/sdk` - Core SDK functionality
- `wagmi` - EVM wallet integration
- `@solana/wallet-adapter-react` - Solana wallet integration

## 📖 Learn More

### Understanding the Technology

- [How It Works](./HOW_IT_WORKS.md) - Deep dive into the privacy architecture
- [CAIP Standards](./CORE_SDK_GUIDE.md#caip-standards) - Chain-agnostic identifiers
- [Facilitator Groups](./HOW_IT_WORKS.md#facilitator-accounts) - Single-use accounts

### Integration Guides

- [Backend Integration](./CORE_SDK_GUIDE.md) - Core SDK for Node.js
- [React Integration](./INTEGRATION.md) - Frontend components
- [Complete Examples](./examples/node-backend-example.js) - Working code samples

### Official Resources

- [SilentSwap Docs](https://docs.silentswap.com) - Official documentation
- [Core SDK](https://docs.silentswap.com/core/simple-bridge/introduction) - Backend guide
- [React SDK](https://docs.silentswap.com/react/overview) - Frontend guide
- [GitHub](https://github.com/Auronox/silentswap-v2-sdk) - SDK repository

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 🤖 AI Integration

Obscura Swap includes a Model Context Protocol (MCP) server that allows AI assistants to interact with the swap API.

**Quick Setup:**
```bash
cd mcp
pwsh setup.ps1  # Windows
# or
bash setup.sh   # Linux/Mac
```

**Supported AI Assistants:**
- Claude Desktop
- Kiro IDE
- Any MCP-compatible client

**Learn more:** [MCP Guide](./Docs/MCP_GUIDE.md) | [Quick Start](./mcp/QUICKSTART.md)

## 📄 License

MIT

---

powered by [SilentSwap](https://silentswap.com)
