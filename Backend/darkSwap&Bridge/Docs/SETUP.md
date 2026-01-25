# 🚀 Obscura Swap Setup Guide

Panduan lengkap setup project Obscura Swap dengan struktur folder baru.

## 📁 Struktur Project

```
ObscuraSwap/
├── backend/                    # Backend API
│   ├── src/                   # Source code
│   ├── examples/              # Example scripts
│   ├── test/                  # Test files
│   ├── package.json
│   ├── .env.example
│   └── README.md
├── frontend/                   # Frontend components (React)
│   ├── components/
│   ├── providers/
│   └── hooks/
├── docs/                       # Documentation
│   ├── GETTING_STARTED.md
│   ├── HOW_IT_WORKS.md
│   ├── CORE_SDK_GUIDE.md
│   └── ...
├── package.json               # Root package.json
└── README.md                  # Main README
```

## 🔧 Installation

### Step 1: Install Backend Dependencies

```bash
cd backend
pnpm install
```

### Step 2: Setup Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3000
SILENTSWAP_ENVIRONMENT=STAGING
NEXT_PUBLIC_INTEGRATOR_ID=obscura-swap
```

## 🚀 Running Backend

### Cara 1: Dari Folder Backend (Recommended)

```bash
cd backend
pnpm dev
```

### Cara 2: Dari Root Project

```bash
pnpm backend:dev
```

**Output yang diharapkan:**
```
🚀 Obscura Swap backend running on port 3000
📡 Environment: development
🔒 Privacy-powered by SilentSwap
```

## 🧪 Testing

### Test 1: Test Imports

```bash
cd backend
pnpm test:imports
```

**Expected output:**
```
✓ viem imports successful
✓ @silentswap/sdk imports successful
✓ bignumber.js imports successful
✓ dotenv loaded successfully
```

### Test 2: Test API

**Terminal 1 - Start Server:**
```bash
cd backend
pnpm dev
```

**Terminal 2 - Run Tests:**
```bash
cd backend
pnpm test:api
```

**Expected output:**
```
═══════════════════════════════════════════════════════
   Obscura Swap API Test Suite
═══════════════════════════════════════════════════════

🧪 Testing: Health Check
   ✅ Success (200)

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

### Test 3: Manual Test dengan cURL

```bash
# Health check
curl http://localhost:3000/health

# Get assets
curl http://localhost:3000/api/swap/assets
```

## 📝 Quick Commands Cheat Sheet

### Backend Commands

```bash
# Dari folder backend/
cd backend

# Install dependencies
pnpm install

# Start server
pnpm dev              # Development mode
pnpm start            # Production mode

# Testing
pnpm test:imports     # Test imports
pnpm test:api         # Test API (server harus running)

# Examples (perlu PRIVATE_KEY di .env)
pnpm example:bridge   # Simple Bridge
pnpm example:silent   # Silent Swap
```

### Root Commands

```bash
# Dari root project (ObscuraSwap/)

# Install backend
pnpm backend:install

# Run backend
pnpm backend:dev      # Development mode
pnpm backend:start    # Production mode

# Test backend
pnpm backend:test
```

## 🎯 Step-by-Step Testing

### 1. Test Imports (Tidak perlu server)

```bash
cd backend
pnpm test:imports
```

Ini akan test apakah semua dependencies terinstall dengan benar.

### 2. Test API (Perlu server running)

**Terminal 1:**
```bash
cd backend
pnpm dev
```

Tunggu sampai muncul "🚀 Obscura Swap backend running"

**Terminal 2:**
```bash
cd backend
pnpm test:api
```

### 3. Test Manual dengan Browser

Buka di browser:
- http://localhost:3000/health
- http://localhost:3000/api/swap/assets

## 🔐 Setup untuk Examples

Jika ingin run `pnpm example:bridge` atau `pnpm example:silent`, perlu setup private key:

### 1. Generate atau Export Private Key Ethereum

**Cara 1: Buat wallet baru (untuk testing)**
```javascript
// generate-key.js
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log('Private Key:', privateKey);
console.log('Address:', account.address);
```

**Cara 2: Export dari MetaMask**
1. Buka MetaMask
2. Settings → Security & Privacy
3. Show Private Key
4. Copy (format: 0x...)

### 2. Tambahkan ke .env

```env
# backend/.env
PRIVATE_KEY=0x1234567890abcdef...  # Paste private key di sini
```

⚠️ **PENTING**: Jangan gunakan wallet dengan dana besar! Buat wallet baru khusus testing.

### 3. Run Examples

```bash
cd backend
pnpm example:bridge   # Test Simple Bridge
pnpm example:silent   # Test Silent Swap
```

## 🔍 Troubleshooting

### Error: "Module not found"

```bash
cd backend
pnpm install
```

### Error: "Port 3000 already in use"

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:3000 | xargs kill -9
```

Atau ganti port di `backend/.env`:
```env
PORT=3001
```

### Error: "fetch failed" saat test API

**Penyebab:** Server belum running

**Solusi:**
1. Buka terminal baru
2. `cd backend && pnpm dev`
3. Tunggu server start
4. Baru run test di terminal lain

### Error: "Cannot find module 'viem/chains'"

**Solusi:**
```bash
cd backend
pnpm install viem@latest
```

## 📊 Checklist Setup

- [ ] Install dependencies: `cd backend && pnpm install`
- [ ] Copy .env: `cp .env.example .env`
- [ ] Test imports: `pnpm test:imports` ✅
- [ ] Start server: `pnpm dev` ✅
- [ ] Test API: `pnpm test:api` (di terminal lain) ✅
- [ ] Test manual: `curl http://localhost:3000/health` ✅

## 📚 Next Steps

Setelah setup berhasil:

1. ✅ Baca [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) untuk memahami arsitektur
2. ✅ Baca [CORE_SDK_GUIDE.md](./CORE_SDK_GUIDE.md) untuk API reference
3. ✅ Lihat [backend/examples/](./backend/examples/) untuk contoh code
4. ✅ Setup private key untuk run examples
5. ✅ Mulai develop!

## 💡 Tips

1. **Gunakan 2 terminal**: Satu untuk server, satu untuk test/development
2. **Check logs**: Terminal server akan show error details
3. **Test bertahap**: Mulai dari test:imports → test:api → examples
4. **Jangan commit .env**: File .env sudah ada di .gitignore
5. **Gunakan STAGING**: Untuk testing, gunakan STAGING environment

## 📖 Documentation

- [Main README](./README.md) - Project overview
- [Backend README](./backend/README.md) - Backend specific guide
- [Getting Started](./GETTING_STARTED.md) - Detailed guide
- [Test Guide](./TEST_GUIDE.md) - Testing guide
- [Quick Reference](./QUICK_REFERENCE.md) - API reference

## 🆘 Need Help?

1. Check [GETTING_STARTED.md](./GETTING_STARTED.md)
2. Check [TEST_GUIDE.md](./TEST_GUIDE.md)
3. Check [backend/README.md](./backend/README.md)
4. Check [Official Docs](https://docs.silentswap.com)

---

**Happy Coding! 🚀**
