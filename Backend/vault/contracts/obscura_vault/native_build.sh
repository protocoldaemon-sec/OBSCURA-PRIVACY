#!/bin/bash
set -e
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
source "$HOME/.cargo/env"

# Use system Rust 1.92 which supports edition2024
rustup default stable

echo "=== Environment ==="
rustc --version
cargo --version

cd "$HOME/obscura_build"
rm -rf target Cargo.lock

echo ""
echo "=== Building for SBF target ==="
# Install sbf target if not present
rustup target add sbpf-solana-solana 2>/dev/null || true

# Build with cargo directly
cargo build --release --target sbpf-solana-solana 2>&1 || {
    echo "SBF target not available, trying bpfel-unknown-unknown..."
    rustup target add bpfel-unknown-unknown 2>/dev/null || true
    cargo build --release --target bpfel-unknown-unknown 2>&1
}

echo ""
echo "=== Results ==="
find target -name "*.so" 2>/dev/null || echo "No .so files"
ls -la target/*/release/*.so 2>/dev/null || echo "No release .so"
