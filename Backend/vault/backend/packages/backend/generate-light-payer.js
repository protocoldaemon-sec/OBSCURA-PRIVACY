/**
 * Generate Light Protocol Payer Keypair
 * 
 * This script generates a new Solana keypair for signing ZK Compression transactions
 */

import { Keypair } from '@solana/web3.js';
import { writeFileSync } from 'fs';

// Generate new keypair
const keypair = Keypair.generate();

// Get public key
const publicKey = keypair.publicKey.toBase58();

// Convert secret key to base64 for .env
const secretKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');

// Save keypair as JSON (Solana CLI format)
const keypairJson = `[${Array.from(keypair.secretKey).join(',')}]`;
writeFileSync('light-payer.json', keypairJson);

console.log('✅ Light Protocol Payer Keypair Generated!\n');
console.log('📋 Public Key (for funding):');
console.log(publicKey);
console.log('\n🔑 Private Key (base64 for .env):');
console.log(secretKeyBase64);
console.log('\n📁 Keypair saved to: light-payer.json');
console.log('\n⚠️  IMPORTANT:');
console.log('1. Fund this address with devnet SOL:');
console.log(`   solana airdrop 1 ${publicKey} --url devnet`);
console.log('   OR visit: https://faucet.solana.com');
console.log('\n2. Add to backend/.env:');
console.log(`   LIGHT_PAYER_PRIVATE_KEY=${secretKeyBase64}`);
console.log('\n3. Keep light-payer.json and the private key SECRET!');
console.log('   Add light-payer.json to .gitignore');
