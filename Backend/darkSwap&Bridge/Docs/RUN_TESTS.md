# 🧪 Cara Test API Obscura Swap

Panduan step-by-step untuk test API.

## 📋 Prerequisites

Pastikan sudah:
- ✅ Install dependencies: `pnpm install`
- ✅ Setup `.env` file (tidak perlu private key untuk test API)

## 🚀 Langkah-Langkah Testing

### Step 1: Start Server

Buka **Terminal 1** dan jalankan:

```bash
pnpm dev
```

**Output yang diharapkan:**
```
> obscura-swap@1.0.0 dev
> node --watch src/index.js

🚀 Obscura Swap backend running on port 3000
📡 Environment: development
🔒 Privacy-powered by SilentSwap
```

**Jangan tutup terminal ini!** Server harus tetap berjalan.

### Step 2: Test API

Buka **Terminal 2** (terminal baru) dan pilih salah satu metode:

#### Metode A: Automated Test (Recommended)

```bash
pnpm test:api
```

#### Metode B: Manual cURL

```bash
# Test 1: Health Check
curl http://localhost:3000/health

# Test 2: Get Assets
curl http://localhost:3000/api/swap/assets

# Test 3: Get Quote
curl "http://localhost:3000/api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&amount=1000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

#### Metode C: Browser

Buka di browser:
```
http://localhost:3000/health
http://localhost:3000/api/swap/assets
```

## ✅ Expected Results

### Test 1: Health Check

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "obscura-swap"
}
```

### Test 2: Get Supported Assets

**Request:**
```bash
curl http://localhost:3000/api/swap/assets
```

**Response:**
```json
{
  "chains": [
    {
      "id": 1,
      "name": "Ethereum",
      "symbol": "ETH",
      "caipChainId": "eip155:1",
      "rpcUrl": "https://eth.llamarpc.com"
    },
    {
      "id": 137,
      "name": "Polygon",
      "symbol": "MATIC",
      "caipChainId": "eip155:137",
      "rpcUrl": "https://polygon.llamarpc.com"
    },
    ...
  ],
  "tokens": {
    "eip155:1": [
      {
        "caip19": "eip155:1/slip44:60",
        "symbol": "ETH",
        "name": "Ethereum",
        "decimals": 18,
        "address": "0x0000000000000000000000000000000000000000"
      },
      ...
    ]
  }
}
```

### Test 3: Get Quote

**Request:**
```bash
curl "http://localhost:3000/api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&amount=1000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "provider": "relay",
    "outputAmount": "998500",
    "inputAmount": "1000000",
    "feeUsd": 0.15,
    "slippage": 0.15,
    "estimatedTime": 180,
    "retentionRate": 0.9985,
    "txCount": 1,
    "rawResponse": {...}
  }
}
```

## 🎯 Quick Test Commands

Copy-paste commands ini satu per satu:

```bash
# 1. Health Check
curl http://localhost:3000/health

# 2. Get Assets
curl http://localhost:3000/api/swap/assets

# 3. Quote: ETH → Avalanche (1 USDC)
curl "http://localhost:3000/api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&amount=1000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

# 4. Quote: Polygon → Arbitrum (5 USDC)
curl "http://localhost:3000/api/swap/quote?fromChainId=137&toChainId=42161&fromToken=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&toToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831&amount=5000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

# 5. Webhook Test
curl -X POST http://localhost:3000/api/webhooks/swap-status \
  -H "Content-Type: application/json" \
  -d '{"swapId":"test-123","status":"pending","txHash":"0x1234"}'
```

## 🔍 Troubleshooting

### Error: "fetch failed" atau "Connection refused"

**Penyebab:** Server belum berjalan

**Solusi:**
1. Buka terminal baru
2. Jalankan `pnpm dev`
3. Tunggu sampai muncul "🚀 Obscura Swap backend running"
4. Baru jalankan test di terminal lain

### Error: "Port 3000 already in use"

**Solusi 1:** Kill process yang menggunakan port 3000
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**Solusi 2:** Ganti port di `.env`
```env
PORT=3001
```

### Error: "Module not found"

**Solusi:**
```bash
pnpm install
```

## 📊 Test Checklist

Centang setelah berhasil:

- [ ] Server berjalan di port 3000
- [ ] Health check return `{"status":"ok"}`
- [ ] Get assets return list chains & tokens
- [ ] Get quote return quote data
- [ ] Webhook return `{"received":true}`

## 🎓 Tips

1. **Gunakan 2 terminal**: Satu untuk server, satu untuk test
2. **Check server logs**: Lihat terminal server untuk error details
3. **Test bertahap**: Mulai dari health check dulu
4. **Save responses**: `curl ... > response.json` untuk analisis
5. **Pretty print**: `curl ... | jq` (jika punya jq installed)

## 📝 Next Steps

Setelah API test berhasil:

1. ✅ Test imports: `pnpm test:imports`
2. ✅ Setup private key di `.env` (untuk backend examples)
3. ✅ Test bridge: `pnpm example:bridge`
4. ✅ Test silent swap: `pnpm example:silent`

## 📚 Documentation

- [Test Guide](./TEST_GUIDE.md) - Detailed testing guide
- [Getting Started](./GETTING_STARTED.md) - Setup guide
- [Quick Reference](./QUICK_REFERENCE.md) - API reference

---

**Need Help?** Check [TEST_GUIDE.md](./TEST_GUIDE.md) for more details.
