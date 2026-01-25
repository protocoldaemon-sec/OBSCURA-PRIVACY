/**
 * Orb Block Explorer Utilities
 * 
 * Generate URLs and interact with Helius Orb explorer:
 * - Transaction lookup and debugging
 * - Token analysis (holders, authorities, metadata)
 * - Program inspection
 * - Devnet support for testing
 * 
 * @see https://orb.helius.dev
 */

/** Solana cluster type */
export type SolanaCluster = 'mainnet-beta' | 'devnet' | 'testnet';

/** Orb explorer base URL */
export const ORB_BASE_URL = 'https://orb.helius.dev';

// ============ Core Solana Program IDs ============

/** Core Solana program IDs (same on all clusters) */
export const CORE_PROGRAMS = {
  SYSTEM: '11111111111111111111111111111111',
  TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  TOKEN_2022: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  COMPUTE_BUDGET: 'ComputeBudget111111111111111111111111111111',
  MEMO: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
  VOTE: 'Vote111111111111111111111111111111111111111',
  STAKE: 'Stake11111111111111111111111111111111111111',
  ADDRESS_LOOKUP_TABLE: 'AddressLookupTab1e1111111111111111111111111',
} as const;

/** Popular DeFi program IDs on Devnet */
export const DEVNET_PROGRAMS = {
  // Arcium
  ARCIUM: 'arcaborPMqYhZbLqPKPRXpBKyCMgH8kApNoxp4cLKg',
  
  // DEXes
  JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  RAYDIUM_CP_SWAP: 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
  ORCA_WHIRLPOOL: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  
  // Oracles
  PYTH: 'gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s',
  
  // NFT/Metadata
  METAPLEX: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  
  // Compression
  STATE_COMPRESSION: 'cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK',
  LIGHT_SYSTEM: 'SySTEM1eSU2p4BGQfQpimFEWWSC1XDFeun3Nqzz3rT7',
  
  // Bridge
  WORMHOLE_CORE: 'HDwcJBJXjL9FpJ7UBsYBtaDjsBUhuLCUYoz3zr8SWWaQ',
  WORMHOLE_TOKEN: 'DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe',
} as const;

/** Well-known token mints on Devnet */
export const DEVNET_TOKENS = {
  /** Devnet USDC (Circle) */
  USDC: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  /** Wrapped SOL */
  WSOL: 'So11111111111111111111111111111111111111112',
} as const;

// ============ URL Generators ============

/**
 * Build cluster query parameter
 */
function clusterParam(cluster: SolanaCluster): string {
  return cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
}

/**
 * Generate Orb URL for a transaction
 * 
 * @example
 * ```typescript
 * const url = getTransactionUrl('5abc...', 'devnet');
 * // https://orb.helius.dev/tx/5abc...?cluster=devnet
 * ```
 */
export function getTransactionUrl(
  signature: string,
  cluster: SolanaCluster = 'mainnet-beta'
): string {
  return `${ORB_BASE_URL}/tx/${signature}${clusterParam(cluster)}`;
}

/**
 * Generate Orb URL for an account/wallet
 */
export function getAccountUrl(
  address: string,
  cluster: SolanaCluster = 'mainnet-beta'
): string {
  return `${ORB_BASE_URL}/address/${address}${clusterParam(cluster)}`;
}

/**
 * Generate Orb URL for a token mint
 */
export function getTokenUrl(
  mint: string,
  cluster: SolanaCluster = 'mainnet-beta'
): string {
  return `${ORB_BASE_URL}/token/${mint}${clusterParam(cluster)}`;
}

/**
 * Generate Orb URL for a program
 */
export function getProgramUrl(
  programId: string,
  cluster: SolanaCluster = 'mainnet-beta'
): string {
  return `${ORB_BASE_URL}/address/${programId}${clusterParam(cluster)}`;
}

/**
 * Generate Orb URL for a block/slot
 */
export function getBlockUrl(
  slot: number,
  cluster: SolanaCluster = 'mainnet-beta'
): string {
  return `${ORB_BASE_URL}/block/${slot}${clusterParam(cluster)}`;
}

// ============ Obscura-Specific URLs ============

/**
 * Get Orb URL for Arcium program on devnet
 */
export function getArciumProgramUrl(): string {
  return getProgramUrl(DEVNET_PROGRAMS.ARCIUM, 'devnet');
}

/**
 * Get Orb URL for Obscura settlement program
 */
export function getObscuraSettlementUrl(programId: string): string {
  return getProgramUrl(programId, 'devnet');
}

/**
 * Get Orb URL for a confidential computation transaction
 */
export function getComputationTxUrl(signature: string): string {
  return getTransactionUrl(signature, 'devnet');
}

// ============ Explorer Helper Class ============

/**
 * Orb Explorer helper for Obscura
 * 
 * Provides convenient methods for generating explorer URLs
 * and logging transaction links during development.
 */
export class OrbExplorer {
  private cluster: SolanaCluster;

  constructor(cluster: SolanaCluster = 'devnet') {
    this.cluster = cluster;
  }

  /**
   * Get transaction URL
   */
  tx(signature: string): string {
    return getTransactionUrl(signature, this.cluster);
  }

  /**
   * Get account URL
   */
  account(address: string): string {
    return getAccountUrl(address, this.cluster);
  }

  /**
   * Get token URL
   */
  token(mint: string): string {
    return getTokenUrl(mint, this.cluster);
  }

  /**
   * Get program URL
   */
  program(programId: string): string {
    return getProgramUrl(programId, this.cluster);
  }

  /**
   * Get block URL
   */
  block(slot: number): string {
    return getBlockUrl(slot, this.cluster);
  }

  /**
   * Log transaction with explorer link (for debugging)
   */
  logTx(signature: string, label?: string): void {
    const url = this.tx(signature);
    const prefix = label ? `[${label}] ` : '';
    console.log(`${prefix}Transaction: ${signature}`);
    console.log(`${prefix}Explorer: ${url}`);
  }

  /**
   * Log Arcium computation transaction
   */
  logComputation(signature: string, computationId: string): void {
    console.log(`[Arcium] Computation: ${computationId}`);
    console.log(`[Arcium] Transaction: ${signature}`);
    console.log(`[Arcium] Explorer: ${this.tx(signature)}`);
  }

  /**
   * Log settlement transaction
   */
  logSettlement(signature: string, batchId: string): void {
    console.log(`[Settlement] Batch: ${batchId}`);
    console.log(`[Settlement] Transaction: ${signature}`);
    console.log(`[Settlement] Explorer: ${this.tx(signature)}`);
  }

  /**
   * Get URLs for Obscura core programs
   */
  getObscuraUrls(config: {
    settlementProgram?: string;
    arciumProgram?: string;
  }): {
    settlement?: string;
    arcium: string;
    lightProtocol: string;
  } {
    return {
      settlement: config.settlementProgram 
        ? this.program(config.settlementProgram) 
        : undefined,
      arcium: this.program(config.arciumProgram ?? DEVNET_PROGRAMS.ARCIUM),
      lightProtocol: this.program(DEVNET_PROGRAMS.STATE_COMPRESSION),
    };
  }
}

/**
 * Create Orb explorer instance
 */
export function createOrbExplorer(
  cluster: SolanaCluster = 'devnet'
): OrbExplorer {
  return new OrbExplorer(cluster);
}

/**
 * Default devnet explorer instance
 */
export const devnetExplorer = new OrbExplorer('devnet');

/**
 * Default mainnet explorer instance
 */
export const mainnetExplorer = new OrbExplorer('mainnet-beta');
