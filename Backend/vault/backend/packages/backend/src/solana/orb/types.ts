/**
 * Orb/Jupiter Price Discovery Types
 * 
 * Types for public price quotes that feed into private execution
 */

/** Token info from Orb/Jupiter */
export interface TokenInfo {
  /** Token mint address */
  address: string;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Decimal places */
  decimals: number;
  /** Logo URI */
  logoURI?: string;
  /** Token tags (e.g., 'verified', 'community') */
  tags?: string[];
  /** Daily volume in USD */
  dailyVolume?: number;
  /** Freeze authority (null if immutable) */
  freezeAuthority?: string | null;
  /** Mint authority (null if immutable) */
  mintAuthority?: string | null;
}

/** Price quote from Jupiter aggregator */
export interface JupiterQuote {
  /** Input token mint */
  inputMint: string;
  /** Output token mint */
  outputMint: string;
  /** Input amount in smallest units */
  inAmount: string;
  /** Output amount in smallest units */
  outAmount: string;
  /** Other possible output amounts */
  otherAmountThreshold: string;
  /** Swap mode: ExactIn or ExactOut */
  swapMode: 'ExactIn' | 'ExactOut';
  /** Slippage in basis points */
  slippageBps: number;
  /** Price impact percentage */
  priceImpactPct: string;
  /** Route plan with AMM info */
  routePlan: RoutePlanStep[];
  /** Context slot */
  contextSlot?: number;
  /** Time taken to compute quote */
  timeTaken?: number;
}

/** Route plan step */
export interface RoutePlanStep {
  /** Swap info */
  swapInfo: {
    /** AMM key */
    ammKey: string;
    /** AMM label (e.g., 'Raydium', 'Orca') */
    label: string;
    /** Input mint */
    inputMint: string;
    /** Output mint */
    outputMint: string;
    /** Input amount */
    inAmount: string;
    /** Output amount */
    outAmount: string;
    /** Fee amount */
    feeAmount: string;
    /** Fee mint */
    feeMint: string;
  };
  /** Percentage of total swap */
  percent: number;
}

/** Market data for a token */
export interface TokenMarketData {
  /** Token mint address */
  mint: string;
  /** Current price in USD */
  priceUsd: number;
  /** 24h price change percentage */
  priceChange24h: number;
  /** 24h trading volume in USD */
  volume24h: number;
  /** Market capitalization in USD */
  marketCap: number;
  /** Fully diluted valuation */
  fdv: number;
  /** Total supply */
  totalSupply: bigint;
  /** Circulating supply */
  circulatingSupply?: bigint;
  /** Number of holders */
  holders?: number;
  /** Liquidity in USD */
  liquidity: number;
  /** Last updated timestamp */
  updatedAt: number;
}

/** Token category for filtering */
export type TokenCategory = 
  | 'trending'
  | 'majors'
  | 'defi'
  | 'stocks'
  | 'currencies'
  | 'depin'
  | 'memecoins';

/** Quote request parameters */
export interface QuoteRequest {
  /** Input token mint */
  inputMint: string;
  /** Output token mint */
  outputMint: string;
  /** Amount in smallest units */
  amount: string;
  /** Slippage tolerance in basis points (default: 50 = 0.5%) */
  slippageBps?: number;
  /** Swap mode */
  swapMode?: 'ExactIn' | 'ExactOut';
  /** Only direct routes (no multi-hop) */
  onlyDirectRoutes?: boolean;
  /** Restrict to specific DEXes */
  restrictIntermediateTokens?: boolean;
  /** Max accounts for transaction */
  maxAccounts?: number;
}

/** Swap transaction request */
export interface SwapRequest {
  /** Quote response from getQuote */
  quoteResponse: JupiterQuote;
  /** User's public key */
  userPublicKey: string;
  /** Wrap/unwrap SOL automatically */
  wrapAndUnwrapSol?: boolean;
  /** Use shared accounts for efficiency */
  useSharedAccounts?: boolean;
  /** Fee account for referral */
  feeAccount?: string;
  /** Compute unit price in micro-lamports */
  computeUnitPriceMicroLamports?: number;
  /** Priority level for Helius */
  prioritizationFeeLamports?: number | 'auto';
  /** Dynamic compute unit limit */
  dynamicComputeUnitLimit?: boolean;
}

/** Swap transaction response */
export interface SwapResponse {
  /** Serialized transaction (base64) */
  swapTransaction: string;
  /** Last valid block height */
  lastValidBlockHeight: number;
  /** Priority fee used */
  prioritizationFeeLamports?: number;
}

/** Price discovery result for Obscura */
export interface PriceDiscoveryResult {
  /** Best quote from public aggregators */
  publicQuote: JupiterQuote;
  /** Estimated output amount */
  estimatedOutput: bigint;
  /** Price impact */
  priceImpact: number;
  /** Best route description */
  routeDescription: string;
  /** Quote timestamp */
  quotedAt: number;
  /** Quote validity (seconds) */
  validFor: number;
  /** Market data for input token */
  inputTokenData?: TokenMarketData;
  /** Market data for output token */
  outputTokenData?: TokenMarketData;
}

/** Private execution request (after price discovery) */
export interface PrivateExecutionRequest {
  /** Price discovery result */
  priceDiscovery: PriceDiscoveryResult;
  /** User's encrypted balance commitment */
  encryptedBalanceCommitment: Uint8Array;
  /** Minimum acceptable output (encrypted) */
  encryptedMinOutput: Uint8Array;
  /** Deadline timestamp */
  deadline: number;
  /** Privacy level */
  privacyLevel: 'SHIELDED' | 'COMPLIANT';
  /** Auditor public key (for COMPLIANT mode) */
  auditorPubKey?: Uint8Array;
}

/** Well-known token mints on Solana */
export const KNOWN_MINTS = {
  // Native
  SOL: 'So11111111111111111111111111111111111111112',
  WSOL: 'So11111111111111111111111111111111111111112',
  
  // Stablecoins
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  PYUSD: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
  
  // Major assets
  BTC: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // Wrapped BTC
  ETH: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // Wrapped ETH
  
  // DeFi
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  
  // Memecoins
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
} as const;

/** Common trading pairs */
export const COMMON_PAIRS = [
  { input: KNOWN_MINTS.SOL, output: KNOWN_MINTS.USDC },
  { input: KNOWN_MINTS.USDC, output: KNOWN_MINTS.SOL },
  { input: KNOWN_MINTS.SOL, output: KNOWN_MINTS.JUP },
  { input: KNOWN_MINTS.SOL, output: KNOWN_MINTS.BONK },
  { input: KNOWN_MINTS.USDC, output: KNOWN_MINTS.BTC },
  { input: KNOWN_MINTS.USDC, output: KNOWN_MINTS.ETH },
] as const;
