# Obscura Swap Documentation Index

Complete guide to all documentation files in the Obscura Swap project.

## 📚 Quick Navigation

### Getting Started
- **[README.md](./README.md)** - Project overview and quick start
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Detailed installation and setup guide
- **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)** - Understanding the privacy architecture

### Backend Development
- **[CORE_SDK_GUIDE.md](./CORE_SDK_GUIDE.md)** - Complete Core SDK API reference for Node.js
- **[examples/node-backend-example.js](./examples/node-backend-example.js)** - Working backend examples

### MCP Integration
- **[MCP_GUIDE.md](./MCP_GUIDE.md)** - Model Context Protocol server and client for AI assistants
- **[mcp/](../mcp/)** - MCP server and client implementation

### Frontend Development
- **[REACT_INTEGRATION.md](./REACT_INTEGRATION.md)** - Complete React integration guide
- **[INTEGRATION.md](./INTEGRATION.md)** - Frontend integration overview
- **[frontend/](./frontend/)** - Pre-built React components

### Configuration
- **[.env.example](./.env.example)** - Environment variables template
- **[package.json](./package.json)** - Project dependencies and scripts

## 📖 Documentation by Topic

### Understanding Obscura Swap

#### What is Obscura Swap?
Start here: [README.md](./README.md)

Obscura Swap is a privacy-focused cross-chain swap platform that provides:
- **Simple Bridge**: Fast cross-chain transfers
- **Silent Swap**: Private swaps with hidden sender-recipient links

#### How Does Privacy Work?
Read: [HOW_IT_WORKS.md](./HOW_IT_WORKS.md)

Learn about:
- Facilitator accounts and single-use wallets
- Trusted Execution Environment (TEE)
- Smart Contract Account (SCA)
- On-chain privacy guarantees

### Installation & Setup

#### Quick Start
Read: [GETTING_STARTED.md](./GETTING_STARTED.md)

Covers:
- Prerequisites and installation
- Configuration setup
- Running the backend server
- Testing examples
- Common issues and solutions

#### Environment Configuration
File: [.env.example](./.env.example)

Required variables:
```env
PORT=3000
SILENTSWAP_ENVIRONMENT=STAGING
NEXT_PUBLIC_INTEGRATOR_ID=your_integrator_id
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### MCP Integration

#### MCP Guide
Read: [MCP_GUIDE.md](./MCP_GUIDE.md)

Complete guide for:
- Setting up MCP server and client
- Integrating with Claude Desktop, Kiro, and other AI assistants
- Available MCP tools (health check, assets, quotes, chain info)
- Testing and production deployment
- Troubleshooting MCP connections

Quick setup:
```bash
cd mcp
pwsh setup.ps1  # Windows
# or
bash setup.sh   # Linux/Mac
```

### Backend Development

#### Core SDK Guide
Read: [CORE_SDK_GUIDE.md](./CORE_SDK_GUIDE.md)

Complete reference for:
- **Simple Bridge API**
  - `getBridgeQuote()` - Get cross-chain quotes
  - `executeBridgeTransaction()` - Execute transfers
  - `getBridgeStatus()` - Monitor status
  - `solveOptimalUsdcAmount()` - Optimize USDC amounts

- **Silent Swap API**
  - `createSilentSwapClient()` - Initialize client
  - `authenticateAndDeriveEntropy()` - User authentication
  - `createFacilitatorGroup()` - Generate facilitator accounts
  - `getSilentSwapQuote()` - Get private swap quotes
  - `createSilentSwapOrder()` - Place orders
  - `executeDepositTransaction()` - Execute deposits

- **CAIP Standards**
  - CAIP-10: Account identifiers
  - CAIP-19: Asset identifiers

#### Backend Examples
File: [examples/node-backend-example.js](./examples/node-backend-example.js)

Working examples:
```bash
# Simple Bridge example
pnpm example:bridge

# Silent Swap example
pnpm example:silent
```

#### Backend Services
Files:
- `src/services/silentswap.js` - Simple Bridge functions
- `src/services/silentSwapCore.js` - Silent Swap Core SDK
- `src/services/assets.js` - Supported chains and tokens

### Frontend Development

#### React Integration Guide
Read: [REACT_INTEGRATION.md](./REACT_INTEGRATION.md)

Comprehensive guide covering:

**1. Simple Bridge (React)**
- `useQuote` hook - Fetch bridge quotes
- `useTransaction` hook - Execute transactions
- Complete bridge component example

**2. Silent Swap (React)**
- `SilentSwapProvider` - Main provider setup
- `useSilentSwap` hook - Execute private swaps
- `useSwap` hook - Form state management
- Complete swap form example

**3. Data & Utility Hooks**
- `useBalancesContext` - Cross-chain balances
- `usePricesContext` - Asset prices
- `useOrdersContext` - Order history
- Portfolio tracking example

**4. Solana Integration**
- Solana to EVM swaps
- EVM to Solana swaps
- Dual wallet setup
- Address format requirements

#### Integration Overview
Read: [INTEGRATION.md](./INTEGRATION.md)

Quick reference for:
- Provider setup
- Component usage
- API endpoints
- CAIP standards
- Error handling

#### Pre-built Components
Directory: [frontend/](./frontend/)

Available components:
- `SwapForm.tsx` - Main swap interface
- `SolanaToEvmSwap.tsx` - SOL → EVM swaps
- `EvmToSolanaSwap.tsx` - EVM → SOL swaps
- `UserPortfolio.tsx` - Portfolio viewer
- `SilentSwapProvider.tsx` - Main provider

### API Reference

#### REST API Endpoints

**Get Quote**
```
GET /api/swap/quote
```
Parameters: fromChainId, toChainId, fromToken, toToken, amount, userAddress

**Get Supported Assets**
```
GET /api/swap/assets
```
Returns: Supported chains and tokens in CAIP-19 format

**Health Check**
```
GET /health
```
Returns: Server status

**Webhook**
```
POST /api/webhooks/swap-status
```
Receives: Swap status updates

### Supported Chains & Tokens

#### EVM Chains
- **Ethereum** (1) - ETH, USDC, USDT
- **Polygon** (137) - MATIC, USDC
- **Arbitrum** (42161) - ETH, USDC
- **Avalanche** (43114) - AVAX, USDC

#### Solana
- **Solana** - SOL, USDC (SPL)

See: [src/services/assets.js](./src/services/assets.js)

### Testing & Examples

#### Test Imports
```bash
pnpm test:imports
```
Verifies all dependencies are installed correctly.

#### Backend Examples
```bash
# Simple Bridge
pnpm example:bridge

# Silent Swap
pnpm example:silent
```

#### Frontend Examples
See: [REACT_INTEGRATION.md](./REACT_INTEGRATION.md)

### Troubleshooting

#### Common Issues

**Import Errors**
- Solution: Run `pnpm test:imports` to verify dependencies
- Check: Node.js version (v18+ required)

**Authentication Failures**
- Check: SILENTSWAP_ENVIRONMENT is set to STAGING
- Verify: Private key format (starts with 0x)

**Price Impact Too High**
- Solution: Try a smaller amount
- Check: Bridge provider limits

**Peer Dependency Warnings**
- Note: React Native warnings can be ignored for backend-only usage

See: [GETTING_STARTED.md](./GETTING_STARTED.md#common-issues)

### Security Best Practices

1. **Never commit `.env` files** with real private keys
2. **Use environment variables** for sensitive data
3. **Implement rate limiting** in production
4. **Use HTTPS** in production
5. **Validate user inputs** before processing
6. **Monitor transactions** and handle failures

See: [HOW_IT_WORKS.md](./HOW_IT_WORKS.md#security--trust)

### External Resources

#### Official Documentation
- [SilentSwap Docs](https://docs.silentswap.com)
- [Core SDK Guide](https://docs.silentswap.com/core/simple-bridge/introduction)
- [React SDK Guide](https://docs.silentswap.com/react/overview)

#### GitHub
- [SilentSwap SDK](https://github.com/Auronox/silentswap-v2-sdk)

#### Community
- [Discord](https://discord.gg/silentswap) (if available)
- [Twitter](https://twitter.com/silentswap) (if available)

## 📝 Documentation Standards

### File Naming
- Use UPPERCASE for main documentation files
- Use lowercase for code files
- Use kebab-case for multi-word files

### Structure
- Start with overview/introduction
- Include code examples
- Add troubleshooting sections
- Link to related documentation

### Code Examples
- Use complete, working examples
- Include error handling
- Add comments for clarity
- Show both success and error cases

## 🔄 Keeping Documentation Updated

When adding new features:
1. Update relevant documentation files
2. Add examples to example files
3. Update this index if adding new docs
4. Test all code examples

## 📞 Support

For questions or issues:
1. Check the relevant documentation file
2. Review examples in `examples/`
3. Check [GETTING_STARTED.md](./GETTING_STARTED.md#troubleshooting)
4. Visit [SilentSwap Docs](https://docs.silentswap.com)

---

**Last Updated**: January 2025
**Version**: 1.0.0
