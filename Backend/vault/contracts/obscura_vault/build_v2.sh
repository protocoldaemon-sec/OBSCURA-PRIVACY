#!/bin/bash
# Build with Solana 2.1.0

export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
source $HOME/.cargo/env

echo "=== Solana Version ==="
solana --version

echo ""
echo "=== Building obscura_vault ==="
cd ~/obscura_build
rm -rf target Cargo.lock

cargo-build-sbf --manifest-path Cargo.toml 2>&1

echo ""
echo "=== Check Results ==="
ls -la target/deploy/ 2>/dev/null || echo "No deploy folder"
