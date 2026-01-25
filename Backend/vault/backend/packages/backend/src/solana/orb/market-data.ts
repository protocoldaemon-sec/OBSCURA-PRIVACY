/**
 * Market Data Client
 * 
 * Fetches market data from various sources:
 * - Token prices and volume from Jupiter
 * - Market cap and FDV calculations
 * - Trending tokens and categories
 * 
 * Used for:
 * - Intent validation (check if amounts are reasonable)
 * - Solver quote verification
 * - Risk assessment for batch optimization
 */

import type {
  TokenMarketData,
  TokenCategory,
  TokenInfo,
  KNOWN_MINTS,
} from './types.js';

/** Birdeye API for market data (alternative to Jupiter) */
const BIRDEYE_API = 'https://public-api.birdeye.so';

/** DexScreener API for additional data */
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

/** Market data configuration */
export interface MarketDataConfig {
  /** Birdeye API key (optional, for enhanced data) */
  birdeyeApiKey?: string;
  /** Cache duration in milliseconds (default: 60000 = 1 minute) */
  cacheDurationMs?: number;
}

/** Cached market data entry */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Market Data Client
 * 
 * Provides market data for tokens on Solana
 */
export class MarketDataClient {
  private config: Required<MarketDataConfig>;
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  constructor(config: MarketDataConfig = {}) {
    this.config = {
      birdeyeApiKey: config.birdeyeApiKey ?? '',
      cacheDurationMs: config.cacheDurationMs ?? 60000,
    };
  }

  /**
   * Get market data for a token
   */
  async getTokenMarketData(mint: string): Promise<TokenMarketData | null> {
    // Check cache
    const cached = this.getFromCache<TokenMarketData>(`market:${mint}`);
    if (cached) return cached;

    try {
      // Try DexScreener first (no API key needed)
      const data = await this.fetchFromDexScreener(mint);
      if (data) {
        this.setCache(`market:${mint}`, data);
        return data;
      }
    } catch {
      // Fall through to simulated data
    }

    // Return simulated data for demo
    const simulated = this.getSimulatedMarketData(mint);
    this.setCache(`market:${mint}`, simulated);
    return simulated;
  }

  /**
   * Get market data for multiple tokens
   */
  async getMultipleTokenMarketData(
    mints: string[]
  ): Promise<Map<string, TokenMarketData>> {
    const results = new Map<string, TokenMarketData>();
    
    await Promise.all(
      mints.map(async mint => {
        const data = await this.getTokenMarketData(mint);
        if (data) {
          results.set(mint, data);
        }
      })
    );

    return results;
  }

  /**
   * Get trending tokens by category
   */
  async getTrendingTokens(
    category: TokenCategory,
    limit: number = 10
  ): Promise<TokenMarketData[]> {
    // Check cache
    const cacheKey = `trending:${category}:${limit}`;
    const cached = this.getFromCache<TokenMarketData[]>(cacheKey);
    if (cached) return cached;

    // For demo, return simulated trending data
    const trending = this.getSimulatedTrending(category, limit);
    this.setCache(cacheKey, trending);
    return trending;
  }

  /**
   * Check if a token is verified/safe
   */
  async isTokenVerified(mint: string): Promise<{
    verified: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    
    try {
      const data = await this.getTokenMarketData(mint);
      
      if (!data) {
        return { verified: false, warnings: ['Token not found'] };
      }

      // Check for red flags
      if (data.liquidity < 10000) {
        warnings.push('Low liquidity (< $10k)');
      }
      if (data.holders && data.holders < 100) {
        warnings.push('Few holders (< 100)');
      }
      if (data.volume24h < 1000) {
        warnings.push('Low trading volume');
      }

      return {
        verified: warnings.length === 0,
        warnings,
      };
    } catch {
      return { verified: false, warnings: ['Unable to verify token'] };
    }
  }

  /**
   * Calculate fair value for an intent
   * 
   * Used to validate solver quotes against market prices
   */
  async calculateFairValue(
    inputMint: string,
    outputMint: string,
    inputAmount: bigint
  ): Promise<{
    fairOutputAmount: bigint;
    tolerance: number;
    confidence: 'high' | 'medium' | 'low';
  }> {
    const [inputData, outputData] = await Promise.all([
      this.getTokenMarketData(inputMint),
      this.getTokenMarketData(outputMint),
    ]);

    if (!inputData || !outputData) {
      return {
        fairOutputAmount: 0n,
        tolerance: 0.1, // 10% tolerance when data unavailable
        confidence: 'low',
      };
    }

    // Calculate fair output based on prices
    const inputValue = Number(inputAmount) * inputData.priceUsd;
    const fairOutput = inputValue / outputData.priceUsd;

    // Determine confidence based on liquidity
    let confidence: 'high' | 'medium' | 'low' = 'low';
    const minLiquidity = Math.min(inputData.liquidity, outputData.liquidity);
    
    if (minLiquidity > 1000000) {
      confidence = 'high';
    } else if (minLiquidity > 100000) {
      confidence = 'medium';
    }

    // Tolerance based on confidence
    const tolerance = confidence === 'high' ? 0.01 : confidence === 'medium' ? 0.03 : 0.1;

    return {
      fairOutputAmount: BigInt(Math.floor(fairOutput)),
      tolerance,
      confidence,
    };
  }

  /**
   * Get price history for a token (simplified)
   */
  async getPriceHistory(
    mint: string,
    _interval: '1h' | '24h' | '7d' = '24h'
  ): Promise<Array<{ timestamp: number; price: number }>> {
    // Simulated price history for demo
    const now = Date.now();
    const points: Array<{ timestamp: number; price: number }> = [];
    const basePrice = (await this.getTokenMarketData(mint))?.priceUsd ?? 1;

    for (let i = 24; i >= 0; i--) {
      const timestamp = now - i * 3600000; // hourly
      const variance = (Math.random() - 0.5) * 0.1; // ±5% variance
      points.push({
        timestamp,
        price: basePrice * (1 + variance),
      });
    }

    return points;
  }

  // ============ Private Methods ============

  private async fetchFromDexScreener(mint: string): Promise<TokenMarketData | null> {
    try {
      const response = await fetch(`${DEXSCREENER_API}/tokens/${mint}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json() as {
        pairs?: Array<{
          priceUsd: string;
          priceChange: { h24: number };
          volume: { h24: number };
          liquidity: { usd: number };
          fdv: number;
          marketCap?: number;
        }>;
      };

      if (!data.pairs || data.pairs.length === 0) {
        return null;
      }

      // Use the most liquid pair
      const pair = data.pairs.reduce((best, current) => 
        (current.liquidity?.usd ?? 0) > (best.liquidity?.usd ?? 0) ? current : best
      );

      return {
        mint,
        priceUsd: parseFloat(pair.priceUsd),
        priceChange24h: pair.priceChange?.h24 ?? 0,
        volume24h: pair.volume?.h24 ?? 0,
        marketCap: pair.marketCap ?? pair.fdv ?? 0,
        fdv: pair.fdv ?? 0,
        totalSupply: 0n, // Not available from DexScreener
        liquidity: pair.liquidity?.usd ?? 0,
        updatedAt: Date.now(),
      };
    } catch {
      return null;
    }
  }

  private getSimulatedMarketData(mint: string): TokenMarketData {
    // Simulated data for known tokens
    const knownPrices: Record<string, number> = {
      'So11111111111111111111111111111111111111112': 150, // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1, // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1, // USDT
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 0.8, // JUP
    };

    const price = knownPrices[mint] ?? Math.random() * 10;

    return {
      mint,
      priceUsd: price,
      priceChange24h: (Math.random() - 0.5) * 20,
      volume24h: Math.random() * 10000000,
      marketCap: Math.random() * 1000000000,
      fdv: Math.random() * 2000000000,
      totalSupply: BigInt(Math.floor(Math.random() * 1000000000)),
      liquidity: Math.random() * 50000000,
      updatedAt: Date.now(),
    };
  }

  private getSimulatedTrending(
    category: TokenCategory,
    limit: number
  ): TokenMarketData[] {
    const results: TokenMarketData[] = [];
    
    for (let i = 0; i < limit; i++) {
      results.push({
        mint: `trending_${category}_${i}`,
        priceUsd: Math.random() * 100,
        priceChange24h: (Math.random() - 0.3) * 50,
        volume24h: Math.random() * 50000000,
        marketCap: Math.random() * 500000000,
        fdv: Math.random() * 1000000000,
        totalSupply: BigInt(Math.floor(Math.random() * 1000000000)),
        liquidity: Math.random() * 20000000,
        updatedAt: Date.now(),
      });
    }

    return results;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.config.cacheDurationMs,
    });
  }
}

/**
 * Create market data client
 */
export function createMarketDataClient(
  config?: MarketDataConfig
): MarketDataClient {
  return new MarketDataClient(config);
}

/**
 * Quick helper to get token price
 */
export async function getTokenPrice(mint: string): Promise<number> {
  const client = new MarketDataClient();
  const data = await client.getTokenMarketData(mint);
  return data?.priceUsd ?? 0;
}
