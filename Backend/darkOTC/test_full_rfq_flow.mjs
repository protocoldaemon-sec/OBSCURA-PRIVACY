/**
 * Test Full RFQ Flow
 * 
 * This script tests the complete RFQ flow:
 * 1. Taker (Account 1) creates quote request
 * 2. Market Maker (Account 2) submits quote
 * 3. Taker (Account 1) accepts quote
 */

import crypto from 'crypto';

// Import WOTS from the bundled file
const wotsModule = await import('./node_modules/mochimo-wots-v2/dist/index.es.js');
const WOTS = wotsModule.WOTS;

const BACKEND_URL = 'http://localhost:3000';

console.log('=== Testing Full RFQ Flow ===');
console.log('');
console.log('⚙️  Configuration:');
console.log('   Backend URL:', BACKEND_URL);
console.log('   Whitelist Mode: Check .env WHITELIST_MODE setting');
console.log('   - permissionless: Anyone can be market maker (default)');
console.log('   - permissioned: Market makers must be whitelisted');
console.log('');

// Helper function to generate WOTS+ address
function generateWOTSAddress() {
  const secret = new Uint8Array(32);
  crypto.randomFillSync(secret);
  
  const pubSeed = new Uint8Array(32);
  crypto.randomFillSync(pubSeed);
  
  const rnd2 = new Uint8Array(32);
  crypto.randomFillSync(rnd2);
  
  const publicKey = new Uint8Array(2144);
  WOTS.wots_pkgen(publicKey, secret, pubSeed, 0, rnd2);
  
  const address = new Uint8Array(2208);
  address.set(publicKey, 0);
  address.set(pubSeed, 2144);
  address.set(rnd2, 2176);
  
  return {
    secret,
    pubSeed,
    rnd2,
    publicKey,
    address,
    addressHex: Buffer.from(address).toString('hex'),
  };
}

// Helper function to sign message
function signMessage(message, secret, pubSeed, rnd2) {
  const messageBytes = Buffer.from(message, 'utf-8');
  const messageHash = crypto.createHash('sha256').update(messageBytes).digest();
  
  const signature = new Uint8Array(2144);
  WOTS.wots_sign(signature, messageHash, secret, pubSeed, 0, rnd2);
  
  return {
    signature,
    signatureHex: Buffer.from(signature).toString('hex'),
    messageHash: messageHash.toString('hex'),
  };
}

// ============================================
// STEP 1: Taker creates quote request
// ============================================
console.log('📝 STEP 1: Taker (Account 1) Creates Quote Request\n');

const takerWOTS = generateWOTSAddress();
console.log('✅ Taker WOTS address generated');
console.log('   Address length:', takerWOTS.addressHex.length, 'chars');

const quoteRequestData = {
  assetPair: 'SOL/USDC',
  direction: 'buy',
  amount: '1000000000', // 1 SOL
  timeout: Date.now() + 3600000, // 1 hour
};

const createRequestMessage = `create_quote_request:${quoteRequestData.assetPair}:${quoteRequestData.direction}:${quoteRequestData.amount}:${quoteRequestData.timeout}`;
const createRequestSig = signMessage(createRequestMessage, takerWOTS.secret, takerWOTS.pubSeed, takerWOTS.rnd2);

console.log('✅ Message signed');
console.log('   Message:', createRequestMessage);
console.log('   Signature length:', createRequestSig.signatureHex.length, 'chars');

try {
  const response = await fetch(`${BACKEND_URL}/api/v1/rfq/quote-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...quoteRequestData,
      signature: createRequestSig.signatureHex,
      publicKey: takerWOTS.addressHex,
      message: createRequestMessage,
      chainId: 'solana-devnet',
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    console.error('❌ Failed to create quote request');
    console.error('Status:', response.status);
    console.error('Error:', result.error || result.code);
    process.exit(1);
  }

  const quoteRequestId = result.data.quoteRequestId;
  const stealthAddress = result.data.stealthAddress;

  console.log('✅ Quote Request Created!');
  console.log('   Quote Request ID:', quoteRequestId);
  console.log('   Stealth Address:', stealthAddress);
  console.log('   Amount:', result.data.commitment, 'lamports');
  console.log('   Expires At:', new Date(result.data.expiresAt).toISOString());

  // ============================================
  // STEP 2: Market Maker submits quote
  // ============================================
  console.log('\n📝 STEP 2: Market Maker (Account 2) Submits Quote\n');

  const marketMakerWOTS = generateWOTSAddress();
  console.log('✅ Market Maker WOTS address generated');
  console.log('   Address length:', marketMakerWOTS.addressHex.length, 'chars');

  const quoteData = {
    quoteRequestId: quoteRequestId,
    price: '150000000000', // 150 USDC per SOL
    expirationTime: Date.now() + 1800000, // 30 minutes
  };

  const submitQuoteMessage = `submit_quote:${quoteData.quoteRequestId}:${quoteData.price}:${quoteData.expirationTime}`;
  const submitQuoteSig = signMessage(submitQuoteMessage, marketMakerWOTS.secret, marketMakerWOTS.pubSeed, marketMakerWOTS.rnd2);

  console.log('✅ Quote message signed');
  console.log('   Message:', submitQuoteMessage);

  const quoteResponse = await fetch(`${BACKEND_URL}/api/v1/rfq/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...quoteData,
      signature: submitQuoteSig.signatureHex,
      publicKey: marketMakerWOTS.addressHex,
      message: submitQuoteMessage,
    }),
  });

  const quoteResult = await quoteResponse.json();

  if (!quoteResponse.ok || !quoteResult.success) {
    console.error('❌ Failed to submit quote');
    console.error('Status:', quoteResponse.status);
    console.error('Error:', quoteResult.error || quoteResult.code);
    
    // Check if it's whitelist error
    if (quoteResult.code === 'NOT_WHITELISTED') {
      console.log('\n⚠️  Market Maker not whitelisted!');
      console.log('\n📝 Solution 1: Use Permissionless Mode (Recommended for Testing)');
      console.log('   1. Edit .env file:');
      console.log('      WHITELIST_MODE=permissionless');
      console.log('   2. Restart backend: npm run dev');
      console.log('   3. Run test again: node test_full_rfq_flow.mjs');
      console.log('\n📝 Solution 2: Whitelist Market Maker (Permissioned Mode)');
      console.log('   Run this command:');
      console.log(`   curl -X POST ${BACKEND_URL}/api/v1/admin/whitelist/add \\`);
      console.log(`     -H "Content-Type: application/json" \\`);
      console.log(`     -H "X-Admin-Key: your-admin-key" \\`);
      console.log(`     -d '{"address": "${marketMakerWOTS.addressHex}"}'`);
      console.log('\n💡 Tip: Permissionless mode is easier for testing!');
    }
    
    process.exit(1);
  }

  const quoteId = quoteResult.data.quoteId;

  console.log('✅ Quote Submitted!');
  console.log('   Quote ID:', quoteId);
  console.log('   Price:', quoteResult.data.priceCommitment, 'lamports');
  console.log('   Expires At:', new Date(quoteResult.data.expiresAt).toISOString());

  // ============================================
  // STEP 3: Taker accepts quote
  // ============================================
  console.log('\n📝 STEP 3: Taker (Account 1) Accepts Quote\n');

  // Generate NEW WOTS address for accept (one-time signature!)
  const takerAcceptWOTS = generateWOTSAddress();
  console.log('✅ Taker NEW WOTS address generated (for accept)');
  console.log('   Address length:', takerAcceptWOTS.addressHex.length, 'chars');

  const acceptQuoteMessage = `accept_quote:${quoteId}`;
  const acceptQuoteSig = signMessage(acceptQuoteMessage, takerAcceptWOTS.secret, takerAcceptWOTS.pubSeed, takerAcceptWOTS.rnd2);

  console.log('✅ Accept message signed');
  console.log('   Message:', acceptQuoteMessage);

  const acceptResponse = await fetch(`${BACKEND_URL}/api/v1/rfq/quote/${quoteId}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signature: acceptQuoteSig.signatureHex,
      publicKey: takerAcceptWOTS.addressHex,
      message: acceptQuoteMessage,
      commitment: '0x1234567890abcdef', // Dummy commitment for testing
    }),
  });

  const acceptResult = await acceptResponse.json();

  if (!acceptResponse.ok || !acceptResult.success) {
    console.error('❌ Failed to accept quote');
    console.error('Status:', acceptResponse.status);
    console.error('Error:', acceptResult.error || acceptResult.code);
    
    // Check if it's ownership error
    if (acceptResult.code === 'NOT_OWNER') {
      console.log('\n⚠️  Taker public key mismatch!');
      console.log('   Quote request was created with:', takerWOTS.addressHex.substring(0, 20) + '...');
      console.log('   Accept was attempted with:', takerAcceptWOTS.addressHex.substring(0, 20) + '...');
      console.log('\n   Note: Backend checks if taker owns the quote request.');
      console.log('   For testing, you need to use the SAME taker public key that created the request.');
    }
    
    process.exit(1);
  }

  console.log('✅ Quote Accepted!');
  console.log('   Quote ID:', acceptResult.data.quoteId);
  console.log('   Quote Request ID:', acceptResult.data.quoteRequestId);
  console.log('   Nullifier:', acceptResult.data.nullifier);
  if (acceptResult.data.txHash) {
    console.log('   Transaction Hash:', acceptResult.data.txHash);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('✅ FULL RFQ FLOW COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(50));
  console.log('\nFlow Summary:');
  console.log('1. ✅ Taker created quote request');
  console.log('2. ✅ Market Maker submitted quote');
  console.log('3. ✅ Taker accepted quote');
  console.log('\nAll WOTS+ signatures verified successfully!');
  console.log('Backend is working with REAL post-quantum cryptography! 🎉');

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
