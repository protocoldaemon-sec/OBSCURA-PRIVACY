# Obscura Swap Backend

Backend API untuk Obscura Swap - Privacy-focused cross-chain swap platform powered by SilentSwap.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` file sesuai kebutuhan.

### 3. Run Server

```bash
# Development mode (auto-reload)
pnpm dev

# Production mode
pnpm start
```

Server akan berjalan di `http://localhost:3000`

## 📋 Available Scripts

```bash
# Start server
pnpm start          # Production mode
pnpm dev            # Development mode with auto-reload

# Testing
pnpm test:imports   # Test all imports
pnpm test:api       # Test API endpoints
pnpm test:curl      # Test with cURL (Linux/Mac)

# Examples
pnpm example:bridge # Simple Bridge example
pnpm example:silent # Silent Swap example
```

## 🔌 API Endpoints

### Health Check
```
GET /health
```

### Get Supported Assets
```
GET /api/swap/assets
```

### Get Quote
```
GET /api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0x...&toToken=0x...&amount=1000000&userAddress=0x...
```

### Webhook
```
POST /api/webhooks/swap-status
```

## 🧪 Testing

### Test API (Server harus berjalan)

**Terminal 1:**
```bash
pnpm dev
```

**Terminal 2:**
```bash
pnpm test:api
```

### Manual Test dengan cURL

```bash
# Health check
curl http://localhost:3000/health

# Get assets
curl http://localhost:3000/api/swap/assets

# Get quote
curl "http://localhost:3000/api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&amount=1000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

## 📁 Project Structure

```
backend/
├── src/                    # Source code
│   ├── config/            # Configuration
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── index.js           # Server entry point
├── examples/              # Example scripts
│   ├── node-backend-example.js
│   └── test-imports.js
├── test/                  # Test files
│   ├── api-test.js
│   ├── manual-test.http
│   └── curl-test.sh
├── .env.example           # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🔐 Environment Variables

```env
# Required
PORT=3000
SILENTSWAP_ENVIRONMENT=STAGING
NEXT_PUBLIC_INTEGRATOR_ID=obscura-swap

# Optional
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
WEBHOOK_URL=http://localhost:3000/webhooks/swap-status

# For examples only (DO NOT COMMIT)
PRIVATE_KEY=0x...
```

## 🌐 Supported Chains

- **Ethereum** (1) - ETH, USDC, USDT
- **Polygon** (137) - MATIC, USDC
- **Arbitrum** (42161) - ETH, USDC
- **Avalanche** (43114) - AVAX, USDC
- **Solana** - SOL, USDC (SPL)

## 📖 Documentation

Lihat dokumentasi lengkap di root project:
- [Getting Started](../GETTING_STARTED.md)
- [How It Works](../HOW_IT_WORKS.md)
- [Core SDK Guide](../CORE_SDK_GUIDE.md)
- [Test Guide](../TEST_GUIDE.md)

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Module Not Found

```bash
pnpm install
```

### Test Failed

Pastikan server sudah berjalan di terminal lain sebelum run test.

## 💡 Tips

1. Gunakan 2 terminal: satu untuk server, satu untuk test
2. Check server logs untuk error details
3. Test dengan `pnpm test:imports` dulu
4. Untuk examples, perlu setup PRIVATE_KEY di `.env`

## 📞 Support

- [Documentation](../DOCUMENTATION_INDEX.md)
- [Quick Reference](../QUICK_REFERENCE.md)
- [Official Docs](https://docs.silentswap.com)

## 📄 License

MIT
