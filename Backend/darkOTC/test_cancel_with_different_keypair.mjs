/**
 * Test Cancel Quote Request with Different WOTS+ Keypair
 * 
 * This script tests the WOTS+ ownership fix:
 * 1. Create quote request with keypair1
 * 2. Cancel quote request with keypair2 (DIFFERENT)
 * 
 * Before fix: Would fail because backend checks publicKey match
 * After fix: Should succeed because backend only verifies signature
 */

import crypto from 'crypto';

// Import WOTS from the bundled file
const wotsModule = await import('./node_modules/mochimo-wots-v2/dist/index.es.js');
const WOTS = wotsModule.WOTS;

console.log('=== Testing Cancel with Different WOTS+ Keypair ===\n');

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

// Step 1: Generate FIRST keypair for create request
console.log('Step 1: Generate FIRST WOTS+ Keypair');
const keypair1 = generateWOTSKeypair();
console.log('✅ Keypair1 address:', keypair1.address.substring(0, 32) + '...');

// Step 2: Create quote request with keypair1
console.log('\nStep 2: Create Quote Request with Keypair1');
const quoteRequestData = {
  assetPair: 'SOL/USDC',
  direction: 'buy',
  amount: '1000000000', // 1 SOL in lamports
  timeout: Date.now() + 3600000, // 1 hour
};

const createMessage = `create_quote_request:${quoteRequestData.assetPair}:${quoteRequestData.direction}:${quoteRequestData.amount}:${quoteRequestData.timeout}`;
const createSignature = signMessage(createMessage, keypair1.secret, keypair1.pubSeed, keypair1.rnd2);

console.log('Sending create request...');

try {
  const createResponse = await fetch('http://localhost:3000/api/v1/rfq/quote-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assetPair: quoteRequestData.assetPair,
      direction: quoteRequestData.direction,
      amount: quoteRequestData.amount,
      timeout: quoteRequestData.timeout,
      signature: createSignature,
      publicKey: keypair1.address,
      message: createMessage,
      chainId: 'solana-devnet',
    }),
  });

  const createResult = await createResponse.json();

  if (createResponse.status !== 201 || !createResult.success) {
    console.log('❌ Failed to create quote request');
    console.log('Response:', JSON.stringify(createResult, null, 2));
    process.exit(1);
  }

  const quoteRequestId = createResult.data.quoteRequestId;
  console.log('✅ Quote request created!');
  console.log('   Quote Request ID:', quoteRequestId);
  console.log('   Public Key 1:', keypair1.address.substring(0, 32) + '...');

  // Step 3: Generate SECOND keypair for cancel request
  console.log('\nStep 3: Generate SECOND WOTS+ Keypair (DIFFERENT)');
  const keypair2 = generateWOTSKeypair();
  console.log('✅ Keypair2 address:', keypair2.address.substring(0, 32) + '...');
  console.log('   Public keys are DIFFERENT:', keypair1.address !== keypair2.address ? '✅ YES' : '❌ NO');

  // Step 4: Cancel quote request with keypair2 (DIFFERENT)
  console.log('\nStep 4: Cancel Quote Request with Keypair2 (DIFFERENT)');
  const cancelMessage = `cancel_quote_request:${quoteRequestId}`;
  const cancelSignature = signMessage(cancelMessage, keypair2.secret, keypair2.pubSeed, keypair2.rnd2);

  console.log('Sending cancel request with DIFFERENT keypair...');

  const cancelResponse = await fetch(`http://localhost:3000/api/v1/rfq/quote-request/${quoteRequestId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signature: cancelSignature,
      publicKey: keypair2.address, // DIFFERENT from keypair1.address!
    }),
  });

  const cancelResult = await cancelResponse.json();

  console.log('\n=== Cancel Response ===');
  console.log('Status:', cancelResponse.status);
  console.log('Body:', JSON.stringify(cancelResult, null, 2));

  if (cancelResponse.status === 200 && cancelResult.success) {
    console.log('\n✅ SUCCESS! Cancel worked with DIFFERENT keypair!');
    console.log('   Created with PK1:', keypair1.address.substring(0, 32) + '...');
    console.log('   Cancelled with PK2:', keypair2.address.substring(0, 32) + '...');
    console.log('\n🎉 WOTS+ OWNERSHIP FIX WORKING!');
    console.log('   Backend does NOT check if publicKey matches');
    console.log('   Backend ONLY verifies signature is valid');
  } else {
    console.log('\n❌ FAILED! Cancel rejected with different keypair');
    console.log('Error:', cancelResult.error || cancelResult.code);
    console.log('\n⚠️ This means the ownership fix is NOT working');
    console.log('   Backend is still checking if publicKey matches');
    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ Request failed:', error.message);
  console.log('\nMake sure backend is running: npm run dev');
  process.exit(1);
}
