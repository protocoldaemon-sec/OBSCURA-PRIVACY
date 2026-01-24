# Quick Start Guide

Get your darkSwap & Bridge backend up and running in minutes!

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- An EVM wallet private key (for signing transactions)
- RPC endpoints for Ethereum and Avalanche (optional, defaults provided)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Edit the `.env` file and add your private key:

```env
EVM_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

⚠️ **IMPORTANT**: Never commit your `.env` file or share your private key!

## Step 3: Start the Server

```bash
npm start
```

You should see:

```
🚀 darkSwap & Bridge Backend running on port 3000
📍 Environment: development
🔗 SilentSwap API: https://api.silentswap.com

📚 API Documentation:
   Health: http://localhost:3000/api/health
   Bridge: http://localhost:3000/api/bridge/*
   Swap:   http://localhost:3000/api/swap/*

✨ Ready to process transactions!
```

## Step 4: Test the API

### Option 1: Using the test script

```bash
node test-api.js
```

### Option 2: Using curl

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Bridge Quote:**
```bash
curl -X POST http://localhost:3000/api/bridge/quote \
  -H "Content-Type: application/json" \
  -d '{
    "srcChainId": 1,
    "srcToken": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "srcAmount": "1000000",
    "dstChainId": 43114,
    "dstToken": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

## Common Use Cases

### 1. Get a Bridge Quote

Compare providers and get the best rate for bridging tokens:

```javascript
const response = await fetch('http://localhost:3000/api/bridge/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    srcChainId: 1,              // Ethereum
    srcToken: '0xA0b8...',      // USDC on Ethereum
    srcAmount: '1000000',       // 1 USDC (6 decimals)
    dstChainId: 43114,          // Avalanche
    dstToken: '0xB97E...',      // USDC on Avalanche
    userAddress: '0x...'
  })
});
```

### 2. Execute a Silent Swap

Private, non-custodial cross-chain swap:

```javascript
const response = await fetch('http://localhost:3000/api/swap/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientAddress: '0x...',
    tokenAddress: '0xA0b8...',  // USDC
    tokenAmount: '10',           // 10 USDC
    tokenDecimals: 6,
    chainId: 1                   // Ethereum
  })
});
```

### 3. Check Bridge Status

Monitor your bridge transaction:

```javascript
const response = await fetch(
  'http://localhost:3000/api/bridge/status/REQUEST_ID?provider=relay'
);
```

## Token Addresses Reference

### USDC
- Ethereum: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- Avalanche: `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`

### Native Tokens
- Use `0x0` or `0x0000000000000000000000000000000000000000`

### Chain IDs
- Ethereum: `1`
- Avalanche: `43114`
- Polygon: `137`
- Arbitrum: `42161`
- Optimism: `10`

## Troubleshooting

### "Configuration validation failed: EVM_PRIVATE_KEY is required"

Make sure you've set `EVM_PRIVATE_KEY` in your `.env` file.

### "Failed to get nonce" or authentication errors

Check that:
1. Your private key is valid
2. You have an internet connection
3. The SilentSwap API is accessible

### Port already in use

Change the port in `.env`:
```env
PORT=3001
```

## Next Steps

- Read the full [README.md](./README.md) for detailed API documentation
- Check [resources.md](./resources.md) for SDK examples
- Enable API key authentication for production
- Set up proper RPC endpoints (Alchemy, Infura, etc.)

## Security Reminders

✅ **DO:**
- Use environment variables for sensitive data
- Enable API key authentication in production
- Use HTTPS in production
- Keep dependencies updated

❌ **DON'T:**
- Commit `.env` file to version control
- Share your private keys
- Use development settings in production
- Expose the API without authentication

## Support

Need help? Check:
- [SilentSwap Documentation](https://docs.silentswap.com)
- [resources.md](./resources.md) for detailed examples
- GitHub issues for bug reports
