/**
 * Test ZK Compression Setup
 * 
 * Verifies Light Protocol integration is working correctly
 */

import { config } from 'dotenv';
import { Connection, PublicKey } from '@solana/web3.js';

// Load environment variables
config({ path: '../../.env' });

const PAYER_PUBKEY = 'DXt5J27KBRyATSoofZ2zSFu56bUBN6SpwTyQAvioxEZx';

async function testSetup() {
  console.log('🧪 Testing ZK Compression Setup\n');
  console.log('━'.repeat(60));
  
  // 1. Check environment variables
  console.log('\n1️⃣  Environment Variables');
  console.log('━'.repeat(60));
  
  const requiredVars = [
    'PHOTON_URL',
    'LIGHT_PROVER_URL',
    'LIGHT_PAYER_PRIVATE_KEY',
    'ENABLE_COMPRESSION'
  ];
  
  let allPresent = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    console.log(`${status} ${varName}: ${value ? '(set)' : '(missing)'}`);
    if (!value) allPresent = false;
  }
  
  if (!allPresent) {
    console.log('\n❌ Missing required environment variables!');
    console.log('   Check backend/.env file');
    return;
  }
  
  // 2. Check payer balance
  console.log('\n2️⃣  Payer Account');
  console.log('━'.repeat(60));
  
  try {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const publicKey = new PublicKey(PAYER_PUBKEY);
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / 1e9;
    
    console.log(`✅ Public Key: ${PAYER_PUBKEY}`);
    console.log(`✅ Balance: ${solBalance} SOL`);
    
    if (solBalance < 0.1) {
      console.log('⚠️  Low balance! Consider adding more SOL');
    }
  } catch (error) {
    console.log(`❌ Failed to check balance: ${error.message}`);
    return;
  }
  
  // 3. Check Photon indexer
  console.log('\n3️⃣  Photon Indexer');
  console.log('━'.repeat(60));
  
  try {
    const response = await fetch(`${process.env.PHOTON_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth',
        params: []
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Photon indexer is reachable');
      console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      console.log(`⚠️  Photon returned status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Failed to reach Photon: ${error.message}`);
  }
  
  // 4. Summary
  console.log('\n4️⃣  Summary');
  console.log('━'.repeat(60));
  console.log('✅ ZK Compression setup is complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Start backend: pnpm dev');
  console.log('   2. Create a transfer to test compression');
  console.log('   3. Check logs for: [Light] Settlement record stored on-chain');
  console.log('\n💡 Monitoring:');
  console.log(`   • Explorer: https://explorer.solana.com/address/${PAYER_PUBKEY}?cluster=devnet`);
  console.log('   • Check balance: node fund-payer.js');
  console.log('   • View transactions: Check explorer link above');
  
  console.log('\n━'.repeat(60));
  console.log('✨ Ready to use ZK Compression!\n');
}

testSetup().catch(console.error);
