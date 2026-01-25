#!/bin/bash
source $HOME/.cargo/env
export PATH="$HOME/solana-release/bin:$HOME/.cargo/bin:$PATH"

echo "=== Environment ==="
which cargo-build-sbf
which rustc
which cargo
rustc --version
cargo --version
solana --version

echo ""
echo "=== Building ==="
cd ~/obscura_build
rm -rf target Cargo.lock

echo "Running cargo-build-sbf..."
cargo-build-sbf --verbose 2>&1

echo ""
echo "=== Results ==="
ls -la target/ 2>/dev/null || echo "No target"
ls -la target/deploy/ 2>/dev/null || echo "No deploy"
find . -name "*.so" 2>/dev/null || echo "No .so files"
