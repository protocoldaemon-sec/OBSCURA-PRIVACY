import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

const privateKey = '5CSXcKUW4c22oBZCWHy3uLbcRxgSTPRVSHNHfpPTcrw2bNzWL3f1XnMR7QkvfEmpBMLBidCotUFyX5QdfPhjvDMZ';
const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
const publicKey = keypair.publicKey.toBase58();

console.log('='.repeat(60));
console.log('RELAYER WALLET INFO');
console.log('='.repeat(60));
console.log('Public Key:', publicKey);
console.log('');

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

try {
  const balance = await connection.getBalance(keypair.publicKey);
  const balanceSOL = balance / LAMPORTS_PER_SOL;
  
  console.log('Balance:', balance, 'lamports');
  console.log('Balance:', balanceSOL.toFixed(9), 'SOL');
  console.log('');
  
  if (balanceSOL < 0.5) {
    console.log('⚠️  WARNING: Balance is LOW!');
    console.log('');
    console.log('To fund this wallet, visit:');
    console.log('https://faucet.solana.com/');
    console.log('');
    console.log('Or use CLI:');
    console.log(`solana airdrop 2 ${publicKey} --url devnet`);
  } else {
    console.log('✅ Balance is sufficient');
  }
  
  console.log('='.repeat(60));
} catch (error) {
  console.error('Error fetching balance:', error.message);
}
