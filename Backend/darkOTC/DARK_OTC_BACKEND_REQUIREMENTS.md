# Dark OTC Backend Requirements for Alice-Bob Flow

## 🎯 Overview
This document outlines the backend changes needed to support the complete Alice-Bob trading flow in the Dark OTC frontend.

**IMPORTANT**: Backend already has complete settlement logic via `settlementService.executeSettlement()` and `rfqService.acceptQuote()`. Frontend only needs to include `commitment` field in requests.

---

## 📋 Required Backend Changes

### **1. Add `quote_count` Field to Quote Request Responses** ⚠️ CRITICAL

**Affected Endpoints:**
- `GET /api/v1/rfq/quote-requests`
- `GET /api/v1/rfq/quote-request/:id`

**Current Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "asset_pair": "SOL/USDC",
  "direction": "buy",
  "amount_commitment": "5000000",
  "stealth_address": "0x...",
  "taker_public_key": "0x...",
  "created_at": 1737640000000,
  "expires_at": 1737648000000,
  "status": "active",
  "nullifier": null
}
```

**Required Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "asset_pair": "SOL/USDC",
  "direction": "buy",
  "amount_commitment": "5000000",
  "stealth_address": "0x...",
  "taker_public_key": "0x...",
  "created_at": 1737640000000,
  "expires_at": 1737648000000,
  "status": "active",
  "nullifier": null,
  "quote_count": 3  // ← ADD THIS FIELD
}
```

**Implementation Requirements:**
- Count only ACTIVE quotes (status = 'active')
- Exclude expired quotes (expires_at <= current_timestamp)
- Exclude cancelled quotes
- Real-time count (not cached)

**Business Logic:**
```sql
quote_count = COUNT(quotes) WHERE:
  - quote_request_id = current_request_id
  - status = 'active'
  - expires_at > current_timestamp
```

---

### **2. Ensure `taker_public_key` is Always Returned** ✅ VERIFY ONLY

**Verification Needed:**
Both endpoints must ALWAYS include `taker_public_key` field for ownership verification in frontend.

**Why This is Critical:**
- Frontend uses this to show "Your Request" badge
- Frontend uses this to show/hide Cancel button
- Frontend uses this to show/hide Submit Quote button

**Test Cases:**
- ✅ Create request → Response includes `taker_public_key`
- ✅ Get all requests → Each request includes `taker_public_key`
- ✅ Get single request → Response includes `taker_public_key`

**Note**: According to `obscura-dark-otc-rfq-llms.txt`, this field is already documented in responses. Just verify it's actually returned.

---

### **3. Quote Response Optimization** ✅ VERIFY ONLY

**Endpoint:** `GET /api/v1/rfq/quote-request/:id/quotes`

**Expected Response Format:**
```json
{
  "success": true,
  "data": {
    "quotes": [
      {
        "quoteId": "660e8400-e29b-41d4-a716-446655440001",
        "priceCommitment": "150000000",
        "marketMakerPublicKey": "0x...",
        "expiresAt": 1737648000000,
        "status": "active"
      }
    ]
  }
}
```

**Verify:**
- `priceCommitment` is in base units (lamports/wei)
- `marketMakerPublicKey` is full WOTS+ public key (4416 hex chars)
- `expiresAt` is Unix timestamp in milliseconds
- Only return ACTIVE quotes (filter expired automatically)

**Note**: According to documentation, this is already implemented correctly. Just verify behavior.

---

## 🔄 Performance Considerations

### **Database Query Optimization**

**For Quote Count:**
- Use database COUNT query (not fetch all + count in memory)
- Add index on `quote_request_id` and `status` columns if not exists
- Consider caching for 5-10 seconds if high traffic

**Example Query Pattern:**
```sql
SELECT COUNT(*) as quote_count 
FROM quotes 
WHERE quote_request_id = ? 
  AND status = 'active' 
  AND expires_at > NOW()
```

**For Quote Requests List:**
- Join with quotes table to get count in single query
- Avoid N+1 query problem (don't query quotes separately for each request)

**Example Query Pattern:**
```sql
SELECT 
  qr.*,
  COUNT(q.id) as quote_count
FROM quote_requests qr
LEFT JOIN quotes q ON q.quote_request_id = qr.id 
  AND q.status = 'active' 
  AND q.expires_at > NOW()
WHERE qr.status = 'active'
GROUP BY qr.id
```

---

## 📊 Response Time Requirements

**Target Response Times:**
- `GET /api/v1/rfq/quote-requests`: < 200ms
- `GET /api/v1/rfq/quote-request/:id`: < 100ms
- `GET /api/v1/rfq/quote-request/:id/quotes`: < 150ms

**Why This Matters:**
- Frontend will poll these endpoints every 10-30 seconds
- Slow responses = bad UX with auto-refresh
- Users expect real-time updates

---

## 🧪 Testing Requirements

### **Test Case 1: Quote Count Accuracy**
1. Create quote request
2. Verify `quote_count: 0` initially
3. Submit 3 quotes
4. Verify `quote_count: 3`
5. Wait for 1 quote to expire
6. Verify `quote_count: 2` (expired not counted)

### **Test Case 2: Ownership Verification**
1. Alice creates request with WOTS+ keypair A
2. Backend stores `taker_public_key` = keypair A public key
3. GET request returns `taker_public_key` = keypair A public key
4. Bob creates request with WOTS+ keypair B
5. Verify Alice's request still shows keypair A (not overwritten)

### **Test Case 3: Quote Filtering**
1. Create request
2. Submit quote with 30 min expiration
3. Verify quote appears in list
4. Wait 31 minutes
5. Verify quote does NOT appear in list (auto-filtered)
6. Verify `quote_count` decreased by 1

---

## 🚨 Critical Notes

### **WOTS+ Public Key Handling**
- Public keys are 4416 hex characters (2208 bytes)
- Do NOT truncate in backend
- Frontend will handle truncation for display
- Store full public key in database

### **Timestamp Format**
- All timestamps MUST be Unix milliseconds (not seconds)
- JavaScript uses milliseconds: `Date.now()` = 1737640000000
- Consistent format across all endpoints

### **Amount Format**
- All amounts in base units (lamports for SOL, wei for ETH)
- Frontend handles conversion to decimal display
- Example: 5 SOL = 5000000000 lamports

### **Settlement Already Implemented** ✅
- Backend already has `settlementService.executeSettlement()`
- Backend already has `rfqService.acceptQuote()` which calls settlement
- Frontend only needs to include `commitment` field in accept quote request
- DO NOT re-implement settlement logic

---

## 📝 Documentation Updates Needed

After implementing these changes, update `obscura-dark-otc-rfq-llms.txt`:

### **Section 1: Response Examples**
- Add `quote_count` field to all quote request response examples
- Add note about quote_count calculation logic

### **Section 2: Frontend Integration Guide**
- Add polling recommendations (10-30 second intervals)
- Add calculation examples (total cost = amount × price)
- Add best quote selection logic

### **Section 3: Performance Notes**
- Document expected response times
- Document caching strategy (if implemented)
- Document rate limiting (if applicable)

---

## ✅ Acceptance Criteria

**Backend changes are complete when:**

1. ✅ `GET /api/v1/rfq/quote-requests` returns `quote_count` for each request
2. ✅ `GET /api/v1/rfq/quote-request/:id` returns `quote_count` for the request
3. ✅ `quote_count` only includes ACTIVE, non-expired quotes
4. ✅ `taker_public_key` is always included in responses
5. ✅ Response times meet targets (< 200ms)
6. ✅ All test cases pass
7. ✅ Documentation is updated

---

## 🔗 Related Documents

- `FRONTEND_WOTS_INTEGRATION.md` - Frontend WOTS+ implementation guide
- `obscura-dark-otc-rfq-llms.txt` - Complete API documentation
- `obscura-llms.txt` - Obscura Main API documentation (multi-token support)

---

## 📞 Questions for Backend Team

1. **Database Schema:** Does `quotes` table have index on `quote_request_id` and `status`?
2. **Caching:** Should we implement caching for quote_count? If yes, what TTL?
3. **Rate Limiting:** Should we add rate limiting for polling endpoints?
4. **Expired Quotes:** Should we auto-delete expired quotes or just filter them?
5. **Performance:** Current response times for these endpoints?
6. **Settlement:** Confirm `rfqService.acceptQuote()` already calls `settlementService.executeSettlement()` automatically?

---

**Document Version:** 2.0  
**Last Updated:** January 24, 2026  
**Author:** Frontend Team  
**Status:** Pending Backend Implementation

**Changes from v1.0:**
- Clarified that settlement is already implemented
- Added verification-only sections for existing features
- Emphasized `quote_count` as the ONLY new field needed
- Added SQL query examples for optimization
- Removed incorrect assumptions about missing features
