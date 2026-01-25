#!/bin/bash
source $HOME/.cargo/env
export PATH="$HOME/solana-release/bin:$HOME/.cargo/bin:$PATH"

echo "=== Setting up Rust 1.79 for Cargo.lock compatibility ==="
rustup default 1.79.0
rustc --version
cargo --version

echo ""
echo "=== Preparing build ==="
cd ~/obscura_build
rm -rf target Cargo.lock

# Generate Cargo.lock with Rust 1.79 (v3 format)
echo "Generating Cargo.lock..."
cargo generate-lockfile 2>&1

echo ""
echo "=== Building with cargo-build-sbf ==="
cargo-build-sbf 2>&1

echo ""
echo "=== Results ==="
ls -la target/ 2>/dev/null || echo "No target"
ls -la target/deploy/ 2>/dev/null || echo "No deploy"
find . -name "*.so" 2>/dev/null || echo "No .so files"
