#!/bin/bash
export PATH="$HOME/solana-release/bin:$HOME/.cargo/bin:$PATH"
cd /mnt/d/script/express/obscura-vault/contracts/obscura_vault
echo "Solana version: $(solana --version)"
echo "Anchor version: $(anchor --version)"
echo ""
echo "Building with anchor..."
anchor build 2>&1
echo ""
echo "Checking for .so files..."
find . -name "*.so" 2>/dev/null
ls -la target/deploy/ 2>/dev/null || echo "No deploy folder"
