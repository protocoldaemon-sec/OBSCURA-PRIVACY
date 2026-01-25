# Whitelist Mode Configuration

## Overview

Obscura Dark OTC RFQ mendukung 2 mode untuk market maker authorization:

1. **Permissionless Mode** (Default) - Siapa saja bisa jadi market maker
2. **Permissioned Mode** - Hanya market maker yang di-whitelist yang bisa submit quote

---

## 🔓 Permissionless Mode (Recommended untuk Testing/Open Market)

### Konfigurasi

Set di `.env`:
```bash
WHITELIST_MODE=permissionless
```

### Behavior

- ✅ **Siapa saja bisa jadi market maker** - tidak perlu approval
- ✅ **Tidak perlu whitelist manual** - admin tidak perlu approve setiap user
- ✅ **Cocok untuk testing** - developer bisa langsung test tanpa setup whitelist
- ✅ **Cocok untuk open market** - decentralized, permissionless trading
- ⚠️ **Tidak ada quality control** - siapa saja bisa submit quote (good or bad)

### Use Cases

- Development & testing
- Open/permissionless markets
- Community-driven liquidity
- Decentralized trading platforms

---

## 🔒 Permissioned Mode (Recommended untuk Production)

### Konfigurasi

Set di `.env`:
```bash
WHITELIST_MODE=permissioned
```

### Behavior

- ✅ **Quality control** - hanya market maker terpercaya yang bisa submit quote
- ✅ **Admin approval required** - admin harus whitelist setiap market maker
- ✅ **Audit trail** - semua whitelist changes di-log
- ⚠️ **Manual management** - admin harus manage whitelist

### Use Cases

- Production environments
- Regulated markets
- Institutional trading
- Quality-controlled liquidity

---

## 🔧 Switching Between Modes

### Switch ke Permissionless (No Whitelist)

```bash
# 1. Update .env
WHITELIST_MODE=permissionless

# 2. Restart backend
npm run dev
```

### Switch ke Permissioned (Whitelist Required)

```bash
# 1. Update .env
WHITELIST_MODE=permissioned

# 2. Restart backend
npm run dev

# 3. Whitelist market makers
curl -X POST http://localhost:3000/api/v1/admin/whitelist/add \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your-admin-key" \
  -d '{
    "address": "market_maker_public_key_hex"
  }'
```

---

## 📋 Admin Whitelist Management (Permissioned Mode Only)

### Add Market Maker to Whitelist

```bash
curl -X POST http://localhost:3000/api/v1/admin/whitelist/add \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: ${ADMIN_PUBLIC_KEY}" \
  -d '{
    "address": "0x1234567890abcdef..."
  }'
```

### Remove Market Maker from Whitelist

```bash
curl -X POST http://localhost:3000/api/v1/admin/whitelist/remove \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: ${ADMIN_PUBLIC_KEY}" \
  -d '{
    "address": "0x1234567890abcdef..."
  }'
```

### Get All Whitelisted Market Makers

```bash
curl -X GET http://localhost:3000/api/v1/admin/whitelist \
  -H "X-Admin-Key: ${ADMIN_PUBLIC_KEY}"
```

---

## 🧪 Testing

### Test Permissionless Mode

```bash
# 1. Set permissionless mode
echo "WHITELIST_MODE=permissionless" >> .env

# 2. Start backend
npm run dev

# 3. Run test (no whitelist needed!)
node test_full_rfq_flow.mjs
```

Expected: ✅ All steps pass without whitelist errors

### Test Permissioned Mode

```bash
# 1. Set permissioned mode
echo "WHITELIST_MODE=permissioned" >> .env

# 2. Start backend
npm run dev

# 3. Run test (will fail at step 2)
node test_full_rfq_flow.mjs
```

Expected: ❌ Step 2 fails with `NOT_WHITELISTED` error

```bash
# 4. Whitelist market maker
# (Get public key from test output)
curl -X POST http://localhost:3000/api/v1/admin/whitelist/add \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: ${ADMIN_PUBLIC_KEY}" \
  -d '{
    "address": "market_maker_public_key_from_test"
  }'

# 5. Run test again
node test_full_rfq_flow.mjs
```

Expected: ✅ All steps pass

---

## 🎯 Recommendations

### For Development/Testing
```bash
WHITELIST_MODE=permissionless
```
- Faster development
- No manual whitelist management
- Easy testing with multiple accounts

### For Production (Regulated)
```bash
WHITELIST_MODE=permissioned
```
- Quality control
- Compliance requirements
- Institutional trading

### For Production (Open Market)
```bash
WHITELIST_MODE=permissionless
```
- Decentralized
- Community-driven
- No gatekeeping

---

## 🔍 How It Works

### Permissionless Mode

```typescript
// In whitelist.service.ts
async isWhitelisted(address: string): Promise<boolean> {
  if (config.whitelist.mode === 'permissionless') {
    console.log('Permissionless mode: allowing all market makers');
    return true; // ✅ Always allow
  }
  
  // Check database...
}
```

### Permissioned Mode

```typescript
// In whitelist.service.ts
async isWhitelisted(address: string): Promise<boolean> {
  if (config.whitelist.mode === 'permissioned') {
    // Query database
    const { data } = await db.from('whitelist')
      .select('address')
      .eq('address', address)
      .maybeSingle();
    
    return data !== null; // ✅ Only if in whitelist
  }
}
```

---

## ✅ Summary

**Default Mode**: `permissionless` (siapa saja bisa jadi market maker)

**Untuk testing**: Gunakan `permissionless` mode - tidak perlu whitelist manual!

**Untuk production**: Pilih sesuai kebutuhan:
- Open market → `permissionless`
- Regulated market → `permissioned`

**Tidak perlu manual whitelist setiap user** - gunakan permissionless mode! 🎉
