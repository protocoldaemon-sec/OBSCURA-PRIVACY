import {
  createSilentSwapClient,
  createViemSigner,
  createSignInMessage,
  createEip712DocForWalletGeneration,
  createHdFacilitatorGroupFromEntropy,
  quoteResponseToEip712Document,
  caip19FungibleEvmToken,
  queryDepositCount,
  solveOptimalUsdcAmount,
  parseTransactionRequestForViem,
  hexToBytes,
  DeliveryMethod,
  FacilitatorKeyType,
  PublicKeyArgGroups,
  ENVIRONMENT,
} from '@silentswap/sdk';
import BigNumber from 'bignumber.js';
import { config } from '../config/index.js';

/**
 * Create SilentSwap client instance
 */
export function createClient() {
  const environment = config.silentswap.environment === 'PRODUCTION' 
    ? ENVIRONMENT.PRODUCTION 
    : ENVIRONMENT.STAGING;

  return createSilentSwapClient({ environment });
}

/**
 * Authenticate user and derive entropy for facilitator wallet generation
 */
export async function authenticateAndDeriveEntropy(client, signer) {
  // Get nonce
  const [nonceError, nonceResponse] = await client.nonce(signer.address);
  if (!nonceResponse || nonceError) {
    throw new Error(`Failed to get nonce: ${nonceError?.type}: ${nonceError?.error}`);
  }

  // Create sign-in message (SIWE)
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

  if (!authResponse || authError) {
    throw new Error(`Failed to authenticate: ${authError?.type}: ${authError?.error}`);
  }

  // Derive entropy from auth token
  const eip712Doc = createEip712DocForWalletGeneration(authResponse.secretToken);
  const entropy = await signer.signEip712TypedData(eip712Doc);

  return entropy;
}

/**
 * Create facilitator group for a user
 */
export async function createFacilitatorGroup(entropy, userAddress) {
  const depositCount = await queryDepositCount(userAddress);
  const group = await createHdFacilitatorGroupFromEntropy(
    hexToBytes(entropy),
    depositCount
  );

  return { group, depositCount };
}

/**
 * Get quote for Silent Swap (direct USDC on Avalanche)
 */
export async function getSilentSwapQuote(
  client,
  signer,
  group,
  recipientAddress,
  tokenAddress,
  tokenAmount,
  tokenDecimals = 6
) {
  // Derive viewer account
  const viewer = await group.viewer();
  const { publicKeyBytes: pk65_viewer } = viewer.exportPublicKey(
    '*',
    FacilitatorKeyType.SECP256K1
  );

  // Export public keys for facilitator group
  const groupPublicKeys = await group.exportPublicKeys(1, [
    ...PublicKeyArgGroups.GENERIC,
  ]);

  // Request quote
  const [quoteError, quoteResponse] = await client.quote({
    signer: signer.address,
    viewer: pk65_viewer,
    outputs: [
      {
        method: DeliveryMethod.SNIP,
        recipient: recipientAddress,
        asset: caip19FungibleEvmToken(1, tokenAddress),
        value: BigNumber(tokenAmount).shiftedBy(tokenDecimals).toFixed(0),
        facilitatorPublicKeys: groupPublicKeys[0],
      },
    ],
  });

  if (quoteError || !quoteResponse) {
    throw new Error(`Failed to get quote: ${quoteError?.type}: ${quoteError?.error}`);
  }

  return quoteResponse;
}

/**
 * Get quote with bridge (for cross-chain swaps)
 */
export async function getSilentSwapQuoteWithBridge(
  client,
  signer,
  group,
  recipientAddress,
  destinationTokenAddress,
  sourceChainId,
  sourceTokenAddress,
  sourceAmount,
  sourceTokenDecimals
) {
  // Calculate USDC amount from bridge
  const bridgeResult = await solveOptimalUsdcAmount(
    sourceChainId,
    sourceTokenAddress,
    BigNumber(sourceAmount).shiftedBy(sourceTokenDecimals).toFixed(0),
    signer.address
  );

  const usdcAmount = bridgeResult.usdcAmountOut.toString();

  // Derive viewer account
  const viewer = await group.viewer();
  const { publicKeyBytes: pk65_viewer } = viewer.exportPublicKey(
    '*',
    FacilitatorKeyType.SECP256K1
  );

  // Export public keys for facilitator group
  const groupPublicKeys = await group.exportPublicKeys(1, [
    ...PublicKeyArgGroups.GENERIC,
  ]);

  // Request quote using the bridged USDC amount
  const [quoteError, quoteResponse] = await client.quote({
    signer: signer.address,
    viewer: pk65_viewer,
    outputs: [
      {
        method: DeliveryMethod.SNIP,
        recipient: recipientAddress,
        asset: caip19FungibleEvmToken(1, destinationTokenAddress),
        value: usdcAmount,
        facilitatorPublicKeys: groupPublicKeys[0],
      },
    ],
  });

  if (quoteError || !quoteResponse) {
    throw new Error(`Failed to get quote: ${quoteError?.type}: ${quoteError?.error}`);
  }

  return {
    quoteResponse,
    bridgeResult,
  };
}

/**
 * Create Silent Swap order
 */
export async function createSilentSwapOrder(client, signer, group, quoteResponse) {
  // Sign authorizations
  const signedAuths = await Promise.all(
    quoteResponse.authorizations.map(async (g_auth) => ({
      ...g_auth,
      signature: await (async () => {
        if ('eip3009_deposit' === g_auth.type) {
          return await signer.signEip712TypedData(g_auth.eip712);
        }
        throw Error(`Authorization instruction type not implemented: ${g_auth.type}`);
      })(),
    }))
  );

  // Sign the order's EIP-712
  const orderDoc = quoteResponseToEip712Document(quoteResponse);
  const signedQuote = await signer.signEip712TypedData(orderDoc);

  // Approve proxy authorizations
  const facilitatorReplies = await group.approveProxyAuthorizations(
    quoteResponse.facilitators,
    {
      proxyPublicKey: client.proxyPublicKey,
    }
  );

  // Place the order
  const [orderError, orderResponse] = await client.order({
    quote: quoteResponse.quote,
    quoteId: quoteResponse.quoteId,
    authorizations: signedAuths,
    eip712Domain: orderDoc.domain,
    signature: signedQuote,
    facilitators: facilitatorReplies,
  });

  if (orderError || !orderResponse) {
    throw new Error(`Failed to place order: ${orderError?.type}: ${orderError?.error}`);
  }

  return orderResponse;
}

/**
 * Execute deposit transaction
 */
export async function executeDepositTransaction(walletClient, orderResponse) {
  // Parse transaction request
  const txRequestParams = parseTransactionRequestForViem(orderResponse.transaction);

  // Send transaction
  const hash = await walletClient.sendTransaction(txRequestParams);

  // Wait for confirmation
  const txReceipt = await walletClient.waitForTransactionReceipt({ hash });

  return {
    hash,
    receipt: txReceipt,
    depositAmount: orderResponse.response.order.deposit,
  };
}
