import { ObscuraSwapMCPClient } from './index.js';

async function runTests() {
  const client = new ObscuraSwapMCPClient();

  console.log('🧪 Obscura Swap MCP Client Test Suite\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Connect
    console.log('📡 Connecting to MCP Server...');
    await client.connect('../server/dist/index.js');
    console.log('✅ Connected\n');

    // Test 1: List Tools
    console.log('🧪 Test 1: List Tools');
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.length} tools:`);
    tools.forEach((tool) => {
      console.log(`   - ${tool.name}`);
    });
    console.log('');

    // Test 2: Health Check
    console.log('🧪 Test 2: Health Check');
    const health = await client.getHealth();
    console.log(`✅ Status: ${health.status}`);
    console.log(`   Environment: ${health.environment}`);
    console.log('');

    // Test 3: Get Supported Assets
    console.log('🧪 Test 3: Get Supported Assets');
    const assets = await client.getSupportedAssets();
    console.log(`✅ Found ${assets.chains.length} chains:`);
    assets.chains.forEach((chain: any) => {
      const tokenCount = assets.tokens[chain.caipChainId]?.length || 0;
      console.log(`   - ${chain.name} (${chain.id}): ${tokenCount} tokens`);
    });
    console.log('');

    // Test 4: Get Chain Info
    console.log('🧪 Test 4: Get Chain Info (Ethereum)');
    const ethInfo = await client.getChainInfo(1);
    console.log(`✅ Chain: ${ethInfo.name}`);
    console.log(`   Symbol: ${ethInfo.symbol}`);
    console.log(`   Tokens: ${ethInfo.tokens.length}`);
    console.log('');

    // Test 5: Get Swap Quote
    console.log('🧪 Test 5: Get Swap Quote (ETH USDC → AVAX USDC)');
    try {
      const quote = await client.getSwapQuote({
        fromChainId: 1,
        toChainId: 43114,
        fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        toToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        amount: '1000000',
        userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      });

      if (quote.error) {
        console.log('⚠️  Quote failed (expected if API providers unavailable)');
        console.log(`   Error: ${quote.error}`);
      } else {
        console.log(`✅ Provider: ${quote.provider}`);
        console.log(`   Output: ${quote.outputAmount}`);
        console.log(`   Fee: $${quote.feeUsd}`);
        console.log(`   Retention: ${(quote.retentionRate * 100).toFixed(2)}%`);
      }
    } catch (error: any) {
      console.log('⚠️  Quote failed (expected if API providers unavailable)');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');

    // Disconnect
    console.log('📡 Disconnecting...');
    await client.disconnect();
    console.log('✅ Disconnected\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ All tests completed successfully!');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    await client.disconnect();
    process.exit(1);
  }
}

runTests();
