#!/bin/bash
set -e

# Setup paths
export PATH="$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "=== Environment Check ==="
which cargo
which rustc  
which cargo-build-sbf
cargo --version
rustc --version
cargo-build-sbf --version

echo ""
echo "=== Building obscura_vault ==="
cd ~/obscura_build

# Clean previous build
rm -rf target Cargo.lock

# Build with cargo-build-sbf
cargo-build-sbf --manifest-path Cargo.toml

echo ""
echo "=== Build Results ==="
ls -la target/deploy/ 2>/dev/null || echo "No deploy folder"
