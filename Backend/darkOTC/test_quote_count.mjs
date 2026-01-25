/**
 * Test Quote Count Feature
 * 
 * This script tests the quote_count field in quote request responses:
 * 1. Create quote request
 * 2. Verify quote_count = 0 initially
 * 3. Submit 3 quotes
 * 4. Verify quote_count = 3
 */

import crypto from 'crypto';

// Import WOTS from the bundled file
const wotsModule = await import('./node_modules/mochimo-wots-v2/dist/index.es.js');
const WOTS = wotsModule.WOTS;

console.log('=== Testing Quote Count Feature ===\n');

// Helper function to generate WOTS+ keypair
function generateWOTSKeypair() {
  const secret = new Uint8Array(32);
  crypto.randomFillSync(secret);

  const pubSeed = new Uint8Array(32);
  crypto.randomFillSync(pubSeed);

  const rnd2 = new Uint8Array(32);
  crypto.randomFillSync(rnd2);

  const publicKey = new Uint8Array(2144);
  WOTS.wots_pkgen(publicKey, secret, pubSeed, 0, rnd2);

  // Create full address (2208 bytes)
  const address = new Uint8Array(2208);
  address.set(publicKey, 0);
  address.set(pubSeed, 2144);
  address.set(rnd2, 2176);

  return {
    address: Buffer.from(address).toString('hex'),
    secret,
    pubSeed,
    rnd2,
  };
}

// Helper function to sign message
function signMessage(message, secret, pubSeed, rnd2) {
  const messageBytes = Buffer.from(message, 'utf-8');
  const messageHash = crypto.createHash('sha256').update(messageBytes).digest();

  const signature = new Uint8Array(2144);
  WOTS.wots_sign(signature, messageHash, secret, pubSeed, 0, rnd2);

  return Buffer.from(signature).toString('hex');
}

try {
  // Step 1: Create quote request
  console.log('Step 1: Create Quote Request');
  const takerKeypair = generateWOTSKeypair();
  
  const quoteRequestData = {
    assetPair: 'SOL/USDC',
    direction: 'buy',
    amount: '1000000000', // 1 SOL
    timeout: Date.now() + 3600000, // 1 hour
  };

  const createMessage = `create_quote_request:${quoteRequestData.assetPair}:${quoteRequestData.direction}:${quoteRequestData.amount}:${quoteRequestData.timeout}`;
  const createSignature = signMessage(createMessage, takerKeypair.secret, takerKeypair.pubSeed, takerKeypair.rnd2);

  const createResponse = await fetch('http://localhost:3000/api/v1/rfq/quote-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assetPair: quoteRequestData.assetPair,
      direction: quoteRequestData.direction,
      amount: quoteRequestData.amount,
      timeout: quoteRequestData.timeout,
      signature: createSignature,
      publicKey: takerKeypair.address,
      message: createMessage,
      chainId: 'solana-devnet',
    }),
  });

  const createResult = await createResponse.json();

  if (!createResult.success) {
    console.log('❌ Failed to create quote request');
    console.log('Response:', JSON.stringify(createResult, null, 2));
    process.exit(1);
  }

  const quoteRequestId = createResult.data.quoteRequestId;
  console.log('✅ Quote request created:', quoteRequestId);

  // Step 2: Get quote request and verify quote_count = 0
  console.log('\nStep 2: Verify Initial Quote Count = 0');
  
  const getResponse1 = await fetch(`http://localhost:3000/api/v1/rfq/quote-request/${quoteRequestId}`);
  const getResult1 = await getResponse1.json();

  if (!getResult1.success) {
    console.log('❌ Failed to get quote request');
    process.exit(1);
  }

  console.log('Quote count:', getResult1.data.quote_count);
  
  if (getResult1.data.quote_count !== 0) {
    console.log('❌ Expected quote_count = 0, got:', getResult1.data.quote_count);
    process.exit(1);
  }
  
  console.log('✅ Initial quote_count = 0 (correct)');

  // Step 3: Submit 3 quotes
  console.log('\nStep 3: Submit 3 Quotes');
  
  for (let i = 1; i <= 3; i++) {
    const mmKeypair = generateWOTSKeypair();
    const price = `${50000000 + i * 1000000}`; // Different prices
    const expirationTime = Date.now() + 1800000; // 30 minutes

    const quoteMessage = `submit_quote:${quoteRequestId}:${price}:${expirationTime}`;
    const quoteSignature = signMessage(quoteMessage, mmKeypair.secret, mmKeypair.pubSeed, mmKeypair.rnd2);

    const quoteResponse = await fetch('http://localhost:3000/api/v1/rfq/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteRequestId,
        price,
        expirationTime,
        signature: quoteSignature,
        publicKey: mmKeypair.address,
      }),
    });

    const quoteResult = await quoteResponse.json();

    if (!quoteResult.success) {
      console.log(`❌ Failed to submit quote ${i}`);
      console.log('Response:', JSON.stringify(quoteResult, null, 2));
      process.exit(1);
    }

    console.log(`✅ Quote ${i} submitted: ${quoteResult.data.quoteId}`);
  }

  // Step 4: Get quote request and verify quote_count = 3
  console.log('\nStep 4: Verify Quote Count = 3');
  
  const getResponse2 = await fetch(`http://localhost:3000/api/v1/rfq/quote-request/${quoteRequestId}`);
  const getResult2 = await getResponse2.json();

  if (!getResult2.success) {
    console.log('❌ Failed to get quote request');
    process.exit(1);
  }

  console.log('Quote count:', getResult2.data.quote_count);
  
  if (getResult2.data.quote_count !== 3) {
    console.log('❌ Expected quote_count = 3, got:', getResult2.data.quote_count);
    process.exit(1);
  }
  
  console.log('✅ Quote count = 3 (correct)');

  // Step 5: Test GET /api/v1/rfq/quote-requests (list endpoint)
  console.log('\nStep 5: Test Quote Requests List Endpoint');
  
  const listResponse = await fetch('http://localhost:3000/api/v1/rfq/quote-requests?status=active');
  const listResult = await listResponse.json();

  if (!listResult.success) {
    console.log('❌ Failed to get quote requests list');
    process.exit(1);
  }

  const ourRequest = listResult.data.quoteRequests.find((qr) => qr.id === quoteRequestId);
  
  if (!ourRequest) {
    console.log('❌ Our quote request not found in list');
    process.exit(1);
  }

  console.log('Quote count in list:', ourRequest.quote_count);
  
  if (ourRequest.quote_count !== 3) {
    console.log('❌ Expected quote_count = 3 in list, got:', ourRequest.quote_count);
    process.exit(1);
  }
  
  console.log('✅ Quote count in list = 3 (correct)');

  // Step 6: Verify taker_public_key is present
  console.log('\nStep 6: Verify taker_public_key Field');
  
  if (!getResult2.data.taker_public_key) {
    console.log('❌ taker_public_key field missing!');
    process.exit(1);
  }
  
  console.log('✅ taker_public_key present:', getResult2.data.taker_public_key.substring(0, 32) + '...');

  if (!ourRequest.taker_public_key) {
    console.log('❌ taker_public_key field missing in list!');
    process.exit(1);
  }
  
  console.log('✅ taker_public_key present in list');

  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('✅ quote_count field working correctly');
  console.log('✅ taker_public_key field present in responses');
  console.log('✅ Quote count updates in real-time');
  console.log('✅ Both single and list endpoints working');

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.log('\nMake sure backend is running: npm run dev');
  process.exit(1);
}
