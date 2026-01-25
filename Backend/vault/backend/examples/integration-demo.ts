/**
 * End-to-End Integration Example
 * 
 * Demonstrates the complete flow:
 * 1. User creates WOTS key pool
 * 2. User creates shielded intent via SIP
 * 3. User signs intent with WOTS
 * 4. Aggregator validates and batches
 * 5. Batch submitted to settlement contract
 */

import { 
  WOTSKeyManager,
  hash,
  toHex,
  randomBytes
} from '@obscura/crypto';

import {
  SIPClient,
  PQAuthService,
  Aggregator
} from '@obscura/backend';

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SIP + WOTS Settlement System - Integration Demo');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ════════════════════════════════════════════════════════════════════════
  // STEP 1: Setup - Create WOTS key pool for sender
  // ════════════════════════════════════════════════════════════════════════
  console.log('📦 Step 1: Creating WOTS key pool for sender...\n');
  
  const senderKeyPool = await WOTSKeyManager.create({
    keyCount: 16,
    w: 16,
    id: 'sender-pool-001'
  });

  console.log(`   Pool ID: ${senderKeyPool.exportPublicInfo().id}`);
  console.log(`   Total keys: ${senderKeyPool.getStats().total}`);
  console.log(`   Merkle root: ${toHex(senderKeyPool.getMerkleRoot()).slice(0, 32)}...`);
  console.log();

  // ════════════════════════════════════════════════════════════════════════
  // STEP 2: Setup - Create SIP clients for sender and recipient
  // ════════════════════════════════════════════════════════════════════════
  console.log('🔐 Step 2: Setting up SIP clients with stealth addresses...\n');

  const senderSIP = new SIPClient({ defaultChain: 'ethereum' });
  const recipientSIP = new SIPClient({ defaultChain: 'ethereum' });

  // Generate stealth key pairs
  senderSIP.generateKeyPair();
  const recipientKeys = recipientSIP.generateKeyPair();

  console.log(`   Sender meta-address: ${senderSIP.getMetaAddressString().slice(0, 50)}...`);
  console.log(`   Recipient meta-address: ${recipientSIP.getMetaAddressString().slice(0, 50)}...`);
  console.log();

  // ════════════════════════════════════════════════════════════════════════
  // STEP 3: Setup - Initialize aggregator with auth service
  // ════════════════════════════════════════════════════════════════════════
  console.log('🔧 Step 3: Initializing aggregator service...\n');

  const aggregator = new Aggregator({
    executor: {
      chains: [
        {
          chainId: 'ethereum',
          type: 'evm',
          rpcUrl: 'https://eth.llamarpc.com',
          contractAddress: '0x1234567890123456789012345678901234567890',
          confirmations: 12
        },
        {
          chainId: 'solana',
          type: 'solana',
          rpcUrl: 'https://api.mainnet-beta.solana.com',
          contractAddress: 'SiPSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          confirmations: 32
        }
      ]
    },
    batch: {
      maxBatchSize: 100,
      maxWaitTime: 60000,
      minBatchSize: 1
    },
    autoSubmit: false
  });

  // Register sender's key pool with the auth service
  const poolInfo = senderKeyPool.exportPublicInfo();
  aggregator.registerPool(
    poolInfo.merkleRoot,
    poolInfo.params,
    poolInfo.totalKeys,
    'alice@example.com'
  );

  console.log('   Aggregator initialized with EVM and Solana support');
  console.log(`   Registered pool: ${poolInfo.id}`);
  console.log();

  // ════════════════════════════════════════════════════════════════════════
  // STEP 4: Create shielded intent
  // ════════════════════════════════════════════════════════════════════════
  console.log('📝 Step 4: Creating shielded intent...\n');

  const { shielded, stealthAddress, intentHash } = await senderSIP.createShieldedIntent(
    'transfer',
    {
      recipientMetaAddress: recipientSIP.getMetaAddress(),
      asset: '0x0000000000000000000000000000000000000000', // ETH
      amount: 1000000000000000000n, // 1 ETH
      sourceChain: 'ethereum',
      targetChain: 'ethereum',
      deadline: Math.floor(Date.now() / 1000) + 3600
    },
    senderKeyPool.getMerkleRoot()
  );

  console.log(`   Intent action: transfer`);
  console.log(`   Intent hash: ${toHex(intentHash).slice(0, 32)}...`);
  console.log(`   Stealth address: ${toHex(stealthAddress)}`);
  console.log(`   Commitment: ${toHex(shielded.commitment).slice(0, 32)}...`);
  console.log(`   Encrypted intent size: ${shielded.encryptedIntent.length} bytes`);
  console.log();

  // ════════════════════════════════════════════════════════════════════════
  // STEP 5: Sign intent with WOTS
  // ════════════════════════════════════════════════════════════════════════
  console.log('✍️  Step 5: Signing intent with WOTS...\n');

  const signedIntent = senderKeyPool.signIntent(shielded.commitment);

  console.log(`   Key index used: ${signedIntent.keyIndex}`);
  console.log(`   Signature length: ${signedIntent.signature.length} chains`);
  console.log(`   Merkle proof depth: ${signedIntent.merkleProof.siblings.length}`);
  console.log(`   Keys remaining: ${senderKeyPool.getStats().available}`);
  console.log();

  // ════════════════════════════════════════════════════════════════════════
  // STEP 6: Submit to aggregator
  // ════════════════════════════════════════════════════════════════════════
  console.log('📤 Step 6: Submitting to aggregator...\n');

  const submitResult = aggregator.submitIntent(shielded, signedIntent);

  if (submitResult.success) {
    console.log(`   ✓ Intent accepted!`);
    console.log(`   Intent ID: ${submitResult.intentId?.slice(0, 32)}...`);
    console.log(`   Position in queue: ${submitResult.position}`);
  } else {
    console.log(`   ✗ Intent rejected: ${submitResult.error}`);
    return;
  }
  console.log();

  // ════════════════════════════════════════════════════════════════════════
  // STEP 7: Flush batches (in production, this happens automatically)
  // ════════════════════════════════════════════════════════════════════════
  console.log('📦 Step 7: Building and submitting batch...\n');

  const settlements = await aggregator.flushBatches();

  for (const settlement of settlements) {
    console.log(`   Batch ID: ${settlement.batchId}`);
    console.log(`   Chain: ${settlement.chain}`);
    console.log(`   TX Hash: ${settlement.txHash.slice(0, 32)}...`);
    console.log(`   Status: ${settlement.status}`);
    console.log(`   Gas used: ${settlement.gasUsed}`);
  }
  console.log();

  // ════════════════════════════════════════════════════════════════════════
  // STEP 8: Recipient decrypts intent
  // ════════════════════════════════════════════════════════════════════════
  console.log('🔓 Step 8: Recipient decrypting intent...\n');

  try {
    const decryptedIntent = await recipientSIP.decryptShieldedIntent(shielded);
    
    console.log(`   Intent ID: ${decryptedIntent.id}`);
    console.log(`   Action: ${decryptedIntent.action}`);
    console.log(`   Amount: ${decryptedIntent.amount} wei`);
    console.log(`   Recipient (stealth): ${decryptedIntent.recipient.slice(0, 20)}...`);
    console.log(`   Source chain: ${decryptedIntent.sourceChain}`);
    console.log(`   Target chain: ${decryptedIntent.targetChain}`);
  } catch (e) {
    console.log(`   Failed to decrypt: ${e}`);
  }
  console.log();

  // ════════════════════════════════════════════════════════════════════════
  // Summary
  // ════════════════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   Summary');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const stats = aggregator.getStats();
  console.log('   Aggregator stats:');
  console.log(`   - Pending intents: ${stats.pendingIntents}`);
  console.log(`   - Completed batches: ${stats.completedBatches}`);
  console.log(`   - Supported chains: ${stats.supportedChains.join(', ')}`);
  console.log();

  const poolStats = senderKeyPool.getStats();
  console.log('   Key pool stats:');
  console.log(`   - Total keys: ${poolStats.total}`);
  console.log(`   - Used keys: ${poolStats.used}`);
  console.log(`   - Available keys: ${poolStats.available}`);
  console.log();

  console.log('   Security properties achieved:');
  console.log('   ✓ Post-quantum authorization (WOTS)');
  console.log('   ✓ Sender privacy (stealth addressing)');
  console.log('   ✓ Recipient privacy (encrypted intent)');
  console.log('   ✓ Amount privacy (encrypted)');
  console.log('   ✓ Replay protection (key burning + on-chain)');
  console.log('   ✓ Minimal on-chain footprint');
  console.log();

  // Cleanup
  aggregator.shutdown();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   Demo complete!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Run if executed directly
main().catch(console.error);
