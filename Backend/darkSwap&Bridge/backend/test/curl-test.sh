#!/bin/bash

# Obscura Swap API Test Script using cURL
# Usage: bash test/curl-test.sh

BASE_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Obscura Swap API Test Suite (cURL)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}   Base URL: $BASE_URL${NC}\n"

# Test counter
PASSED=0
FAILED=0
TOTAL=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=$4
    
    echo -e "\n${BLUE}🧪 Testing: $name${NC}"
    echo -e "${YELLOW}   URL: $url${NC}"
    
    TOTAL=$((TOTAL + 1))
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}   ✅ Success ($http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}   ❌ Failed ($http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        FAILED=$((FAILED + 1))
    fi
}

# Test 1: Health Check
test_endpoint "Health Check" "$BASE_URL/health"

# Test 2: Get Supported Assets
test_endpoint "Get Supported Assets" "$BASE_URL/api/swap/assets"

# Test 3: Get Quote (Ethereum → Avalanche)
test_endpoint "Get Quote (ETH → AVAX USDC)" \
    "$BASE_URL/api/swap/quote?fromChainId=1&toChainId=43114&fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toToken=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E&amount=1000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

# Test 4: Get Quote (Polygon → Arbitrum)
test_endpoint "Get Quote (Polygon → Arbitrum USDC)" \
    "$BASE_URL/api/swap/quote?fromChainId=137&toChainId=42161&fromToken=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&toToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831&amount=5000000&userAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

# Test 5: Invalid Quote (Should Fail)
test_endpoint "Invalid Quote (Missing Parameters)" \
    "$BASE_URL/api/swap/quote?fromChainId=1"

# Test 6: Webhook
test_endpoint "Webhook Status Update" \
    "$BASE_URL/api/webhooks/swap-status" \
    "POST" \
    '{"swapId":"test-swap-123","status":"pending","txHash":"0x1234567890abcdef"}'

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}   Total Tests: $TOTAL${NC}"
echo -e "${GREEN}   ✅ Passed: $PASSED${NC}"
echo -e "${RED}   ❌ Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}   Success Rate: 100%${NC}"
else
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")
    echo -e "${YELLOW}   Success Rate: $SUCCESS_RATE%${NC}"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Exit with appropriate code
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
