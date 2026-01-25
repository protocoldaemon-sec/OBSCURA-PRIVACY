#!/bin/bash
set -e

# Reset PATH to sane defaults first
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# Add cargo and solana
source "$HOME/.cargo/env"
export PATH="$HOME/solana-release/bin:$PATH"

echo "=== Environment ==="
echo "PATH: $PATH"
echo "rustc: $(rustc --version)"
echo "cargo: $(cargo --version)"
echo "solana: $(solana --version)"
echo "cargo-build-sbf: $(which cargo-build-sbf)"

echo ""
echo "=== Preparing ==="
cd "$HOME/obscura_build"
rm -rf target Cargo.lock
cat Cargo.toml

echo ""
echo "=== Building ==="
cargo-build-sbf 2>&1

echo ""
echo "=== Results ==="
ls -la target/deploy/ 2>&1 || echo "No deploy folder"
find . -name "*.so" 2>&1
