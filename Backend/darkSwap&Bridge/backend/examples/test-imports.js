/**
 * Test script to verify all imports are working correctly
 */

console.log('Testing imports...\n');

try {
  console.log('1. Testing viem imports...');
  const { createWalletClient, http } = await import('viem');
  const { privateKeyToAccount } = await import('viem/accounts');
  const { mainnet, avalanche } = await import('viem/chains');
  console.log('✓ viem imports successful');
  console.log(`  - mainnet chain ID: ${mainnet.id}`);
  console.log(`  - avalanche chain ID: ${avalanche.id}`);
} catch (error) {
  console.error('✗ viem imports failed:', error.message);
}

try {
  console.log('\n2. Testing @silentswap/sdk imports...');
  const sdk = await import('@silentswap/sdk');
  console.log('✓ @silentswap/sdk imports successful');
  console.log(`  - Available exports: ${Object.keys(sdk).slice(0, 10).join(', ')}...`);
} catch (error) {
  console.error('✗ @silentswap/sdk imports failed:', error.message);
}

try {
  console.log('\n3. Testing @silentswap/react imports...');
  const react = await import('@silentswap/react');
  console.log('✓ @silentswap/react imports successful');
  console.log(`  - Available exports: ${Object.keys(react).slice(0, 10).join(', ')}...`);
} catch (error) {
  console.error('✗ @silentswap/react imports failed:', error.message);
}

try {
  console.log('\n4. Testing bignumber.js imports...');
  const { default: BigNumber } = await import('bignumber.js');
  const num = new BigNumber('1.5');
  console.log('✓ bignumber.js imports successful');
  console.log(`  - Test calculation: 1.5 * 10^6 = ${num.shiftedBy(6).toFixed()}`);
} catch (error) {
  console.error('✗ bignumber.js imports failed:', error.message);
}

try {
  console.log('\n5. Testing dotenv...');
  const { config } = await import('dotenv');
  config();
  console.log('✓ dotenv loaded successfully');
  console.log(`  - SILENTSWAP_ENVIRONMENT: ${process.env.SILENTSWAP_ENVIRONMENT || 'not set'}`);
} catch (error) {
  console.error('✗ dotenv failed:', error.message);
}

console.log('\n✅ All import tests completed!');
console.log('\nNext steps:');
console.log('1. Add your PRIVATE_KEY to .env file (for testing only)');
console.log('2. Run: pnpm example:bridge');
console.log('3. Run: pnpm example:silent');
