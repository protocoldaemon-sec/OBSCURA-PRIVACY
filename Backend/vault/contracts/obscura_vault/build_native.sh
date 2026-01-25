#!/bin/bash
set -x
export PATH="$HOME/solana-release/bin:$HOME/.cargo/bin:$PATH"

echo "=== Environment ==="
solana --version
cargo --version
rustc --version

echo "=== Building in native Linux path ==="
cd ~/obscura_build
rm -rf target

echo "=== Running cargo-build-sbf ==="
cargo-build-sbf --manifest-path Cargo.toml 2>&1

echo "=== Checking results ==="
ls -la target/ 2>/dev/null || echo "No target"
ls -la target/deploy/ 2>/dev/null || echo "No deploy"
find . -name "*.so" 2>/dev/null || echo "No .so files"
