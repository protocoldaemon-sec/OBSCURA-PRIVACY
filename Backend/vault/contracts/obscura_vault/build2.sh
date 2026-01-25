#!/bin/bash
source $HOME/.cargo/env
export PATH="$HOME/solana-release/bin:$PATH"

echo "=== Versions ==="
rustc --version
cargo --version
solana --version

echo ""
echo "=== Building ==="
cd ~/obscura_build
rm -rf target Cargo.lock

cargo-build-sbf --manifest-path Cargo.toml 2>&1

echo ""
echo "=== Results ==="
ls -la target/ 2>/dev/null || echo "No target"
ls -la target/deploy/ 2>/dev/null || echo "No deploy"
find . -name "*.so" 2>/dev/null
