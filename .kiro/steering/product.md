---
inclusion: always
---

# Obscura Privacy Platform

Obscura is a privacy-focused DeFi platform built on Solana and Ethereum that provides multiple privacy-preserving financial services:

## Core Products

**Dark OTC (RFQ System)**: Privacy-preserving Request for Quote system for bilateral trading between market makers and takers. Uses WOTS+ post-quantum signatures, stealth addresses, Arcium MPC for encrypted balance tracking, and Light Protocol for ZK compression.

**Dark Pool**: Encrypted order matching system using Arcium's Multi-Party Computation (MPC). Orders remain encrypted until matched, providing MEV protection and zero-knowledge privacy for traders.

**Dark Swap & Bridge**: Cross-chain bridging and private swap functionality using SilentSwap SDK. Supports multiple bridge providers (Relay, deBridge) and silent swaps across EVM and Solana chains.

**Compliance Backend**: Address screening and compliance checks using Range API for regulatory compliance.

## Privacy Infrastructure

- **Blockchain**: Solana Devnet, Ethereum Sepolia Testnet
- **Off-Chain Balance**: Arcium SDK (MPC-based encrypted computation)
- **ZK Compression**: Light Protocol (1000x cheaper Solana storage)
- **Signatures**: WOTS+ post-quantum one-time signatures
- **Relayer Network**: Obscura-LLMS for private transaction submission

## Frontend Applications

- **Web App**: Next.js application with Solana integration
- **Mobile App**: React Native Expo app with Mobile Wallet Adapter support
