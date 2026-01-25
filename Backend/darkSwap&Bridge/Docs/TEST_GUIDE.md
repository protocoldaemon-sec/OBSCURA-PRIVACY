# Obscura Swap API Testing Guide

Panduan lengkap untuk testing API Obscura Swap.

## 🚀 Quick Start

### 1. Jalankan Server

```bash
# Terminal 1 - Start server
pnpm dev
```

Server akan berjalan di `http://localhost:3000`

### 2. Test API

```bash
# Terminal 2 - Run tests
pnpm test:api
```

## 📋 Test Methods

### Method 1: Automated Test Script (Recommended)

Test semua endpoints secara otomatis:

```bash
pnpm test:api
```

**Output:**
```
═══════════════════════════════════════════════════════
   Obscura Swap API Test Suite
═══════════════════════════════════════════════════════

🧪 Testing: Health Check
   URL: http://localhost:3000/health
   ✅ Success (200)
   Response: {
     "status": "ok",
     "service": "obscura-swap"
   }

🧪 Testing: Get Supported Assets
   ✅ Success (200)
   ...

═══════════════════════════════════════════════════════
   Test Summary
═══════════════════════════════════════════════════════
   Total Tests: 6
   ✅ Passed: 6
   ❌ Failed: 0
   Success Rate: 100.0%
```

### Method 2: cURL Script (Linux/Mac)

```bash
pnpm test:curl
```

atau langsung:

```bash
bash test/curl-test.sh
```

### Method 3: Manual HTTP Requests

Gunakan file `test/manual-test.http` dengan:
- **VS Code**: Install extension "REST Client"
- **IntelliJ/WebStorm**: Built-in HTTP Client

### Method 4: Manual cURL Commands

```bash
# Health Check
curl http://localhost:3000/health

# Get Supported Assets
curl http://localhost:3000/api/swap/assets

# Get Quote
curl "http://localhost:3000/api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&amount=1000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

### Method 5: Browser

Buka di browser:
```
http://localhost:3000/health
http://localhost:3000/api/swap/assets
```

## 🧪 Test Cases

### 1. Health Check

**Endpoint:** `GET /health`

**Expected Response:**
```json
{
  "status": "ok",
  "service": "obscura-swap"
}
```

**Test:**
```bash
curl http://localhost:3000/health
```

### 2. Get Supported Assets

**Endpoint:** `GET /api/swap/assets`

**Expected Response:**
```json
{
  "chains": [
    {
      "id": 1,
      "name": "Ethereum",
      "symbol": "ETH",
      "caipChainId": "eip155:1"
    },
    ...
  ],
  "tokens": {
    "eip155:1": [
      {
        "caip19": "eip155:1/slip44:60",
        "symbol": "ETH",
        "name": "Ethereum",
        "decimals": 18
      },
      ...
    ]
  }
}
```

**Test:**
```bash
curl http://localhost:3000/api/swap/assets
```

### 3. Get Quote (Ethereum → Avalanche)

**Endpoint:** `GET /api/swap/quote`

**Parameters:**
- `fromChainId`: 1 (Ethereum)
- `toChainId`: 43114 (Avalanche)
- `fromToken`: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (USDC)
- `toToken`: 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E (USDC.e)
- `amount`: 1000000 (1 USDC)
- `userAddress`: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "provider": "relay",
    "outputAmount": "998500",
    "inputAmount": "1000000",
    "feeUsd": 0.15,
    "slippage": 0.15,
    "retentionRate": 0.9985,
    "estimatedTime": 180,
    "txCount": 1
  }
}
```

**Test:**
```bash
curl "http://localhost:3000/api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&amount=1000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

### 4. Get Quote (Polygon → Arbitrum)

**Parameters:**
- `fromChainId`: 137 (Polygon)
- `toChainId`: 42161 (Arbitrum)
- `fromToken`: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174 (USDC)
- `toToken`: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 (USDC)
- `amount`: 5000000 (5 USDC)
- `userAddress`: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

**Test:**
```bash
curl "http://localhost:3000/api/swap/quote?fromChainId=137&toChainId=42161&fromToken=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&toToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831&amount=5000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

### 5. Invalid Quote (Missing Parameters)

**Expected:** Error response

**Test:**
```bash
curl "http://localhost:3000/api/swap/quote?fromChainId=1"
```

**Expected Response:**
```json
{
  "error": "Missing required parameters",
  "required": [
    "fromChainId",
    "toChainId",
    "fromToken",
    "toToken",
    "amount",
    "userAddress"
  ]
}
```

### 6. Webhook Status Update

**Endpoint:** `POST /api/webhooks/swap-status`

**Body:**
```json
{
  "swapId": "test-swap-123",
  "status": "pending",
  "txHash": "0x1234567890abcdef"
}
```

**Test:**
```bash
curl -X POST http://localhost:3000/api/webhooks/swap-status \
  -H "Content-Type: application/json" \
  -d '{"swapId":"test-swap-123","status":"pending","txHash":"0x1234567890abcdef"}'
```

**Expected Response:**
```json
{
  "received": true
}
```

## 🔍 Troubleshooting

### Server Not Running

**Error:**
```
Failed to connect to localhost:3000
```

**Solution:**
```bash
# Start server in another terminal
pnpm dev
```

### Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Change port in .env
PORT=3001

# Or kill process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### Quote Fails

**Error:**
```json
{
  "success": false,
  "error": "Failed to get quote"
}
```

**Possible Causes:**
1. Invalid token addresses
2. Unsupported chain combination
3. Amount too small/large
4. Network issues

**Solution:**
- Check token addresses are correct
- Verify chain IDs are supported
- Try different amount
- Check internet connection

## 📊 Test Results Interpretation

### Success (✅)
- Status code: 200-299
- Response contains expected data
- No errors in response

### Failure (❌)
- Status code: 400-599
- Error message in response
- Network/connection issues

### Expected Failures
Some tests are designed to fail (e.g., invalid parameters test). These count as "passed" if they fail correctly.

## 🎯 Best Practices

1. **Always start server first** before running tests
2. **Check server logs** for detailed error messages
3. **Test incrementally** - start with health check
4. **Use realistic amounts** - not too small, not too large
5. **Verify token addresses** from official sources

## 📝 Adding New Tests

### In api-test.js

```javascript
// Add new test
const newTest = await testEndpoint(
  'Test Name',
  `${API_BASE_URL}/api/endpoint?param=value`
);
results.total++;
if (newTest.success) results.passed++;
else results.failed++;
```

### In manual-test.http

```http
### New Test
GET {{baseUrl}}/api/endpoint?param=value
```

### In curl-test.sh

```bash
test_endpoint "Test Name" \
    "$BASE_URL/api/endpoint?param=value"
```

## 🔗 Related Documentation

- [API Documentation](./INTEGRATION.md#api-endpoints)
- [Getting Started](./GETTING_STARTED.md)
- [Quick Reference](./QUICK_REFERENCE.md)

## 💡 Tips

- Use `jq` for pretty JSON output: `curl ... | jq`
- Save responses to file: `curl ... > response.json`
- Test with different amounts to see fee variations
- Compare quotes from different chain combinations
- Monitor server logs while testing

---

**Happy Testing! 🚀**
