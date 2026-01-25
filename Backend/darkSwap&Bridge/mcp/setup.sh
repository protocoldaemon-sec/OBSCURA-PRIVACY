#!/bin/bash

echo "🚀 Setting up Obscura Swap MCP Server & Client"
echo "═══════════════════════════════════════════════════════"

# Setup Server
echo ""
echo "📦 Setting up MCP Server..."
cd server
pnpm install
cp .env.example .env
pnpm build
echo "✅ Server setup complete"

# Setup Client
echo ""
echo "📦 Setting up MCP Client..."
cd ../client
pnpm install
cp .env.example .env
pnpm build
echo "✅ Client setup complete"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ MCP Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Start backend: cd ../../backend && pnpm dev"
echo "2. Test MCP: cd mcp/client && pnpm test"
echo ""
echo "For integration with AI assistants, see mcp/README.md"
echo "═══════════════════════════════════════════════════════"
