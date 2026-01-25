/**
 * Fund Light Protocol Payer with Devnet SOL
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const PAYER_PUBKEY = 'DXt5J27KBRyATSoofZ2zSFu56bUBN6SpwTyQAvioxEZx';
const RPC_URL = 'https://api.devnet.solana.com';

async function fundPayer() {
  console.log('🔄 Requesting devnet SOL airdrop...\n');
  
  const connection = new Connection(RPC_URL, 'confirmed');
  const publicKey = new PublicKey(PAYER_PUBKEY);
  
  try {
    // Request 2 SOL (max per request)
    const signature = await connection.requestAirdrop(
      publicKey,
      2 * LAMPORTS_PER_SOL
    );
    
    console.log('⏳ Confirming transaction...');
    await connection.confirmTransaction(signature);
    
    // Check balance
    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    console.log('✅ Airdrop successful!\n');
    console.log(`📊 Current Balance: ${solBalance} SOL`);
    console.log(`🔗 Transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    console.log('\n✨ Ready to use ZK Compression!');
    console.log('   Start backend: cd backend/packages/backend && pnpm dev');
    
  } catch (error) {
    console.error('❌ Airdrop failed:', error.message);
    console.log('\n💡 Alternative options:');
    console.log('1. Visit: https://faucet.solana.com');
    console.log(`2. Enter address: ${PAYER_PUBKEY}`);
    console.log('3. Request 2 SOL');
    console.log('\nOr try again in a few minutes (rate limit).');
  }
}

fundPayer();
