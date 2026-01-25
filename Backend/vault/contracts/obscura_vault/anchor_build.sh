#!/bin/bash
source $HOME/.cargo/env
export PATH="$HOME/solana-release/bin:$HOME/.cargo/bin:$PATH"

echo "=== Environment ===" | tee ~/anchor_build.log
rustc --version | tee -a ~/anchor_build.log
cargo --version | tee -a ~/anchor_build.log
solana --version | tee -a ~/anchor_build.log
anchor --version | tee -a ~/anchor_build.log

echo "" | tee -a ~/anchor_build.log
echo "=== Building ===" | tee -a ~/anchor_build.log
cd ~/obscura_build
rm -rf target Cargo.lock

# Run anchor build with full output
anchor build 2>&1 | tee -a ~/anchor_build.log

echo "" | tee -a ~/anchor_build.log
echo "=== Results ===" | tee -a ~/anchor_build.log
ls -la target/ 2>&1 | tee -a ~/anchor_build.log
ls -la target/deploy/ 2>&1 | tee -a ~/anchor_build.log
find . -name "*.so" 2>&1 | tee -a ~/anchor_build.log
