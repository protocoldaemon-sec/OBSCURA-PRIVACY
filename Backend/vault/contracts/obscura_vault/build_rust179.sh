#!/bin/bash
exec > ~/build_output.log 2>&1

source $HOME/.cargo/env
export PATH="$HOME/solana-release/bin:$PATH"

echo "=== Starting build with Rust 1.79 ==="
date
echo "Rust: $(rustc --version)"
echo "Cargo: $(cargo --version)"
echo "Solana: $(solana --version)"

cd ~/obscura_build
rm -f Cargo.lock
rm -rf target

echo ""
echo "=== Running cargo-build-sbf ==="
cargo-build-sbf 2>&1

echo ""
echo "=== Build complete ==="
date
ls -la target/deploy/ 2>/dev/null || echo "No deploy folder"
find . -name "*.so" 2>/dev/null
