/**
 * API Test Script for Obscura Swap
 * 
 * Test all API endpoints without needing private keys
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url, options = {}) {
  try {
    log(`\n🧪 Testing: ${name}`, 'blue');
    log(`   URL: ${url}`, 'yellow');
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      log(`   ✅ Success (${response.status})`, 'green');
      console.log('   Response:', JSON.stringify(data, null, 2).split('\n').map(line => '   ' + line).join('\n'));
      return { success: true, data };
    } else {
      log(`   ❌ Failed (${response.status})`, 'red');
      console.log('   Error:', JSON.stringify(data, null, 2).split('\n').map(line => '   ' + line).join('\n'));
      return { success: false, error: data };
    }
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('═══════════════════════════════════════════════════════', 'blue');
  log('   Obscura Swap API Test Suite', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');
  log(`   Base URL: ${API_BASE_URL}\n`, 'yellow');

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  // Test 1: Health Check
  const health = await testEndpoint(
    'Health Check',
    `${API_BASE_URL}/health`
  );
  results.total++;
  if (health.success) results.passed++;
  else results.failed++;

  // Test 2: Get Supported Assets
  const assets = await testEndpoint(
    'Get Supported Assets',
    `${API_BASE_URL}/api/swap/assets`
  );
  results.total++;
  if (assets.success) results.passed++;
  else results.failed++;

  // Test 3: Get Quote (Ethereum → Avalanche)
  const quote1 = await testEndpoint(
    'Get Quote (ETH → AVAX USDC)',
    `${API_BASE_URL}/api/swap/quote?` + new URLSearchParams({
      fromChainId: '1',
      toChainId: '43114',
      fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
      toToken: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC on Avalanche
      amount: '1000000', // 1 USDC
      userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Example address
    })
  );
  results.total++;
  if (quote1.success) results.passed++;
  else results.failed++;

  // Test 4: Get Quote (Polygon → Arbitrum)
  const quote2 = await testEndpoint(
    'Get Quote (Polygon → Arbitrum USDC)',
    `${API_BASE_URL}/api/swap/quote?` + new URLSearchParams({
      fromChainId: '137',
      toChainId: '42161',
      fromToken: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
      toToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
      amount: '5000000', // 5 USDC
      userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    })
  );
  results.total++;
  if (quote2.success) results.passed++;
  else results.failed++;

  // Test 5: Invalid Quote (Missing Parameters)
  const invalidQuote = await testEndpoint(
    'Invalid Quote (Missing Parameters)',
    `${API_BASE_URL}/api/swap/quote?fromChainId=1`
  );
  results.total++;
  // This should fail, so we count it as passed if it fails
  if (!invalidQuote.success) results.passed++;
  else results.failed++;

  // Test 6: Webhook Endpoint (POST)
  const webhook = await testEndpoint(
    'Webhook Status Update',
    `${API_BASE_URL}/api/webhooks/swap-status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        swapId: 'test-swap-123',
        status: 'pending',
        txHash: '0x1234567890abcdef',
      }),
    }
  );
  results.total++;
  if (webhook.success) results.passed++;
  else results.failed++;

  // Summary
  log('\n═══════════════════════════════════════════════════════', 'blue');
  log('   Test Summary', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');
  log(`   Total Tests: ${results.total}`, 'yellow');
  log(`   ✅ Passed: ${results.passed}`, 'green');
  log(`   ❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`   Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
    results.failed === 0 ? 'green' : 'yellow');
  log('═══════════════════════════════════════════════════════\n', 'blue');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
