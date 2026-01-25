/**
 * Test Backend WOTS+ Verification
 * 
 * This script generates a REAL WOTS+ signature and sends it to the backend
 * to verify that backend can verify REAL signatures correctly.
 */

import crypto from 'crypto';

// Import WOTS from the bundled file
const wotsModule = await import('./node_modules/mochimo-wots-v2/dist/index.es.js');
const WOTS = wotsModule.WOTS;

console.log('=== Testing Backend WOTS+ Verification ===\n');

// Step 1: Generate WOTS+ address
console.log('Step 1: Generate WOTS+ Address');
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

const addressHex = Buffer.from(address).toString('hex');
console.log('✅ Address length:', addressHex.length, 'chars (should be 4416)');

// Step 2: Create quote request data
console.log('\nStep 2: Create Quote Request Data');
const quoteRequestData = {
  assetPair: 'SOL/USDC',
  direction: 'buy',
  amount: '1000000000', // 1 SOL in lamports
  timeout: Date.now() + 3600000, // 1 hour
};

// Step 3: Create message (same format as frontend)
const message = `create_quote_request:${quoteRequestData.assetPair}:${quoteRequestData.direction}:${quoteRequestData.amount}:${quoteRequestData.timeout}`;
console.log('Message:', message);

// Step 4: Hash message with SHA-256
const messageBytes = Buffer.from(message, 'utf-8');
const messageHash = crypto.createHash('sha256').update(messageBytes).digest();
console.log('✅ Message hash:', messageHash.toString('hex'));

// Step 5: Sign the hash
console.log('\nStep 3: Sign Message Hash');
const signature = new Uint8Array(2144);
WOTS.wots_sign(signature, messageHash, secret, pubSeed, 0, rnd2);

const signatureHex = Buffer.from(signature).toString('hex');
console.log('✅ Signature length:', signatureHex.length, 'chars (should be 4288)');

// Step 6: Send to backend
console.log('\nStep 4: Send to Backend');

const requestBody = {
  assetPair: quoteRequestData.assetPair,
  direction: quoteRequestData.direction,
  amount: quoteRequestData.amount,
  timeout: quoteRequestData.timeout,
  signature: signatureHex,
  publicKey: addressHex,
  message: message, // ← Send message to backend
  chainId: 'solana-devnet',
};

console.log('Sending request to http://localhost:3000/api/v1/rfq/quote-request...');

try {
  const response = await fetch('http://localhost:3000/api/v1/rfq/quote-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  const result = await response.json();

  console.log('\n=== Backend Response ===');
  console.log('Status:', response.status);
  console.log('Body:', JSON.stringify(result, null, 2));

  if (response.status === 201 && result.success) {
    console.log('\n✅ SUCCESS! Backend verified REAL WOTS+ signature!');
    console.log('Quote Request ID:', result.data.quoteRequestId);
    console.log('Stealth Address:', result.data.stealthAddress);
    console.log('\n🎉 REAL WOTS+ VERIFICATION WORKING ON BACKEND!');
  } else {
    console.log('\n❌ FAILED! Backend rejected signature');
    console.log('Error:', result.error || result.code);
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Request failed:', error.message);
  console.log('\nMake sure backend is running: npm run dev');
  process.exit(1);
}
