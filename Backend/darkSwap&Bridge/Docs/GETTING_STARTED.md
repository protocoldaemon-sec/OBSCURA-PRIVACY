# Getting Started with Obscura Swap

Quick start guide for running Obscura Swap backend.

## Prerequisites

- Node.js v18+ 
- pnpm (or npm/yarn)
- A wallet with some test funds (for examples)

## Installation

```bash
pnpm install
```

## Configuration

1. Copy the `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and configure:
```env
# Basic Configuration
PORT=3000
SILENTSWAP_ENVIRONMENT=STAGING

# For running examples (TESTING ONLY - DO NOT COMMIT)
PRIVATE_KEY=0x...  # Your test wallet private key
```

⚠️ **IMPORTANT**: Never commit your `.env` file with real private keys!

## Verify Installation

Test that all dependencies are installed correctly:

```bash
pnpm test:imports
```

You should see:
```
✓ viem imports successful
✓ @silentswap/sdk imports successful
✓ @silentswap/react imports successful
✓ bignumber.js imports successful
✓ dotenv loaded successfully
```

## Running the Backend Server

Start the Express server:

```bash
# Development mode (with auto-reload)
pnpm dev

# Production mode
pnpm start
```

The server will be available at `http://localhost:3000`

### API Endpoints

- `GET /health` - Health check
- `GET /api/swap/quote` - Get cross-chain swap quote
- `GET /api/swap/assets` - Get supported chains and tokens
- `POST /api/webhooks/swap-status` - Webhook for swap status updates

## Running Examples

### Example 1: Simple Bridge (Cross-Chain Transfer)

This example demonstrates bridging tokens between chains using Relay.link or deBridge:

```bash
pnpm example:bridge
```

**What it does:**
1. Fetches a quote for bridging USDC from Ethereum to Avalanche
2. Compares multiple providers and selects the best rate
3. Executes the bridge transaction
4. Monitors the transaction status

### Example 2: Silent Swap (Private Swap)

This example demonstrates a private cross-chain swap where the sender-recipient link is hidden:

```bash
pnpm example:silent
```

**What it does:**
1. Authenticates with SilentSwap using SIWE (Sign-In with Ethereum)
2. Generates a facilitator wallet group
3. Requests a private swap quote
4. Creates and signs the order
5. Executes the deposit transaction
6. Monitors for completion

## Project Structure

```
obscura-swap/
├── src/                          # Backend source code
│   ├── config/                   # Configuration
│   ├── services/                 # Business logic
│   │   ├── silentswap.js        # Simple Bridge functions
│   │   ├── silentSwapCore.js    # Silent Swap Core SDK functions
│   │   └── assets.js            # Supported chains and tokens
│   ├── routes/                   # API routes
│   ├── middleware/               # Express middleware
│   └── index.js                  # Server entry point
├── frontend/                     # React components (for frontend integration)
│   ├── components/               # Swap UI components
│   ├── providers/                # React providers
│   └── hooks/                    # Custom hooks
├── examples/                     # Example scripts
│   ├── node-backend-example.js  # Complete examples
│   └── test-imports.js          # Import verification
├── .env.example                  # Environment template
├── .env                          # Your configuration (DO NOT COMMIT)
├── README.md                     # Main documentation
├── INTEGRATION.md                # Integration guide
├── CORE_SDK_GUIDE.md            # Core SDK reference
└── GETTING_STARTED.md           # This file
```

## Next Steps

### For Backend Development

1. **Explore the API**: Check out `src/routes/swap.js` for API endpoints
2. **Add Custom Logic**: Extend `src/services/silentswap.js` with your business logic
3. **Implement Webhooks**: Handle swap status updates in `src/routes/webhooks.js`

### For Frontend Integration

1. **Read INTEGRATION.md**: Complete guide for React integration
2. **Use Components**: Pre-built React components in `frontend/components/`
3. **Setup Provider**: Wrap your app with `SilentSwapProvider`

### For Core SDK Usage

1. **Read CORE_SDK_GUIDE.md**: Complete Core SDK reference
2. **Study Examples**: Check `examples/node-backend-example.js`
3. **Understand CAIP**: Learn about CAIP-10 and CAIP-19 standards

## Common Issues

### Issue: "The requested module 'viem/chains' does not provide an export named 'ethereum'"

**Solution**: We use `mainnet` instead of `ethereum` in viem v2+. This is already fixed in the examples.

### Issue: "Failed to get nonce" or "Authentication failed"

**Solution**: 
- Make sure you're using STAGING environment for testing
- Check that your private key is correctly formatted (starts with `0x`)
- Ensure you have a valid internet connection

### Issue: "Price impact too high"

**Solution**: Try a smaller amount. Bridge providers have limits on price impact.

### Issue: Peer dependency warnings

**Solution**: These are warnings from React Native dependencies and can be safely ignored for backend-only usage.

## Testing

### Test Simple Bridge

```bash
# Get a quote
curl "http://localhost:3000/api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&amount=1000000&userAddress=0x..."

# Get supported assets
curl "http://localhost:3000/api/swap/assets"
```

### Test Health Check

```bash
curl "http://localhost:3000/health"
```

## Security Best Practices

1. **Never commit `.env` files** with real private keys
2. **Use environment variables** for all sensitive data
3. **Implement rate limiting** in production
4. **Use HTTPS** in production
5. **Validate all user inputs** before processing
6. **Monitor transaction status** and handle failures gracefully

## Support & Resources

- **Documentation**: [SilentSwap Docs](https://docs.silentswap.com)
- **Core SDK**: [Core SDK Guide](https://docs.silentswap.com/core/simple-bridge/introduction)
- **React SDK**: [React SDK Guide](https://docs.silentswap.com/react/overview)
- **GitHub**: [SilentSwap SDK Repository](https://github.com/Auronox/silentswap-v2-sdk)

## Troubleshooting

If you encounter any issues:

1. Run `pnpm test:imports` to verify all dependencies are installed
2. Check your `.env` file configuration
3. Ensure you're using Node.js v18 or higher
4. Check the console for detailed error messages
5. Review the examples in `examples/node-backend-example.js`

## License

MIT
