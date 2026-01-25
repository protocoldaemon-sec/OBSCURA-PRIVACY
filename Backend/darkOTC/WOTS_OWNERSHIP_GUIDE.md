# WOTS+ Ownership & Authorization Guide

## 🔑 CRITICAL: WOTS+ One-Time Signature Design

**WOTS+ adalah ONE-TIME signature scheme!** Setiap action menggunakan public key yang BERBEDA.

### ❌ WRONG Assumption (Traditional Signatures):
```
User creates request → Public Key A
User cancels request → Public Key A (SAME)
User accepts quote   → Public Key A (SAME)
```

### ✅ CORRECT Design (WOTS+ One-Time):
```
User creates request → Public Key A (used once, NEVER reuse)
User cancels request → Public Key B (NEW, different from A)
User accepts quote   → Public Key C (NEW, different from A and B)
```

## 🎯 How Ownership Works with WOTS+

Backend **TIDAK** verify ownership dengan membandingkan public keys karena setiap action menggunakan PK berbeda.

### Ownership Proven By:

1. **Knowledge of Resource ID**
   - Hanya creator yang tahu `quoteRequestId`
   - Hanya authorized user yang tahu `quoteId`
   - Resource ID adalah secret yang tidak dipublish

2. **Valid WOTS+ Signature**
   - User sign message dengan WOTS+ private key
   - Backend verify signature (proves authenticity)
   - Signature proves user has legitimate access

3. **Encrypted Communication**
   - Messages encrypted to recipient's stealth address
   - Only intended recipient can decrypt
   - Privacy preserved without public key linking

## 📋 Frontend Implementation Guide

### 1. Create Quote Request

```typescript
// Generate NEW WOTS+ keypair for this action
const keypair1 = WOTS.wots_generate_pk_sk();

// Create message to sign
const message = `create_quote_request:${assetPair}:${direction}:${amount}:${timeout}`;

// Sign with WOTS+
const signature = WOTS.wots_sign(message, keypair1.sk);

// Send to backend
const response = await fetch('/api/v1/rfq/quote-request', {
  method: 'POST',
  body: JSON.stringify({
    assetPair,
    direction,
    amount,
    timeout,
    signature,
    publicKey: keypair1.pk,
    message, // CRITICAL: Include original message
  }),
});

// SAVE for later use
localStorage.setItem('quoteRequestId', response.quoteRequestId);
localStorage.setItem('stealthAddress', response.stealthAddress);

// ⚠️ NEVER REUSE keypair1 - it's burned!
```

### 2. Cancel Quote Request

```typescript
// Generate NEW WOTS+ keypair (different from create)
const keypair2 = WOTS.wots_generate_pk_sk();

// Get saved quoteRequestId
const quoteRequestId = localStorage.getItem('quoteRequestId');

// Create message to sign
const message = `cancel_quote_request:${quoteRequestId}`;

// Sign with NEW keypair
const signature = WOTS.wots_sign(message, keypair2.sk);

// Send to backend
await fetch(`/api/v1/rfq/quote-request/${quoteRequestId}/cancel`, {
  method: 'POST',
  body: JSON.stringify({
    signature,
    publicKey: keypair2.pk, // DIFFERENT from keypair1.pk!
  }),
});

// ⚠️ Backend TIDAK check if keypair2.pk == keypair1.pk
// ✅ Backend verify signature proves ownership
```

### 3. Accept Quote

```typescript
// Generate NEW WOTS+ keypair (different from create and cancel)
const keypair3 = WOTS.wots_generate_pk_sk();

// Get saved quoteId
const quoteId = localStorage.getItem('quoteId');

// Create message to sign
const message = `accept_quote:${quoteId}`;

// Sign with NEW keypair
const signature = WOTS.wots_sign(message, keypair3.sk);

// Send to backend
await fetch(`/api/v1/rfq/quote/:id/accept`, {
  method: 'POST',
  body: JSON.stringify({
    signature,
    publicKey: keypair3.pk, // DIFFERENT from keypair1.pk and keypair2.pk!
    commitment: userCommitment,
  }),
});

// ✅ Backend verify signature proves ownership
// ✅ No public key comparison needed
```

### 4. Send Message

```typescript
// Generate NEW WOTS+ keypair
const keypair4 = WOTS.wots_generate_pk_sk();

// Encrypt message content
const encryptedContent = encryptToStealthAddress(content, recipientStealthAddress);

// Create message to sign
const message = `send_message:${quoteRequestId}:${recipientStealthAddress}:${encryptedContent}`;

// Sign with NEW keypair
const signature = WOTS.wots_sign(message, keypair4.sk);

// Send to backend
await fetch('/api/v1/rfq/message', {
  method: 'POST',
  body: JSON.stringify({
    quoteRequestId,
    recipientStealthAddress,
    encryptedContent,
    signature,
    publicKey: keypair4.pk,
  }),
});

// ✅ Backend verify signature proves authenticity
// ✅ No authorization check by public key
```

### 5. Get Messages

```typescript
// Get messages for a quote request
const quoteRequestId = localStorage.getItem('quoteRequestId');

const response = await fetch(
  `/api/v1/rfq/quote-request/${quoteRequestId}/messages?publicKey=${currentPublicKey}`
);

// Backend returns ALL messages for the quote request
// Frontend decrypts only messages intended for user
const messages = response.messages;
const myMessages = messages.map(msg => {
  try {
    // Try to decrypt with user's private key
    const decrypted = decryptWithStealthKey(msg.encryptedContent, userPrivateKey);
    return { ...msg, content: decrypted, canRead: true };
  } catch {
    // Can't decrypt - not for this user
    return { ...msg, content: '[Encrypted]', canRead: false };
  }
});
```

## 🔐 Security Model

### What Proves Ownership?

1. **Knowledge of Resource ID**
   - `quoteRequestId` is only known to creator
   - `quoteId` is only known to authorized users
   - These IDs are NOT public - they're secrets

2. **Valid WOTS+ Signature**
   - Only legitimate user can sign valid message
   - Signature verification proves authenticity
   - Each signature uses fresh keypair (one-time)

3. **Encrypted Content**
   - Messages encrypted to recipient's stealth address
   - Only recipient can decrypt with private key
   - Other participants see encrypted blob

### Why No Public Key Check?

```typescript
// ❌ WRONG (Traditional Signatures):
if (storedPublicKey !== requestPublicKey) {
  throw new Error('Not owner');
}

// ✅ CORRECT (WOTS+ One-Time):
// Ownership proven by:
// 1. User knows the resource ID (secret)
// 2. User can sign valid WOTS+ signature
// No public key comparison needed!
```

## 📊 Comparison: Traditional vs WOTS+

| Aspect | Traditional Signatures | WOTS+ One-Time |
|--------|----------------------|----------------|
| **Public Key** | Same for all actions | Different for each action |
| **Ownership Check** | Compare stored PK with request PK | Verify signature only |
| **Key Reuse** | Safe to reuse | NEVER reuse (security risk) |
| **Authorization** | PK comparison | Knowledge + Signature |
| **Privacy** | PK links all actions | Each action uses fresh PK |

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Reusing WOTS+ Keypair
```typescript
// WRONG - NEVER DO THIS!
const keypair = WOTS.wots_generate_pk_sk();
createRequest(keypair); // First use - OK
cancelRequest(keypair); // REUSE - SECURITY RISK!
```

### ❌ Mistake 2: Expecting Same Public Key
```typescript
// WRONG - This will fail!
const createPK = response1.publicKey;
const cancelPK = keypair2.pk;
if (createPK === cancelPK) { // Will be false!
  // This never happens with WOTS+
}
```

### ❌ Mistake 3: Storing Public Key for Later
```typescript
// WRONG - Don't store PK for authorization
localStorage.setItem('myPublicKey', keypair.pk);
// Later...
const myPK = localStorage.getItem('myPublicKey'); // Useless!
cancelRequest(myPK); // Won't work - need NEW keypair
```

### ✅ Correct Pattern: Store Resource IDs
```typescript
// CORRECT - Store resource IDs, not public keys
localStorage.setItem('quoteRequestId', response.quoteRequestId);
localStorage.setItem('stealthAddress', response.stealthAddress);
// Later...
const qrId = localStorage.getItem('quoteRequestId');
const newKeypair = WOTS.wots_generate_pk_sk(); // Generate NEW
cancelRequest(qrId, newKeypair); // Works!
```

## 📝 Summary for Frontend Developers

1. **Generate NEW WOTS+ keypair for EVERY action**
   - Never reuse keypairs
   - Each action = fresh keypair

2. **Store Resource IDs, not Public Keys**
   - Save `quoteRequestId`, `quoteId`, `stealthAddress`
   - Don't save public keys for authorization

3. **Trust Signature Verification**
   - Backend verifies WOTS+ signature
   - Valid signature = proven ownership
   - No public key comparison needed

4. **Understand Privacy Model**
   - Each action uses different public key
   - Actions are NOT linkable by public key
   - Privacy preserved through stealth addresses

5. **Message Encryption**
   - Encrypt to recipient's stealth address
   - Only recipient can decrypt
   - Backend returns all messages, client filters

## 🔗 Related Documentation

- `BACKEND_WOTS_FIX.md` - WOTS+ signature verification implementation
- `DARK_OTC_CORRECT_INTEGRATION_GUIDE.md` - Complete integration guide
- `obscura-dark-otc-rfq-llms.txt` - API documentation

## ❓ FAQ

**Q: Why can't I use the same public key for cancel that I used for create?**
A: WOTS+ is a ONE-TIME signature scheme. Reusing a keypair after signing compromises security. Each action must use a fresh keypair.

**Q: How does backend know I own the quote request if public keys are different?**
A: Ownership is proven by (1) knowing the quoteRequestId (only creator has this) and (2) signing a valid WOTS+ signature (proves authenticity).

**Q: Is this secure? Can someone else cancel my request?**
A: Yes, it's secure. An attacker would need to (1) know your quoteRequestId (secret) and (2) forge a WOTS+ signature (cryptographically impossible).

**Q: Should I save my public key for later use?**
A: No! Public keys are one-time use. Save resource IDs (quoteRequestId, quoteId) instead. Generate new keypairs for each action.

**Q: Why do I see encrypted messages I can't read?**
A: Backend returns all messages for a quote request. You can only decrypt messages encrypted to your stealth address. Other messages remain encrypted.
