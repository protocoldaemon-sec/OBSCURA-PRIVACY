# 🎯 START HERE - Obscura Swap Quick Start

Panduan super cepat untuk mulai menggunakan Obscura Swap.

## ✅ Apa yang Sudah Siap

Backend Obscura Swap sudah siap digunakan! Semua dependencies sudah terinstall.

## 🚀 3 Langkah Mudah

### Langkah 1: Masuk ke Folder Backend

```bash
cd backend
```

### Langkah 2: Start Server

```bash
pnpm dev
```

**Output yang akan muncul:**
```
🚀 Obscura Swap backend running on port 3000
📡 Environment: development
🔒 Privacy-powered by SilentSwap
```

✅ **Server sudah berjalan!** Jangan tutup terminal ini.

### Langkah 3: Test API

Buka **terminal baru** (jangan tutup terminal server), lalu:

```bash
cd backend
pnpm test:api
```

**Atau test manual dengan browser:**
- Buka: http://localhost:3000/health
- Buka: http://localhost:3000/api/swap/assets

## 🎉 Selesai!

Jika test berhasil, Anda sudah siap menggunakan Obscura Swap API!

## 📋 Quick Commands

```bash
# Dari folder backend/

# Start server
pnpm dev

# Test imports (tidak perlu server)
pnpm test:imports

# Test API (perlu server running di terminal lain)
pnpm test:api

# Examples (perlu PRIVATE_KEY di .env)
pnpm example:bridge
pnpm example:silent
```

## 🧪 Test dengan cURL

Jika server sudah running, test dengan:

```bash
# Health check
curl http://localhost:3000/health

# Get supported assets
curl http://localhost:3000/api/swap/assets

# Get quote (ETH → Avalanche)
curl "http://localhost:3000/api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&amount=1000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
```

## 🔐 Untuk Run Examples

Jika ingin run `pnpm example:bridge` atau `pnpm example:silent`:

1. **Buat/Export private key Ethereum** (untuk testing)
2. **Edit `backend/.env`**:
   ```env
   PRIVATE_KEY=0x...  # Paste private key di sini
   ```
3. **Run example**:
   ```bash
   pnpm example:bridge
   ```

⚠️ **PENTING**: Gunakan wallet testing dengan saldo kecil saja!

## 📚 Dokumentasi Lengkap

- **[SETUP.md](./SETUP.md)** - Setup guide lengkap
- **[backend/README.md](./backend/README.md)** - Backend guide
- **[TEST_GUIDE.md](./TEST_GUIDE.md)** - Testing guide
- **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)** - Cara kerja privacy
- **[CORE_SDK_GUIDE.md](./CORE_SDK_GUIDE.md)** - API reference

## 🔍 Troubleshooting

### Server tidak bisa start

**Error: "Port 3000 already in use"**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Atau ganti port di `backend/.env`:
```env
PORT=3001
```

### Test API failed

**Error: "fetch failed"**

Pastikan server sudah running di terminal lain:
```bash
# Terminal 1
cd backend
pnpm dev

# Terminal 2 (terminal baru)
cd backend
pnpm test:api
```

### Module not found

```bash
cd backend
pnpm install
```

## 💡 Tips

1. **Gunakan 2 terminal**: Satu untuk server, satu untuk test
2. **Jangan tutup server**: Biarkan server running saat test
3. **Check logs**: Terminal server akan show error details
4. **Test bertahap**: test:imports → test:api → examples

## 🎯 Next Steps

Setelah berhasil:

1. ✅ Explore API endpoints di [backend/README.md](./backend/README.md)
2. ✅ Baca cara kerja privacy di [HOW_IT_WORKS.md](./HOW_IT_WORKS.md)
3. ✅ Lihat contoh code di [backend/examples/](./backend/examples/)
4. ✅ Setup private key untuk run examples
5. ✅ Mulai develop!

---

**Butuh bantuan?** Lihat [SETUP.md](./SETUP.md) untuk panduan lengkap.

**Happy Coding! 🚀**
