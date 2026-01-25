# Obscura Swap Core SDK Guide

Complete guide for using the SilentSwap Core SDK in Node.js backend environments.

## Table of Contents

1. [Simple Bridge](#simple-bridge)
2. [Silent Swap](#silent-swap)
3. [Key Concepts](#key-concepts)
4. [API Reference](#api-reference)

## Simple Bridge

Simple Bridge enables cross-chain token transfers using top-tier bridge providers (Relay.link and deBridge).

### Basic Bridge Flow

```javascript
import { 
  getBridgeQuote,
  convertQuoteResultToQuote,
  executeBridgeTransaction,
  getBridgeStatus 
} from '@silentswap/sdk';

// 1. Get quote (compares providers and selects best)
const quoteResult = await getBridgeQuote(
  1, // Source chain ID (Ethereum)
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Source token (USDC)
  '1000000', // Amount in token units (1 USDC = 1e6)
  43114, // Destination chain ID (Avalanche)
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Destination token (USDC.e)
  userAddress
);

// 2. Convert to executable quote
const quote = convertQuoteResultToQuote(quoteResult, 1);

// 3. Execute transaction
const status = await executeBridgeTransaction(
  quote,
  walletClient,
  connector,
  (step) => console.log(step)
);

// 4. Monitor status
const finalStatus = await getBridgeStatus(status.requestId, quoteResult.provider);
```

### Quote Result Properties

```javascript
{
  provider: 'relay' | 'debridge',
  outputAmount: string,        // Output amount in destination token units
  inputAmount: string,         // Input amount required
  feeUsd: number,             // Total fee in USD
  slippage: number,           // Price slippage percentage
  estimatedTime: number,      // Estimated time in seconds
  retentionRate: number,      // Value retention (0-1)
  txCount: number,            // Number of transactions required
  rawResponse: any            // Raw provider response
}
```

### Optimal USDC Solving

For cross-chain swaps that need to bridge to USDC first:

```javascript
import { solveOptimalUsdcAmount } from '@silentswap/sdk';

const result = await solveOptimalUsdcAmount(
  1, // Source chain ID
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Source token
  '1000000', // Source amount
  userAddress,
  depositCalldata, // Optional: for post-bridge execution
  3.0 // Optional: max price impact percentage
);

console.log('USDC Amount Out:', result.usdcAmountOut.toString());
console.log('Provider:', result.provider);
console.log('Allowance Target:', result.allowanceTarget);
```

## Silent Swap

Silent Swap provides private, cross-chain swaps where the connection between sender and recipient is hidden on-chain.

### Complete Silent Swap Flow

```javascript
import {
  createSilentSwapClient,
  createViemSigner,
  createSignInMessage,
  createEip712DocForWalletGeneration,
  createHdFacilitatorGroupFromEntropy,
  quoteResponseToEip712Document,
  caip19FungibleEvmToken,
  queryDepositCount,
  parseTransactionRequestForViem,
  hexToBytes,
  DeliveryMethod,
  FacilitatorKeyType,
  PublicKeyArgGroups,
  ENVIRONMENT,
} from '@silentswap/sdk';
import BigNumber from 'bignumber.js';

// 1. Create client
const client = createSilentSwapClient({
  environment: ENVIRONMENT.STAGING,
});

// 2. Create signer
const signer = createViemSigner(account, walletClient);

// 3. Authenticate and derive entropy
const entropy = await authenticateAndDeriveEntropy(client, signer);

// 4. Create facilitator group
const depositCount = await queryDepositCount(userAddress);
const group = await createHdFacilitatorGroupFromEntropy(
  hexToBytes(entropy),
  depositCount
);

// 5. Get quote
const viewer = await group.viewer();
const { publicKeyBytes: pk65_viewer } = viewer.exportPublicKey(
  '*',
  FacilitatorKeyType.SECP256K1
);

const groupPublicKeys = await group.exportPublicKeys(1, [
  ...PublicKeyArgGroups.GENERIC,
]);

const [quoteError, quoteResponse] = await client.quote({
  signer: userAddress,
  viewer: pk65_viewer,
  outputs: [{
    method: DeliveryMethod.SNIP,
    recipient: recipientAddress,
    asset: caip19FungibleEvmToken(1, tokenAddress),
    value: BigNumber(amount).shiftedBy(decimals).toFixed(0),
    facilitatorPublicKeys: groupPublicKeys[0],
  }],
});

// 6. Sign authorizations
const signedAuths = await Promise.all(
  quoteResponse.authorizations.map(async (auth) => ({
    ...auth,
    signature: await signer.signEip712TypedData(auth.eip712),
  }))
);

// 7. Sign order
const orderDoc = quoteResponseToEip712Document(quoteResponse);
const signedQuote = await signer.signEip712TypedData(orderDoc);

// 8. Approve proxy authorizations
const facilitatorReplies = await group.approveProxyAuthorizations(
  quoteResponse.facilitators,
  { proxyPublicKey: client.proxyPublicKey }
);

// 9. Place order
const [orderError, orderResponse] = await client.order({
  quote: quoteResponse.quote,
  quoteId: quoteResponse.quoteId,
  authorizations: signedAuths,
  eip712Domain: orderDoc.domain,
  signature: signedQuote,
  facilitators: facilitatorReplies,
});

// 10. Execute deposit
const txParams = parseTransactionRequestForViem(orderResponse.transaction);
const hash = await walletClient.sendTransaction(txParams);
```

### Authentication Flow

```javascript
async function authenticateAndDeriveEntropy(client, signer) {
  // Get nonce
  const [nonceError, nonceResponse] = await client.nonce(signer.address);
  
  // Create SIWE message
  const signInMessage = createSignInMessage(
    signer.address,
    nonceResponse.nonce,
    'silentswap.com'
  );
  
  // Sign message
  const siweSignature = await signer.signEip191Message(signInMessage.message);
  
  // Authenticate
  const [authError, authResponse] = await client.authenticate({
    siwe: {
      message: signInMessage.message,
      signature: siweSignature,
    },
  });
  
  // Derive entropy
  const eip712Doc = createEip712DocForWalletGeneration(authResponse.secretToken);
  const entropy = await signer.signEip712TypedData(eip712Doc);
  
  return entropy;
}
```

## Key Concepts

### CAIP Standards

#### CAIP-10: Account ID Specification

Format: `caip10:<namespace>:<chainId>:<address>`

Examples:
- EVM: `caip10:eip155:1:0x1234...`
- Solana: `caip10:solana:*:9WzDXwBbmkg8...`

#### CAIP-19: Asset Type and Asset ID Specification

Format: `<chainId>/<tokenType>:<tokenAddress>`

Examples:
- Native ETH: `eip155:1/slip44:60`
- USDC on Ethereum: `eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- Native SOL: `solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/slip44:501`

### Facilitator Groups

Facilitator groups are hierarchical deterministic (HD) wallets generated from entropy. Each group contains:

- **Viewer Account**: Used to observe order execution
- **Facilitator Accounts**: Used to execute swaps on different chains (indexed by coin type and output index)

The deposit count (nonce) ensures each order uses a unique set of facilitator accounts.

### Bridge Providers

- **Relay.link**: Fast, low-fee bridging for popular routes
- **deBridge**: Wide chain support with competitive rates

The SDK automatically compares both providers and selects the best rate based on retention rate.

## API Reference

### Core Functions

#### `getBridgeQuote(srcChainId, srcToken, srcAmount, dstChainId, dstToken, userAddress, signal?)`

Get optimized bridge quote from multiple providers.

**Parameters:**
- `srcChainId` (number): Source chain ID
- `srcToken` (string): Source token address (use `'0x0'` for native)
- `srcAmount` (string): Amount in token units
- `dstChainId` (number): Destination chain ID
- `dstToken` (string): Destination token address
- `userAddress` (string): User's address
- `signal` (AbortSignal, optional): Abort signal

**Returns:** `Promise<BridgeQuoteResult>`

#### `convertQuoteResultToQuote(quoteResult, srcChainId)`

Convert quote result to executable quote with transaction data.

**Parameters:**
- `quoteResult` (BridgeQuoteResult): Quote result from `getBridgeQuote`
- `srcChainId` (number): Source chain ID

**Returns:** `BridgeQuote`

#### `executeBridgeTransaction(quote, walletClient, connector, setStep)`

Execute bridge transaction with automatic chain switching.

**Parameters:**
- `quote` (BridgeQuote): Executable quote
- `walletClient` (WalletClient): Viem wallet client
- `connector` (Connector): Wagmi connector for chain switching
- `setStep` (Function): Callback for progress updates

**Returns:** `Promise<BridgeStatus>`

#### `getBridgeStatus(requestId, provider)`

Check the status of a bridge transaction.

**Parameters:**
- `requestId` (string): Request ID from execution
- `provider` (BridgeProvider): Provider used

**Returns:** `Promise<BridgeStatus>`

#### `solveOptimalUsdcAmount(srcChainId, srcToken, srcAmount, userAddress, depositCalldata?, maxImpactPercent?)`

Find optimal USDC amount for bridge operations.

**Parameters:**
- `srcChainId` (number): Source chain ID
- `srcToken` (string): Source token address
- `srcAmount` (string): Source amount
- `userAddress` (string): User's address
- `depositCalldata` (string, optional): Deposit calldata
- `maxImpactPercent` (number, optional): Max price impact

**Returns:** `Promise<SolveUsdcResult>`

### Silent Swap Functions

#### `createSilentSwapClient(options)`

Create SilentSwap client instance.

**Parameters:**
- `options.environment` (ENVIRONMENT): Environment (STAGING or PRODUCTION)
- `options.baseUrl` (string, optional): Custom base URL

**Returns:** `SilentSwapClient`

#### `createViemSigner(account, walletClient)`

Create EVM signer adapter for viem.

**Parameters:**
- `account` (Account): Viem account
- `walletClient` (WalletClient): Viem wallet client

**Returns:** `EvmSigner`

#### `createHdFacilitatorGroupFromEntropy(entropy, depositCount)`

Create facilitator group from entropy.

**Parameters:**
- `entropy` (Uint8Array): Entropy bytes
- `depositCount` (number): Deposit count (nonce)

**Returns:** `Promise<FacilitatorGroup>`

#### `queryDepositCount(userAddress)`

Query the number of deposits made by a user.

**Parameters:**
- `userAddress` (string): User's address

**Returns:** `Promise<number>`

#### `caip19FungibleEvmToken(chainId, tokenAddress)`

Create CAIP-19 identifier for EVM token.

**Parameters:**
- `chainId` (number): Chain ID
- `tokenAddress` (string): Token address

**Returns:** `string` (CAIP-19 identifier)

### Utility Functions

#### `hexToBytes(hex)`

Convert hex string to bytes array.

**Parameters:**
- `hex` (string): Hex string

**Returns:** `Uint8Array`

#### `parseTransactionRequestForViem(transactionRequest)`

Parse transaction request for viem.

**Parameters:**
- `transactionRequest` (object): Transaction request from API

**Returns:** Viem-compatible transaction parameters

## Examples

See the `examples/node-backend-example.js` file for complete working examples:

```bash
# Run Simple Bridge example
pnpm example:bridge

# Run Silent Swap example
pnpm example:silent
```

## Error Handling

```javascript
try {
  const quote = await getBridgeQuote(/* ... */);
} catch (error) {
  if (error instanceof AggregateError) {
    // All providers failed
    console.error('All providers failed:', error.errors);
  } else if (error.message.includes('Price impact too high')) {
    // Price impact exceeded maximum
    console.error('Try a smaller amount');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Best Practices

1. **Always use CAIP standards** for asset and account identifiers
2. **Handle chain switching** properly in your connector implementation
3. **Monitor transaction status** after execution
4. **Cache facilitator groups** to avoid regenerating for the same user
5. **Validate addresses** before creating quotes or orders
6. **Use appropriate environments** (STAGING for testing, PRODUCTION for live)
7. **Implement proper error handling** for all API calls

## Support

- [SilentSwap Documentation](https://docs.silentswap.com)
- [Core SDK Guide](https://docs.silentswap.com/core/simple-bridge/introduction)
- [GitHub Repository](https://github.com/Auronox/silentswap-v2-sdk)
