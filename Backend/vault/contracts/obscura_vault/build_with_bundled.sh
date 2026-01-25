#!/bin/bash
exec > ~/build_output.log 2>&1

# Source cargo env for rustup
source $HOME/.cargo/env

# Use bundled Rust from Solana SDK for compilation
export PATH="$HOME/solana-release/bin/sdk/sbf/dependencies/platform-tools/rust/bin:$HOME/solana-release/bin:$PATH"

echo "=== Starting build with bundled Rust ==="
date
echo "Rust: $(rustc --version)"
echo "Cargo: $(cargo --version)"
echo "Solana: $(solana --version)"
echo "Rustup: $(which rustup)"

cd ~/obscura_build
rm -f Cargo.lock
rm -rf target

echo ""
echo "=== Running cargo-build-sbf ==="
cargo-build-sbf --verbose

echo ""
echo "=== Build complete ==="
date
ls -la target/deploy/ 2>/dev/null || echo "No deploy folder"
find . -name "*.so" 2>/dev/null
