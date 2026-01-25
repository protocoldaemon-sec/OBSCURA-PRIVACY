# Obscura Glossary

Comprehensive terminology reference for the Obscura protocol and related cryptographic concepts.

---

## Table of Contents

- [Core Concepts](#core-concepts)
- [Cryptographic Primitives](#cryptographic-primitives)
- [Post-Quantum Cryptography](#post-quantum-cryptography)
- [Privacy Technologies](#privacy-technologies)
- [Blockchain & Settlement](#blockchain--settlement)
- [Solana Integrations](#solana-integrations)
- [Protocol Components](#protocol-components)
- [Security Terms](#security-terms)

---

## Core Concepts

### Intent
A user's declared desire to perform a transaction (swap, transfer, bridge) without specifying the exact execution path. Intents are declarative rather than imperative.

### Shielded Intent
An intent encrypted using the SIP protocol, hiding sender, recipient, and amount details from public view while still being executable by authorized parties.

### Settlement
The final on-chain execution of an intent, transferring assets according to the committed parameters. Settlement is the only on-chain operation in Obscura.

### Commitment
A cryptographic binding to a value without revealing it. In Obscura, commitments bind to intent parameters (amount, recipient, etc.) and are verified on-chain.

### Executor
An authorized off-chain service that validates intents, batches them, and submits settlement transactions to the blockchain. Executors cannot steal funds but can censor.

### Solver
A third-party service that provides quotes for intent execution (e.g., best swap rate). Solvers compete in auctions to fill user intents.

---

## Cryptographic Primitives

### Hash Function
A one-way function that maps arbitrary data to a fixed-size output. Obscura uses SHA-256 for all hashing operations.

### SHA-256
Secure Hash Algorithm producing 256-bit (32-byte) digests. Used throughout Obscura for commitments, Merkle trees, and WOTS+ chains.

### Merkle Tree
A binary tree where each leaf is a hash of data, and each non-leaf node is a hash of its children. Enables efficient membership proofs.

### Merkle Root
The single hash at the top of a Merkle tree, representing a commitment to all leaves. Stored on-chain for verification.

### Merkle Proof
A sequence of sibling hashes proving that a specific leaf belongs to a tree with a given root. Verification is O(log n).

### Domain Separation
Prefixing hash inputs with unique identifiers to prevent cross-protocol attacks. Example: `SHA256("WOTS-CHAIN" || data)`.

---

## Post-Quantum Cryptography

### Post-Quantum (PQ)
Cryptographic algorithms believed to be secure against attacks by quantum computers. Classical algorithms like ECDSA are vulnerable to Shor's algorithm.

### Quantum Computer
A computing device using quantum mechanical phenomena (superposition, entanglement) to perform calculations. Threatens current public-key cryptography.

### Shor's Algorithm
A quantum algorithm that can factor large integers and compute discrete logarithms in polynomial time, breaking RSA and ECDSA.

### Grover's Algorithm
A quantum algorithm providing quadratic speedup for searching unsorted databases. Reduces symmetric key security by half (256-bit → 128-bit effective).

### WOTS (Winternitz One-Time Signature)
A hash-based signature scheme where security relies only on hash function properties. Quantum-resistant but each key can only sign once.

### WOTS+
An improved version of WOTS with smaller signatures through the use of a bitmask and chaining parameter. Used in Obscura.

### Winternitz Parameter (w)
Controls the trade-off between signature size and computation. Higher w = smaller signatures but more hash operations. Obscura uses w=16.

### One-Time Signature (OTS)
A signature scheme where each private key must only be used once. Reusing a WOTS key leaks private key material.

### Key Pool
A pre-generated set of WOTS key pairs managed by the user. Each key is used exactly once, then marked as spent.

### Hash Chain
A sequence of hash values where each is the hash of the previous. Used in WOTS to encode message digits.

### Checksum (WOTS)
Additional signature elements that prevent existential forgery by encoding the sum of message digits.

---

## Privacy Technologies

### SIP (Shielded Intent Protocol)
A privacy layer for blockchain intents providing stealth addressing, amount hiding, and selective disclosure.

### Stealth Address
A one-time address generated for each transaction, unlinkable to the recipient's public address. Based on EIP-5564.

### EIP-5564
Ethereum Improvement Proposal for stealth addresses using elliptic curve Diffie-Hellman (ECDH) key exchange.

### Pedersen Commitment
A cryptographic commitment scheme that is both hiding (reveals nothing about the value) and binding (cannot change the value later). Used for amount hiding.

### Viewing Key
A key that allows decryption of transaction details without spending authority. Enables compliance and auditing.

### Privacy Level
The degree of information hiding in a transaction:
- **TRANSPARENT**: All details visible
- **SHIELDED**: Sender, recipient, amount hidden
- **COMPLIANT**: Encrypted with viewing keys for regulators

### Zero-Knowledge Proof (ZKP)
A cryptographic proof that demonstrates knowledge of information without revealing the information itself.

### ZK Compression
Light Protocol's technology for compressing on-chain state using zero-knowledge proofs, reducing storage costs ~1000x.

---

## Blockchain & Settlement

### EVM (Ethereum Virtual Machine)
The runtime environment for smart contracts on Ethereum and compatible chains (Polygon, Arbitrum, etc.).

### Solidity
The primary programming language for EVM smart contracts. Obscura contracts use Solidity 0.8.24.

### Foundry
A fast, portable toolkit for Ethereum development including forge (testing), cast (CLI), and anvil (local node).

### Anchor
A framework for Solana program development using Rust, providing safety checks and simplified account handling.

### PDA (Program Derived Address)
A Solana address derived deterministically from a program ID and seeds, controlled by the program rather than a private key.

### Settlement Contract
The on-chain component that verifies commitment proofs and executes asset transfers. Minimal logic, maximum security.

### Vault Contract
Holds escrowed assets during the settlement process. Releases funds only upon valid proof submission.

### Batch Settlement
Aggregating multiple intents into a single on-chain transaction, amortizing gas costs across participants.

### Replay Protection
Mechanism preventing the same proof from being used twice. Obscura tracks used commitments on-chain.

### Gas
The unit of computational effort on EVM chains. Obscura minimizes on-chain operations to reduce gas costs.

### Lamports
The smallest unit of SOL on Solana (1 SOL = 1 billion lamports). Used for transaction fees and rent.

---

## Solana Integrations

### Helius
Enhanced Solana RPC provider offering priority fees, webhooks, and smart transaction APIs.

### Priority Fee
Additional fee paid to validators for faster transaction inclusion. Helius provides real-time fee estimates.

### Orb
Helius block explorer for Solana, providing transaction analysis and debugging tools. Available at orb.helius.dev.

### Jupiter
Leading Solana DEX aggregator that finds optimal swap routes across multiple liquidity sources.

### DFlow
Meta-aggregator for Solana that routes orders to achieve best execution across Jupiter and other venues.

### Light Protocol
Infrastructure for ZK Compression on Solana, enabling ~1000x cheaper state storage.

### Photon
Light Protocol's indexer for querying compressed state and Merkle proofs.

### Compressed PDA
A program-derived address stored in compressed form using Light Protocol, drastically reducing rent costs.

### Arcium
Confidential computing platform for Solana using Multi-Party Computation (MPC).

### cSPL (Confidential SPL)
SPL tokens with encrypted balances, enabling private token transfers on Solana.

### MXE (Multi-Party Execution Environment)
Arcium's distributed computing cluster for confidential operations.

### MPC (Multi-Party Computation)
Cryptographic technique where multiple parties jointly compute a function without revealing their inputs.

### Cluster Offset
Arcium configuration parameter identifying which MXE cluster to use. Devnet v0.5.1 supports offsets 123, 456, and 789.

### Sealing
Arcium operation that re-encrypts data for a specific recipient's public key, enabling selective disclosure.

### Re-encryption
Process of transforming ciphertext encrypted for one key into ciphertext encrypted for another key, without decrypting.

---

## Protocol Components

### SIPClient
The main client class for interacting with the Obscura protocol, handling intent creation and submission.

### AuthService
Off-chain service that verifies WOTS+ signatures and manages key pool registrations.

### Aggregator
Component that collects validated intents and constructs Merkle trees for batch settlement.

### KeyManager
Manages the user's WOTS key pool, tracking used keys and generating new ones.

### WOTSScheme
Core class implementing the WOTS+ signature algorithm with configurable parameters.

### MerkleTree
Class for constructing Merkle trees from intent commitments and generating proofs.

---

## Security Terms

### Cryptographic Assumption
The underlying mathematical problem assumed to be hard (e.g., hash preimage resistance for WOTS+).

### Preimage Resistance
Property of hash functions: given H(x), it's computationally infeasible to find x.

### Second Preimage Resistance
Property of hash functions: given x, it's computationally infeasible to find y ≠ x where H(x) = H(y).

### Collision Resistance
Property of hash functions: it's computationally infeasible to find any x, y where H(x) = H(y).

### Existential Forgery
Creating a valid signature for any message without the private key. WOTS checksum prevents this.

### Reentrancy Attack
Exploiting recursive calls to drain funds. Obscura uses Checks-Effects-Interactions (CEI) pattern.

### Front-Running
Observing pending transactions and submitting competing transactions with higher fees. Commitment schemes mitigate this.

### CEI Pattern (Checks-Effects-Interactions)
Smart contract design pattern: validate inputs, update state, then make external calls. Prevents reentrancy.

### Two-Step Transfer
Ownership transfer requiring explicit acceptance by the new owner. Prevents accidental transfers to wrong addresses.

### Slippage
The difference between expected and actual execution price. Users specify maximum acceptable slippage (in basis points).

### Basis Points (bps)
One hundredth of a percent (1 bps = 0.01%). Used for expressing fees and slippage tolerances.

---

## Acronyms

| Acronym | Full Form |
|---------|-----------|
| WOTS | Winternitz One-Time Signature |
| SIP | Shielded Intent Protocol |
| PQ | Post-Quantum |
| ZK | Zero-Knowledge |
| EVM | Ethereum Virtual Machine |
| PDA | Program Derived Address |
| MPC | Multi-Party Computation |
| MXE | Multi-Party Execution Environment |
| cSPL | Confidential SPL (Solana Program Library) |
| CEI | Checks-Effects-Interactions |
| OTS | One-Time Signature |
| ECDH | Elliptic Curve Diffie-Hellman |
| RPC | Remote Procedure Call |
| DEX | Decentralized Exchange |
| AMM | Automated Market Maker |

---

## References

- [WOTS+ Specification (RFC 8391)](https://datatracker.ietf.org/doc/html/rfc8391)
- [EIP-5564: Stealth Addresses](https://eips.ethereum.org/EIPS/eip-5564)
- [Light Protocol Documentation](https://docs.lightprotocol.com)
- [Arcium Documentation](https://docs.arcium.com)
- [Helius Documentation](https://docs.helius.dev)
- [Jupiter Documentation](https://station.jup.ag/docs)
- [Orb Explorer](https://orb.helius.dev)
