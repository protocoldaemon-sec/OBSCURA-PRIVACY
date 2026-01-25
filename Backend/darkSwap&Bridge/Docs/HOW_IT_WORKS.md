# How Obscura Swap Works

Understanding the privacy-preserving architecture behind Obscura Swap (powered by SilentSwap V2).

## Overview

Obscura Swap provides two main services:

1. **Simple Bridge** - Fast cross-chain token transfers using top-tier bridge providers
2. **Silent Swap** - Private cross-chain swaps where the sender-recipient link is hidden on-chain

## Simple Bridge

### How It Works

Simple Bridge is a straightforward cross-chain transfer service that:

1. **Compares Providers**: Automatically fetches quotes from multiple bridge providers (Relay.link and deBridge)
2. **Selects Best Rate**: Chooses the provider with the highest retention rate (best value after fees)
3. **Executes Transfer**: Handles chain switching and transaction execution
4. **Monitors Status**: Tracks the bridge transaction until completion

### Use Cases

- Moving assets between chains quickly
- Bridging tokens for DeFi operations
- Portfolio rebalancing across chains
- No privacy requirements needed

### Example Flow

```
User (Ethereum) → Bridge Provider → User (Avalanche)
     1 USDC                              0.998 USDC
```

The connection is visible on-chain - anyone can see the sender and recipient addresses.

## Silent Swap (Private Swaps)

### The Privacy Problem

Traditional cross-chain swaps leave a clear trail:
- Source address is visible
- Destination address is visible
- Amount is visible
- The link between sender and recipient is public

This creates privacy concerns for users who don't want their financial activity tracked.

### How Silent Swap Solves This

Silent Swap uses a sophisticated privacy-preserving architecture:

#### 1. Deterministic Wallet Generation

When you initiate a swap, the SDK:
- Has you sign a set of offline messages with your private key
- Deterministically generates a unique mnemonic seed phrase for THIS swap only
- Creates a group of single-use accounts called **facilitators**

```
Your Signature → Entropy → Unique Seed Phrase → Facilitator Accounts
```

Each swap gets a completely new set of facilitator accounts that have never been used before.

#### 2. Facilitator Accounts

Facilitators are temporary accounts that:
- Are generated fresh for each swap
- Have their private keys encrypted
- Operate inside a Trusted Execution Environment (TEE)
- Sign transactions that you explicitly approve
- Are never reused

```
Facilitator Group:
├── Viewer Account (observes order execution)
├── Facilitator 0 (handles ingress)
├── Facilitator 1 (handles egress on chain A)
├── Facilitator 2 (handles egress on chain B)
└── ... (more facilitators for multi-output swaps)
```

#### 3. Smart Contract Account (SCA) in TEE

The facilitators are controlled by:
- An open-source Smart Contract Account (SCA)
- Running inside an auditable Trusted Execution Environment (TEE)
- The TEE ensures the SCA can only execute transactions you've approved
- The SCA cannot access your main wallet or funds

#### 4. Privacy Guarantees

The on-chain trail looks like this:

```
Your Address → Gateway Contract → Facilitator 0 → Bridge → Facilitator 1 → Recipient
```

**What's visible on-chain:**
- Your address deposited to Gateway Contract ✓
- Facilitator accounts moved funds ✓
- Recipient received funds ✓

**What's NOT visible on-chain:**
- The link between your address and the recipient ✗
- That these transactions are part of the same swap ✗
- The facilitator accounts are single-use and can't be traced back to you ✗

### Complete Silent Swap Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. AUTHENTICATION                                               │
│    User signs SIWE message → Gets auth token                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. ENTROPY DERIVATION                                           │
│    User signs EIP-712 message → Derives entropy                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. FACILITATOR GROUP CREATION                                   │
│    Entropy + Deposit Count → HD Wallet → Facilitator Accounts   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. QUOTE REQUEST                                                │
│    User requests quote with facilitator public keys             │
│    Backend calculates optimal route and fees                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. ORDER SIGNING                                                │
│    User signs:                                                  │
│    - Authorization messages (EIP-3009 for deposits)             │
│    - Order intent (EIP-712)                                     │
│    - Proxy authorizations (for facilitators)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. ORDER PLACEMENT                                              │
│    Submit signed order to SilentSwap backend                    │
│    Backend validates and prepares execution                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. DEPOSIT EXECUTION                                            │
│    User deposits funds to Gateway Contract on Avalanche         │
│    Gateway Contract holds funds temporarily                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. FACILITATOR EXECUTION (Inside TEE)                           │
│    SCA in TEE:                                                  │
│    - Receives encrypted facilitator keys                        │
│    - Executes approved transactions only                        │
│    - Bridges funds if needed                                    │
│    - Sends to recipient(s)                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. COMPLETION                                                   │
│    Recipient receives funds                                     │
│    Facilitator accounts are discarded (never reused)            │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Gateway Contract

- Entry point for deposits on Avalanche
- Holds funds temporarily during swap execution
- Tracks deposit counts for nonce generation
- Emits events for monitoring

### 2. Trusted Execution Environment (TEE)

- Secure, isolated computing environment
- Runs the Smart Contract Account (SCA)
- Ensures code execution is auditable
- Protects facilitator private keys
- Cannot be tampered with

### 3. Smart Contract Account (SCA)

- Open-source code running in TEE
- Controls facilitator accounts
- Only executes transactions you've approved
- Cannot access your main wallet
- Auditable and verifiable

### 4. Facilitator Accounts

- Single-use accounts generated per swap
- Private keys encrypted for TEE
- Sign transactions on your behalf
- Break the on-chain link between sender and recipient
- Discarded after use

## What You Need

### Basic Requirements

✅ **EOA Wallet**: Any wallet that supports EIP-1193 (MetaMask, Phantom, WalletConnect, etc.)
✅ **Transaction Signing**: Ability to sign EVM transactions and messages
✅ **No Special Setup**: Works with your existing wallet connection

### Recommended (for Production)

✅ **Backend Service**: Small backend or serverless environment for:
  - Storing configuration
  - Handling callbacks
  - Monitoring swap status

✅ **Product Integration**: Clear UI for:
  - "Private Swap" or "Private Transfer" options
  - User education about privacy guarantees
  - Status tracking and notifications

## What You DON'T Need

❌ **Custody of User Funds**: You never hold user funds
❌ **Seed Phrase Management**: You never see or store user seed phrases
❌ **Special RPC Endpoints**: Any standard RPC works
❌ **Custom Infrastructure**: No need to build TEE, SCA, or facilitator systems
❌ **App Redesign**: Add privacy as a feature to existing flows

## Security & Trust

### Open Source

- SDK is fully open source
- SCA code is auditable
- TEE execution is verifiable

### Non-Custodial

- You always control your funds
- Facilitators only execute approved transactions
- No third party can access your main wallet

### Decentralized

- TEE infrastructure is decentralized
- No single point of failure
- Multiple validators ensure integrity

### Compliance

- OFAC & AML compliant
- Privacy without breaking regulations
- Transparent to regulators, private to public

## Use Cases

### For Users

- **Private Transfers**: Send funds without revealing the recipient
- **Portfolio Privacy**: Rebalance without exposing holdings
- **Business Payments**: Pay vendors privately
- **DeFi Privacy**: Enter/exit positions without front-running

### For Developers

- **DEX Integration**: Add private swap option to your DEX
- **Wallet Features**: Offer private transfers in your wallet
- **DeFi Protocols**: Enable private liquidity management
- **Payment Apps**: Build privacy-preserving payment flows

## Comparison

| Feature | Simple Bridge | Silent Swap |
|---------|--------------|-------------|
| **Speed** | Fast (minutes) | Moderate (minutes to hours) |
| **Privacy** | Public | Private |
| **Cost** | Low fees | Higher fees (privacy premium) |
| **Complexity** | Simple | More complex |
| **Use Case** | Quick transfers | Private swaps |
| **On-chain Link** | Visible | Hidden |

## Technical Details

### CAIP Standards

Obscura Swap uses Chain Agnostic Improvement Proposals (CAIP) for interoperability:

- **CAIP-10**: Account identifiers (e.g., `caip10:eip155:1:0x...`)
- **CAIP-19**: Asset identifiers (e.g., `eip155:1/erc20:0x...`)

### Supported Chains

- **EVM Chains**: Ethereum, Polygon, Arbitrum, Avalanche, and more
- **Solana**: Full support for SOL and SPL tokens
- **Cross-Chain**: Seamless bridging between all supported chains

### Bridge Providers

- **Relay.link**: Fast, low-fee bridging for popular routes
- **deBridge**: Wide chain support with competitive rates

## Learn More

- **Getting Started**: See [GETTING_STARTED.md](./GETTING_STARTED.md)
- **Core SDK Guide**: See [CORE_SDK_GUIDE.md](./CORE_SDK_GUIDE.md)
- **Integration Guide**: See [INTEGRATION.md](./INTEGRATION.md)
- **Official Docs**: [docs.silentswap.com](https://docs.silentswap.com)

## FAQ

### Is my main wallet at risk?

No. Facilitator accounts are separate, single-use accounts that cannot access your main wallet.

### Can the TEE steal my funds?

No. The TEE can only execute transactions you've explicitly approved by signing messages.

### How is this different from a mixer?

Mixers pool funds from multiple users. Silent Swap uses single-use facilitator accounts unique to your swap, providing privacy without pooling.

### What if the TEE goes down?

The TEE infrastructure is decentralized with multiple validators. If one goes down, others continue operating.

### Can I track my swap?

Yes. You receive a viewer account that can observe the order execution without revealing your identity.

### Is this legal?

Yes. Silent Swap is OFAC & AML compliant and provides privacy within regulatory frameworks.

### What are the fees?

Fees include:
- Service fee (typically 1%)
- Bridge fees (varies by provider)
- Gas fees (standard network fees)

### How long does a swap take?

- Simple Bridge: Minutes
- Silent Swap: Minutes to hours (depending on chain congestion and bridge times)

## Support

For questions or issues:
- Documentation: [docs.silentswap.com](https://docs.silentswap.com)
- GitHub: [SilentSwap SDK](https://github.com/Auronox/silentswap-v2-sdk)
