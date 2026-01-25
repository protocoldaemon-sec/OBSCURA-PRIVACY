/**
 * Complete Node.js Backend Example for Obscura Swap
 * 
 * This example demonstrates:
 * 1. Simple Bridge (cross-chain token transfers)
 * 2. Silent Swap (private swaps with hidden sender-recipient link)
 */

import { 
  getBridgeQuote,
  convertQuoteResultToQuote,
  executeBridgeTransaction,
  getBridgeStatus,
  createSilentSwapClient,
  createViemSigner,
  ENVIRONMENT,
} from '@silentswap/sdk';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, avalanche } from 'viem/chains';
import {
  authenticateAndDeriveEntropy,
  createFacilitatorGroup,
  getSilentSwapQuote,
  createSilentSwapOrder,
  executeDepositTransaction,
} from '../src/services/silentSwapCore.js';

// ============================================================================
// EXAMPLE 1: Simple Bridge (Cross-Chain Transfer)
// ============================================================================

async function simpleBridgeExample() {
  console.log('=== Simple Bridge Example ===\n');

  // Setup wallet
  const account = privateKeyToAccount(process.env.PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });

  // Simple connector for chain switching
  const connector = {
    switchChain: async ({ chainId }) => {
      console.log(`Switching to chain ${chainId}`);
    },
  };

  try {
    // Step 1: Get quote (compares providers and selects best)
    console.log('Step 1: Fetching bridge quote...');
    const quoteResult = await getBridgeQuote(
      1, // Source chain ID (Ethereum)
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Source token (USDC)
      '1000000', // Amount (1 USDC = 1e6)
      43114, // Destination chain ID (Avalanche)
      '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Destination token (USDC.e)
      account.address
    );

    console.log('Quote received:');
    console.log(`  Provider: ${quoteResult.provider}`);
    console.log(`  Output Amount: ${quoteResult.outputAmount}`);
    console.log(`  Fee (USD): $${quoteResult.feeUsd.toFixed(2)}`);
    console.log(`  Slippage: ${quoteResult.slippage.toFixed(2)}%`);
    console.log(`  Retention Rate: ${(quoteResult.retentionRate * 100).toFixed(2)}%`);

    // Step 2: Convert to executable quote
    console.log('\nStep 2: Converting to executable quote...');
    const quote = convertQuoteResultToQuote(quoteResult, 1);

    // Step 3: Execute transaction
    console.log('\nStep 3: Executing bridge transaction...');
    const status = await executeBridgeTransaction(
      quote,
      walletClient,
      connector,
      (step) => console.log(`  → ${step}`)
    );

    console.log('\nTransaction submitted:');
    console.log(`  Status: ${status.status}`);
    console.log(`  Request ID: ${status.requestId}`);
    console.log(`  Transaction Hashes: ${status.txHashes?.join(', ')}`);

    // Step 4: Monitor status
    if (status.requestId) {
      console.log('\nStep 4: Monitoring bridge status...');
      const finalStatus = await pollBridgeStatus(status.requestId, quoteResult.provider);
      console.log(`Final status: ${finalStatus.status}`);
    }

    return status;
  } catch (error) {
    console.error('Bridge error:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 2: Silent Swap (Private Cross-Chain Swap)
// ============================================================================

async function silentSwapExample() {
  console.log('\n=== Silent Swap Example ===\n');

  // Setup wallet
  const account = privateKeyToAccount(process.env.PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain: avalanche,
    transport: http(),
  }).extend(publicActions);

  // Create signer
  const signer = createViemSigner(account, walletClient);

  // Create SilentSwap client
  const client = createSilentSwapClient({
    environment: ENVIRONMENT.STAGING,
  });

  try {
    // Step 1: Authenticate and derive entropy
    console.log('Step 1: Authenticating with SilentSwap...');
    const entropy = await authenticateAndDeriveEntropy(client, signer);
    console.log('✓ Authentication successful');

    // Step 2: Create facilitator group
    console.log('\nStep 2: Creating facilitator group...');
    const { group, depositCount } = await createFacilitatorGroup(entropy, account.address);
    console.log(`✓ Facilitator group created (deposit count: ${depositCount})`);

    // Step 3: Get quote
    console.log('\nStep 3: Requesting quote...');
    const quoteResponse = await getSilentSwapQuote(
      client,
      signer,
      group,
      account.address, // Recipient address
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
      '10', // 10 USDC
      6 // USDC decimals
    );
    console.log(`✓ Quote received (Quote ID: ${quoteResponse.quoteId})`);

    // Step 4: Create order
    console.log('\nStep 4: Creating order...');
    const orderResponse = await createSilentSwapOrder(
      client,
      signer,
      group,
      quoteResponse
    );
    console.log(`✓ Order created (Order ID: ${orderResponse.response.orderId})`);

    // Step 5: Execute deposit
    console.log('\nStep 5: Executing deposit transaction...');
    const depositResult = await executeDepositTransaction(walletClient, orderResponse);
    console.log(`✓ Deposit confirmed: ${depositResult.hash}`);
    console.log(`  Deposit amount: ${depositResult.depositAmount} microUSDC`);

    return {
      orderId: orderResponse.response.orderId,
      depositHash: depositResult.hash,
      quote: quoteResponse,
    };
  } catch (error) {
    console.error('Silent Swap error:', error);
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function pollBridgeStatus(requestId, provider, maxAttempts = 60, intervalMs = 5000) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getBridgeStatus(requestId, provider);
    
    if (status.status === 'success') {
      return status;
    }
    
    if (status.status === 'failed' || status.status === 'refund') {
      return status;
    }
    
    console.log(`  Attempt ${i + 1}/${maxAttempts}: ${status.status}...`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  throw new Error('Bridge status polling timeout');
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const example = args[0] || 'bridge';

  try {
    if (example === 'bridge') {
      await simpleBridgeExample();
    } else if (example === 'silent') {
      await silentSwapExample();
    } else {
      console.log('Usage: node examples/node-backend-example.js [bridge|silent]');
      console.log('  bridge - Run Simple Bridge example');
      console.log('  silent - Run Silent Swap example');
    }
  } catch (error) {
    console.error('Example failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { simpleBridgeExample, silentSwapExample };
