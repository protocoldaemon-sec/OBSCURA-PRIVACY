/**
 * Price Discovery Client
 * 
 * Fetches public price quotes from Jupiter aggregator for:
 * - Best swap routes across Solana DEXes
 * - Price impact estimation
 * - Slippage calculation
 * 
 * These public quotes feed into Obscura's private execution:
 * 1. Get public quote (this module)
 * 2. Encrypt intent with Arcium
 * 3. Run confidential solver auction
 * 4. Execute privately via cSPL
 */

import type {
  QuoteRequest,
  JupiterQuote,
  SwapRequest,
  SwapResponse,
  PriceDiscoveryResult,
  TokenInfo,
  KNOWN_MINTS,
} from './types.js';

/** Jupiter API endpoints */
const JUPITER_API = {
  quote: 'https://quote-api.jup.ag/v6/quote',
  swap: 'https://quote-api.jup.ag/v6/swap',
  tokens: 'https://token.jup.ag/all',
  price: 'https://price.jup.ag/v6/price',
} as const;

/** Price discovery configuration */
export interface PriceDiscoveryConfig {
  /** Default slippage in basis points (default: 50 = 0.5%) */
  defaultSlippageBps?: number;
  /** Quote validity in seconds (default: 30) */
  quoteValiditySeconds?: number;
  /** Max accounts for transaction (default: 64) */
  maxAccounts?: number;
  /** Only use direct routes */
  onlyDirectRoutes?: boolean;
}

/**
 * Price Discovery Client
 * 
 * Provides public price quotes that feed into private execution
 */
export class PriceDiscoveryClient {
  private config: Required<PriceDiscoveryConfig>;
  private tokenCache: Map<string, TokenInfo> = new Map();
  private tokenCacheExpiry: number = 0;

  constructor(config: PriceDiscoveryConfig = {}) {
    this.config = {
      defaultSlippageBps: config.defaultSlippageBps ?? 50,
      quoteValiditySeconds: config.quoteValiditySeconds ?? 30,
      maxAccounts: config.maxAccounts ?? 64,
      onlyDirectRoutes: config.onlyDirectRoutes ?? false,
    };
  }

  /**
   * Get a price quote from Jupiter
   * 
   * @example
   * ```typescript
   * const quote = await client.getQuote({
   *   inputMint: KNOWN_MINTS.SOL,
   *   outputMint: KNOWN_MINTS.USDC,
   *   amount: '1000000000', // 1 SOL in lamports
   * });
   * ```
   */
  async getQuote(request: QuoteRequest): Promise<JupiterQuote> {
    const params = new URLSearchParams({
      inputMint: request.inputMint,
      outputMint: request.outputMint,
      amount: request.amount,
      slippageBps: (request.slippageBps ?? this.config.defaultSlippageBps).toString(),
      swapMode: request.swapMode ?? 'ExactIn',
      onlyDirectRoutes: (request.onlyDirectRoutes ?? this.config.onlyDirectRoutes).toString(),
      maxAccounts: (request.maxAccounts ?? this.config.maxAccounts).toString(),
    });

    if (request.restrictIntermediateTokens) {
      params.set('restrictIntermediateTokens', 'true');
    }

    const response = await fetch(`${JUPITER_API.quote}?${params}`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jupiter quote error: ${error}`);
    }

    return response.json() as Promise<JupiterQuote>;
  }

  /**
   * Get swap transaction from Jupiter
   * 
   * Note: For Obscura, we typically don't use this directly.
   * Instead, we use the quote for price discovery and execute privately.
   */
  async getSwapTransaction(request: SwapRequest): Promise<SwapResponse> {
    const response = await fetch(JUPITER_API.swap, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: request.quoteResponse,
        userPublicKey: request.userPublicKey,
        wrapAndUnwrapSol: request.wrapAndUnwrapSol ?? true,
        useSharedAccounts: request.useSharedAccounts ?? true,
        feeAccount: request.feeAccount,
        computeUnitPriceMicroLamports: request.computeUnitPriceMicroLamports,
        prioritizationFeeLamports: request.prioritizationFeeLamports,
        dynamicComputeUnitLimit: request.dynamicComputeUnitLimit ?? true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jupiter swap error: ${error}`);
    }

    return response.json() as Promise<SwapResponse>;
  }

  /**
   * Get price for a token in USD
   */
  async getPrice(mint: string): Promise<number> {
    const response = await fetch(`${JUPITER_API.price}?ids=${mint}`);
    
    if (!response.ok) {
      throw new Error(`Jupiter price error: ${response.statusText}`);
    }

    const data = await response.json() as {
      data: Record<string, { price: number }>;
    };

    return data.data[mint]?.price ?? 0;
  }

  /**
   * Get prices for multiple tokens
   */
  async getPrices(mints: string[]): Promise<Map<string, number>> {
    const response = await fetch(`${JUPITER_API.price}?ids=${mints.join(',')}`);
    
    if (!response.ok) {
      throw new Error(`Jupiter price error: ${response.statusText}`);
    }

    const data = await response.json() as {
      data: Record<string, { price: number }>;
    };

    const prices = new Map<string, number>();
    for (const mint of mints) {
      prices.set(mint, data.data[mint]?.price ?? 0);
    }
    return prices;
  }

  /**
   * Get all tradeable tokens from Jupiter
   */
  async getTokenList(): Promise<TokenInfo[]> {
    // Check cache
    if (this.tokenCacheExpiry > Date.now() && this.tokenCache.size > 0) {
      return Array.from(this.tokenCache.values());
    }

    const response = await fetch(JUPITER_API.tokens);
    
    if (!response.ok) {
      throw new Error(`Jupiter tokens error: ${response.statusText}`);
    }

    const tokens = await response.json() as TokenInfo[];
    
    // Update cache (valid for 5 minutes)
    this.tokenCache.clear();
    for (const token of tokens) {
      this.tokenCache.set(token.address, token);
    }
    this.tokenCacheExpiry = Date.now() + 5 * 60 * 1000;

    return tokens;
  }

  /**
   * Get token info by mint address
   */
  async getTokenInfo(mint: string): Promise<TokenInfo | null> {
    // Check cache first
    if (this.tokenCache.has(mint)) {
      return this.tokenCache.get(mint)!;
    }

    // Fetch token list if cache is empty
    if (this.tokenCache.size === 0) {
      await this.getTokenList();
    }

    return this.tokenCache.get(mint) ?? null;
  }

  /**
   * Perform price discovery for Obscura private execution
   * 
   * This is the main entry point for the public → private flow:
   * 1. Get best public quote
   * 2. Calculate price impact
   * 3. Return data for private execution
   * 
   * @example
   * ```typescript
   * const discovery = await client.discoverPrice({
   *   inputMint: KNOWN_MINTS.SOL,
   *   outputMint: KNOWN_MINTS.USDC,
   *   amount: '1000000000', // 1 SOL
   * });
   * 
   * // Now use discovery.publicQuote for private execution
   * const privateIntent = await arciumClient.encryptIntent({
   *   action: 'swap',
   *   inputAmount: BigInt(discovery.publicQuote.inAmount),
   *   outputAmount: discovery.estimatedOutput,
   *   deadline: Date.now() + 60000,
   * });
   * ```
   */
  async discoverPrice(request: QuoteRequest): Promise<PriceDiscoveryResult> {
    const quote = await this.getQuote(request);
    
    // Build route description
    const routeDescription = quote.routePlan
      .map(step => `${step.swapInfo.label} (${step.percent}%)`)
      .join(' → ');

    // Parse price impact
    const priceImpact = parseFloat(quote.priceImpactPct);

    return {
      publicQuote: quote,
      estimatedOutput: BigInt(quote.outAmount),
      priceImpact,
      routeDescription,
      quotedAt: Date.now(),
      validFor: this.config.quoteValiditySeconds,
    };
  }

  /**
   * Compare quotes across different amounts for slippage analysis
   */
  async analyzeSlippage(
    inputMint: string,
    outputMint: string,
    amounts: string[]
  ): Promise<Array<{ amount: string; output: string; priceImpact: number }>> {
    const results = await Promise.all(
      amounts.map(async amount => {
        try {
          const quote = await this.getQuote({ inputMint, outputMint, amount });
          return {
            amount,
            output: quote.outAmount,
            priceImpact: parseFloat(quote.priceImpactPct),
          };
        } catch {
          return { amount, output: '0', priceImpact: 100 };
        }
      })
    );
    return results;
  }

  /**
   * Find best route for a swap (may differ from default)
   */
  async findBestRoute(
    inputMint: string,
    outputMint: string,
    amount: string,
    options?: {
      maxSlippageBps?: number;
      preferredDexes?: string[];
    }
  ): Promise<{
    quote: JupiterQuote;
    route: string;
    estimatedFees: bigint;
  }> {
    // Get quote with different settings
    const [directQuote, multiHopQuote] = await Promise.all([
      this.getQuote({
        inputMint,
        outputMint,
        amount,
        onlyDirectRoutes: true,
        slippageBps: options?.maxSlippageBps,
      }).catch(() => null),
      this.getQuote({
        inputMint,
        outputMint,
        amount,
        onlyDirectRoutes: false,
        slippageBps: options?.maxSlippageBps,
      }).catch(() => null),
    ]);

    // Compare outputs
    const directOutput = directQuote ? BigInt(directQuote.outAmount) : 0n;
    const multiHopOutput = multiHopQuote ? BigInt(multiHopQuote.outAmount) : 0n;

    const bestQuote = directOutput >= multiHopOutput ? directQuote : multiHopQuote;
    
    if (!bestQuote) {
      throw new Error('No valid route found');
    }

    // Calculate estimated fees from route
    const estimatedFees = bestQuote.routePlan.reduce(
      (sum, step) => sum + BigInt(step.swapInfo.feeAmount),
      0n
    );

    const route = bestQuote.routePlan
      .map(step => step.swapInfo.label)
      .join(' → ');

    return {
      quote: bestQuote,
      route,
      estimatedFees,
    };
  }
}

/**
 * Create price discovery client
 */
export function createPriceDiscoveryClient(
  config?: PriceDiscoveryConfig
): PriceDiscoveryClient {
  return new PriceDiscoveryClient(config);
}

/**
 * Quick helper to get a quote
 */
export async function getQuickQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50
): Promise<JupiterQuote> {
  const client = new PriceDiscoveryClient({ defaultSlippageBps: slippageBps });
  return client.getQuote({ inputMint, outputMint, amount });
}
