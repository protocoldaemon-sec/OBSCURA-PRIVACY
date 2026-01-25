#!/usr/bin/env tsx
/**
 * End-to-End API Test Script
 * 
 * This script demonstrates the full flow:
 * 1. Generate WOTS key pool
 * 2. Register pool with API
 * 3. Create an intent
 * 4. Sign intent with WOTS
 * 5. Submit signed intent
 * 6. Check batches
 * 
 * Run with: npx tsx test-e2e.ts
 */

import { 
  WOTSKeyManager, 
  toHex 
} from '@obscura/crypto';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Helper to make API requests
async function api(method: string, path: string, body?: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// Convert Uint8Array to base64
function toBase64(arr: Uint8Array): string {
  return Buffer.from(arr).toString('base64');
}

// Convert signature array to base64
function signatureToBase64(sig: Uint8Array[]): string {
  const flat = new Uint8Array(sig.length * 32);
  sig.forEach((chunk, i) => flat.set(chunk, i * 32));
  return toBase64(flat);
}

// Convert public key array to base64
function publicKeyToBase64(pk: Uint8Array[]): string {
  const flat = new Uint8Array(pk.length * 32);
  pk.forEach((chunk, i) => flat.set(chunk, i * 32));
  return toBase64(flat);
}

async function main() {
  console.log('Winternitz-SIP E2E Test\n');
  console.log(`API URL: ${BASE_URL}\n`);

  // Step 1: Health check
  console.log('=== Step 1: Health Check ===');
  const health = await api('GET', '/health');
  console.log('Health:', JSON.stringify(health, null, 2));
  console.log('');

  // Step 2: Generate WOTS key pool
  console.log('=== Step 2: Generate WOTS Key Pool ===');
  const poolSize = 4; // Small pool for testing
  const keyManager = await WOTSKeyManager.create({ keyCount: poolSize, w: 16 });
  const merkleRoot = '0x' + toHex(keyManager.getMerkleRoot());
  console.log(`Generated pool with ${poolSize} keys`);
  console.log(`   Merkle root: ${merkleRoot}`);
  console.log(`   Available keys: ${keyManager.availableKeys()}`);
  console.log('');

  // Step 3: Register pool with API
  console.log('=== Step 3: Register Pool ===');
  const registerResult = await api('POST', '/api/v1/pools', {
    merkleRoot,
    totalKeys: poolSize,
    params: { w: 16, n: 32 },
    owner: 'test@example.com',
  });
  console.log(' Pool registered:', JSON.stringify(registerResult, null, 2));
  console.log('');

  // Step 4: Create a transfer intent
  console.log('=== Step 4: Create Transfer Intent ===');
  const transferResult = await api('POST', '/api/v1/transfer', {
    recipient: '0x1234567890abcdef1234567890abcdef12345678',
    asset: '0x0000000000000000000000000000000000000000',
    amount: '1000000000000000000',
    sourceChain: 'ethereum',
    privacyLevel: 'shielded',
  });
  console.log(' Transfer created:', JSON.stringify(transferResult, null, 2));
  const commitment = transferResult.commitment;
  console.log('');

  // Step 5: Sign the intent with WOTS
  console.log('=== Step 5: Sign Intent with WOTS ===');
  
  // Intent hash is the commitment bytes (32 bytes) - used for signing
  const commitmentHex = commitment.startsWith('0x') ? commitment.slice(2) : commitment;
  const intentHash = new Uint8Array(commitmentHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  
  // Sign using next available key
  const signResult = keyManager.signIntent(intentHash);
  
  console.log(` Signed with key index ${signResult.keyIndex}`);
  console.log(`   Intent hash: 0x${toHex(intentHash)}`);
  console.log(`   Signature chunks: ${signResult.signature.length}`);
  console.log(`   Public key chunks: ${signResult.publicKey.length}`);
  console.log(`   Merkle proof siblings: ${signResult.merkleProof.siblings.length}`);
  console.log(`   Remaining keys: ${keyManager.availableKeys()}`);
  console.log('');

  // Step 6: Submit signed intent
  console.log('=== Step 6: Submit Signed Intent ===');
  
  const submitPayload = {
    encryptedIntent: toBase64(new Uint8Array(64)), // Placeholder encrypted data
    ephemeralPubKey: toBase64(new Uint8Array(33)), // Placeholder ephemeral key
    commitment: commitment,
    wotsSignature: signatureToBase64(signResult.signature),
    publicKey: publicKeyToBase64(signResult.publicKey),
    merkleRoot: merkleRoot,
    merkleProof: signResult.merkleProof.siblings.map(s => '0x' + toHex(s)),
    keyIndex: signResult.keyIndex,
  };

  const submitResult = await api('POST', '/api/v1/intents/submit', submitPayload);
  console.log(' Submit result:', JSON.stringify(submitResult, null, 2));
  console.log('');

  // Step 7: Check batches
  console.log('=== Step 7: Check Batches ===');
  const batches = await api('GET', '/api/v1/batches');
  console.log(' Batches:', JSON.stringify(batches, null, 2));
  console.log('');

  // Step 8: Try to reuse the same key (should fail)
  console.log('=== Step 8: Try Key Reuse (Should Fail) ===');
  const reuseResult = await api('POST', '/api/v1/intents/submit', submitPayload);
  console.log(' Reuse result:', JSON.stringify(reuseResult, null, 2));
  console.log('');

  // Step 9: Sign and submit with a different key
  console.log('=== Step 9: Use Different Key ===');
  const signResult2 = keyManager.signIntent(intentHash);
  
  const submitPayload2 = {
    encryptedIntent: toBase64(new Uint8Array(64)),
    ephemeralPubKey: toBase64(new Uint8Array(33)),
    commitment: commitment,
    wotsSignature: signatureToBase64(signResult2.signature),
    publicKey: publicKeyToBase64(signResult2.publicKey),
    merkleRoot: merkleRoot,
    merkleProof: signResult2.merkleProof.siblings.map(s => '0x' + toHex(s)),
    keyIndex: signResult2.keyIndex,
  };

  const submitResult2 = await api('POST', '/api/v1/intents/submit', submitPayload2);
  console.log(` Submit with key ${signResult2.keyIndex}:`, JSON.stringify(submitResult2, null, 2));
  console.log(`   Remaining keys: ${keyManager.availableKeys()}`);
  console.log('');

  // Final: Check batches again
  console.log('=== Final: Check Batches ===');
  const finalBatches = await api('GET', '/api/v1/batches');
  console.log(' Final batches:', JSON.stringify(finalBatches, null, 2));
  console.log('');

  console.log(' E2E Test Complete!\n');
  console.log('Summary:');
  console.log('- Generated WOTS key pool with Merkle tree');
  console.log('- Registered pool with API');
  console.log('- Created shielded transfer intent');
  console.log('- Signed intent with post-quantum WOTS signature');
  console.log('- Demonstrated key burning (one-time use)');
  console.log('- Showed key reuse prevention');
}

main().catch(console.error);
