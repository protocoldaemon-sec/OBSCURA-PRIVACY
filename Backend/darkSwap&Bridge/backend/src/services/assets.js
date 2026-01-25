/**
 * Supported chains and their configurations
 */
export const SUPPORTED_CHAINS = {
  // EVM Chains
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    caipChainId: 'eip155:1',
    rpcUrl: 'https://eth.llamarpc.com',
  },
  POLYGON: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    caipChainId: 'eip155:137',
    rpcUrl: 'https://polygon.llamarpc.com',
  },
  ARBITRUM: {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ARB',
    caipChainId: 'eip155:42161',
    rpcUrl: 'https://arbitrum.llamarpc.com',
  },
  AVALANCHE: {
    id: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    caipChainId: 'eip155:43114',
    rpcUrl: 'https://avalanche.public-rpc.com',
  },
  // Solana
  SOLANA: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    caipChainId: 'solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
  },
};

/**
 * Supported tokens by chain
 * Using CAIP-19 format: <chainId>/<tokenType>:<tokenAddress>
 */
export const SUPPORTED_TOKENS = {
  // Ethereum tokens
  'eip155:1': [
    {
      caip19: 'eip155:1/slip44:60', // Native ETH
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    },
    {
      caip19: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    {
      caip19: 'eip155:1/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
  ],
  // Polygon tokens
  'eip155:137': [
    {
      caip19: 'eip155:137/slip44:966', // Native MATIC
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    },
    {
      caip19: 'eip155:137/erc20:0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    },
  ],
  // Arbitrum tokens
  'eip155:42161': [
    {
      caip19: 'eip155:42161/slip44:60', // Native ETH on Arbitrum
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    },
    {
      caip19: 'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    },
  ],
  // Avalanche tokens
  'eip155:43114': [
    {
      caip19: 'eip155:43114/slip44:9000', // Native AVAX
      symbol: 'AVAX',
      name: 'Avalanche',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
    },
    {
      caip19: 'eip155:43114/erc20:0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    },
  ],
  // Solana tokens
  'solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1': [
    {
      caip19: 'solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/slip44:501', // Native SOL
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      address: 'So11111111111111111111111111111111111111112',
    },
    {
      caip19: 'solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/erc20:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    },
  ],
};

/**
 * Get all supported chains
 */
export function getSupportedChains() {
  return Object.values(SUPPORTED_CHAINS);
}

/**
 * Get tokens for a specific chain
 */
export function getTokensByChain(caipChainId) {
  return SUPPORTED_TOKENS[caipChainId] || [];
}

/**
 * Get all supported tokens across all chains
 */
export function getAllSupportedTokens() {
  return Object.values(SUPPORTED_TOKENS).flat();
}

/**
 * Find a token by CAIP-19 identifier
 */
export function findTokenByCaip19(caip19) {
  const allTokens = getAllSupportedTokens();
  return allTokens.find(token => token.caip19 === caip19);
}

/**
 * Parse CAIP-19 identifier
 * Format: <chainId>/<tokenType>:<tokenAddress>
 */
export function parseCaip19(caip19) {
  const [chainPart, tokenPart] = caip19.split('/');
  const [tokenType, tokenAddress] = tokenPart.split(':');
  
  return {
    chainId: chainPart,
    tokenType,
    tokenAddress,
  };
}
