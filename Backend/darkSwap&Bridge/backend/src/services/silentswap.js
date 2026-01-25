import { getBridgeQuote, executeBridgeTransaction, convertQuoteResultToQuote } from '@silentswap/sdk';

/**
 * Get a quote for a cross-chain bridge transaction
 */
export async function getQuote({ fromChainId, toChainId, fromToken, toToken, amount, userAddress }) {
  try {
    const quote = await getBridgeQuote(
      fromChainId,
      toChainId,
      fromToken,
      toToken,
      amount,
      userAddress,
    );

    return {
      success: true,
      data: quote,
    };
  } catch (error) {
    console.error('Error getting quote:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Execute a bridge transaction
 */
export async function executeSwap({ quote, signer }) {
  try {
    const result = await executeBridgeTransaction({
      quote,
      signer,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error executing swap:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get supported chains and tokens
 */
export async function getSupportedAssets() {
  const { getSupportedChains, SUPPORTED_TOKENS } = await import('./assets.js');
  
  return {
    chains: getSupportedChains(),
    tokens: SUPPORTED_TOKENS,
  };
}
