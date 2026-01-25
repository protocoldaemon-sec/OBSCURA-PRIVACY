#!/bin/bash
# Install Solana 2.1.0 which has platform-tools with Rust 1.79+

echo "=== Installing Solana 2.1.0 ==="
curl -sSfL https://release.anza.xyz/v2.1.0/install | sh

echo ""
echo "=== Verify installation ==="
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version

echo ""
echo "=== Check platform-tools Rust version ==="
# After first build, platform-tools will be downloaded
