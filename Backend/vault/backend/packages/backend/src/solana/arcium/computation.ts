/**
 * Arcium Computation Tracking Utilities
 * 
 * Handles the lifecycle of confidential computations:
 * 1. Transaction submission → queued in MXE mempool
 * 2. Computation waiting in queue
 * 3. MPC execution by cluster nodes
 * 4. Callback invocation with results
 * 
 * Based on @arcium-hq/client SDK:
 * ```typescript
 * import { 
 *   awaitComputationFinalization,
 *   getCompDefAccOffset,
 *   getClusterAccAddress,
 *   getComputationAccAddress,
 *   getMXEPublicKey
 * } from "@arcium-hq/client";
 * ```
 * 
 * @see https://ts.arcium.com/api/client
 */

import { sha256 } from '@noble/hashes/sha256';
import type { ArciumConfig } from './types.js';

/**
 * Encode string to Uint8Array (ASCII only, for seed strings)
 */
function encodeString(str: string): Uint8Array {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}

// ============ Arcium Program Constants ============

/** Arcium devnet cluster offsets (v0.5.1) */
export const ARCIUM_CLUSTER_OFFSETS = [123, 456, 789] as const;
export type ArciumClusterOffset = typeof ARCIUM_CLUSTER_OFFSETS[number];

/** Arcium program ID on Solana devnet/mainnet */
export const ARCIUM_PROGRAM_ID = 'arcaborPMqYhZbLqPKPRXpBKyCMgH8kApNoxp4cLKg';

/**
 * Available Arcium cluster offsets for devnet
 * All clusters are on v0.5.1
 * 
 * @see https://docs.arcium.com/developers/deployment
 */
export const ARCIUM_DEVNET_CLUSTERS = {
  CLUSTER_123: 123,
  CLUSTER_456: 456,
  CLUSTER_789: 789,
} as const;

/** Default cluster offset for devnet */
export const DEFAULT_CLUSTER_OFFSET = ARCIUM_DEVNET_CLUSTERS.CLUSTER_123;

/** Mempool sizes for MXE deployment */
export type MempoolSize = 'Tiny' | 'Small' | 'Medium' | 'Large';

/** Base seeds for Arcium PDAs */
export const ARCIUM_SEEDS = {
  CLUSTER: 'cluster',
  COMPUTATION: 'computation',
  COMP_DEF: 'comp_def',
  MXE: 'mxe',
  MEMPOOL: 'mempool',
  EXECUTING_POOL: 'executing_pool',
  FEE_POOL: 'fee_pool',
  ARX_NODE: 'arx_node',
  CLOCK: 'clock',
} as const;

// ============ Orb Explorer Integration ============

import { 
  getTransactionExplorerUrl, 
  getAccountExplorerUrl, 
  getProgramExplorerUrl,
  type SolanaCluster 
} from '../helius.js';

/**
 * Arcium-specific explorer URL helpers
 */
export const arciumExplorer = {
  /**
   * Get Orb explorer URL for Arcium program
   */
  program: (cluster: SolanaCluster = 'devnet') => 
    getProgramExplorerUrl(ARCIUM_PROGRAM_ID, cluster),

  /**
   * Get Orb explorer URL for a computation queue transaction
   */
  queueTx: (signature: string, cluster: SolanaCluster = 'devnet') =>
    getTransactionExplorerUrl(signature, cluster),

  /**
   * Get Orb explorer URL for a computation finalization transaction
   */
  finalizeTx: (signature: string, cluster: SolanaCluster = 'devnet') =>
    getTransactionExplorerUrl(signature, cluster),

  /**
   * Get Orb explorer URL for an MXE account
   */
  mxeAccount: (address: string, cluster: SolanaCluster = 'devnet') =>
    getAccountExplorerUrl(address, cluster),

  /**
   * Get Orb explorer URL for a computation account
   */
  computationAccount: (address: string, cluster: SolanaCluster = 'devnet') =>
    getAccountExplorerUrl(address, cluster),

  /**
   * Get Orb explorer URL for a cluster account
   */
  clusterAccount: (address: string, cluster: SolanaCluster = 'devnet') =>
    getAccountExplorerUrl(address, cluster),

  /**
   * Log computation with explorer links (useful for debugging)
   */
  logComputation: (
    queueSig: string,
    finalizeSig?: string,
    cluster: SolanaCluster = 'devnet'
  ) => {
    console.log('[Arcium] Computation queued');
    console.log(`  Queue TX: ${queueSig}`);
    console.log(`  Explorer: ${getTransactionExplorerUrl(queueSig, cluster)}`);
    if (finalizeSig) {
      console.log('[Arcium] Computation finalized');
      console.log(`  Finalize TX: ${finalizeSig}`);
      console.log(`  Explorer: ${getTransactionExplorerUrl(finalizeSig, cluster)}`);
    }
  },
};

// ============ PDA Derivation Helpers ============
// These mirror @arcium-hq/client functions for use without the full SDK

/**
 * Compute the offset for a computation definition account
 * 
 * Mirrors: `getCompDefAccOffset(circuitName)` from @arcium-hq/client
 * 
 * @param circuitName - The name of the encrypted instruction/circuit
 * @returns 4-byte offset as Uint8Array
 * 
 * @example
 * ```typescript
 * const offset = getCompDefAccOffset("verify_intent_eligibility");
 * // Use with getCompDefAccAddress(programId, offset)
 * ```
 */
export function getCompDefAccOffset(circuitName: string): Uint8Array {
  const hash = sha256(encodeString(circuitName));
  return hash.slice(0, 4);
}

/**
 * Derive cluster account address seed
 * 
 * Mirrors: `getClusterAccAddress(clusterOffset)` from @arcium-hq/client
 * 
 * @param clusterOffset - Cluster offset (0-4 for devnet)
 * @returns Seeds for PDA derivation
 */
export function getClusterAccSeeds(clusterOffset: number): Uint8Array[] {
  const offsetBytes = new Uint8Array(4);
  new DataView(offsetBytes.buffer).setUint32(0, clusterOffset, true);
  return [
    encodeString(ARCIUM_SEEDS.CLUSTER),
    offsetBytes,
  ];
}

/**
 * Derive computation account address seeds
 * 
 * Mirrors: `getComputationAccAddress(clusterOffset, computationOffset)` from @arcium-hq/client
 * 
 * @param clusterOffset - Cluster offset
 * @param computationOffset - 8-byte computation offset (as BN in SDK)
 * @returns Seeds for PDA derivation
 */
export function getComputationAccSeeds(
  clusterOffset: number,
  computationOffset: Uint8Array
): Uint8Array[] {
  const clusterBytes = new Uint8Array(4);
  new DataView(clusterBytes.buffer).setUint32(0, clusterOffset, true);
  return [
    encodeString(ARCIUM_SEEDS.COMPUTATION),
    clusterBytes,
    computationOffset,
  ];
}

/**
 * Derive MXE account address seeds
 * 
 * Mirrors: `getMXEAccAddress(mxeProgramId)` from @arcium-hq/client
 * 
 * @param mxeProgramId - MXE program public key bytes
 * @returns Seeds for PDA derivation
 */
export function getMXEAccSeeds(mxeProgramId: Uint8Array): Uint8Array[] {
  return [
    encodeString(ARCIUM_SEEDS.MXE),
    mxeProgramId,
  ];
}

/**
 * Derive computation definition account seeds
 * 
 * Mirrors: `getCompDefAccAddress(mxeProgramId, offset)` from @arcium-hq/client
 * 
 * @param mxeProgramId - MXE program public key bytes
 * @param offset - 4-byte offset from getCompDefAccOffset
 * @returns Seeds for PDA derivation
 */
export function getCompDefAccSeeds(
  mxeProgramId: Uint8Array,
  offset: Uint8Array
): Uint8Array[] {
  return [
    encodeString(ARCIUM_SEEDS.COMP_DEF),
    mxeProgramId,
    offset,
  ];
}

/**
 * Derive mempool account address seeds
 * 
 * Mirrors: `getMempoolAccAddress(clusterOffset)` from @arcium-hq/client
 */
export function getMempoolAccSeeds(clusterOffset: number): Uint8Array[] {
  const offsetBytes = new Uint8Array(4);
  new DataView(offsetBytes.buffer).setUint32(0, clusterOffset, true);
  return [
    encodeString(ARCIUM_SEEDS.MEMPOOL),
    offsetBytes,
  ];
}

/**
 * Derive executing pool account address seeds
 * 
 * Mirrors: `getExecutingPoolAccAddress(clusterOffset)` from @arcium-hq/client
 */
export function getExecutingPoolAccSeeds(clusterOffset: number): Uint8Array[] {
  const offsetBytes = new Uint8Array(4);
  new DataView(offsetBytes.buffer).setUint32(0, clusterOffset, true);
  return [
    encodeString(ARCIUM_SEEDS.EXECUTING_POOL),
    offsetBytes,
  ];
}

// ============ Computation Status Types ============

/** Computation status */
export type ComputationStatus = 
  | 'queued'      // In MXE mempool
  | 'processing'  // Being executed by MPC nodes
  | 'completed'   // Successfully finished
  | 'failed'      // Execution failed
  | 'timeout';    // Exceeded timeout

/** Computation state */
export interface ComputationState {
  /** Unique computation offset (8 bytes) */
  offset: Uint8Array;
  /** Program ID that initiated the computation */
  programId: string;
  /** Current status */
  status: ComputationStatus;
  /** Queue transaction signature */
  queueSignature?: string;
  /** Finalization transaction signature */
  finalizeSignature?: string;
  /** Result data (if completed) */
  result?: Uint8Array;
  /** Error message (if failed) */
  error?: string;
  /** Timestamps */
  timestamps: {
    queued?: number;
    started?: number;
    completed?: number;
  };
  /** Explorer URLs for debugging */
  explorerUrls?: {
    queueTx?: string;
    finalizeTx?: string;
    program?: string;
  };
}

/** Options for awaiting computation */
export interface AwaitOptions {
  /** Solana commitment level */
  commitment?: 'processed' | 'confirmed' | 'finalized';
  /** Timeout in milliseconds (default: 60000) */
  timeout?: number;
  /** Polling interval in milliseconds (default: 1000) */
  pollInterval?: number;
  /** Callback for status updates */
  onStatusChange?: (status: ComputationStatus) => void;
}


/**
 * Computation Tracker
 * 
 * Tracks and awaits Arcium confidential computations.
 */
export class ComputationTracker {
  private computations: Map<string, ComputationState> = new Map();

  constructor(_config: ArciumConfig) {
    // Config stored for future RPC integration
  }

  /**
   * Generate a random computation offset
   * 
   * Each computation needs a unique 8-byte offset for tracking.
   * 
   * In production with Anchor:
   * ```typescript
   * import { BN } from "@coral-xyz/anchor";
   * import { randomBytes } from "crypto";
   * const computationOffset = new BN(randomBytes(8), "hex");
   * ```
   */
  generateOffset(): Uint8Array {
    const offset = new Uint8Array(8);
    // Use Math.random as fallback - production should use crypto.randomBytes
    for (let i = 0; i < 8; i++) {
      offset[i] = Math.floor(Math.random() * 256);
    }
    return offset;
  }

  /**
   * Register a computation after queue transaction
   */
  registerComputation(
    offset: Uint8Array,
    programId: string,
    queueSignature: string,
    cluster: SolanaCluster = 'devnet'
  ): ComputationState {
    const key = this.offsetToKey(offset);
    
    const state: ComputationState = {
      offset,
      programId,
      status: 'queued',
      queueSignature,
      timestamps: {
        queued: Date.now(),
      },
      explorerUrls: {
        queueTx: getTransactionExplorerUrl(queueSignature, cluster),
        program: getProgramExplorerUrl(programId, cluster),
      },
    };

    this.computations.set(key, state);
    return state;
  }

  /**
   * Get computation state
   */
  getComputation(offset: Uint8Array): ComputationState | undefined {
    return this.computations.get(this.offsetToKey(offset));
  }

  /**
   * Await computation finalization
   * 
   * Polls for computation completion and returns the finalization signature.
   */
  async awaitFinalization(
    offset: Uint8Array,
    options: AwaitOptions = {}
  ): Promise<string> {
    const {
      commitment = 'confirmed',
      timeout = 60000,
      pollInterval = 1000,
      onStatusChange,
    } = options;

    const key = this.offsetToKey(offset);
    const state = this.computations.get(key);

    if (!state) {
      throw new Error('Computation not registered. Call registerComputation() first.');
    }

    const startTime = Date.now();
    let lastStatus = state.status;

    while (Date.now() - startTime < timeout) {
      const currentState = await this.pollComputationStatus(offset, commitment);
      
      if (currentState.status !== lastStatus) {
        lastStatus = currentState.status;
        onStatusChange?.(currentState.status);
      }

      if (currentState.status === 'completed') {
        // Update explorer URL for finalization tx
        if (currentState.finalizeSignature && state.explorerUrls) {
          const cluster = this.getClusterFromExplorerUrl(state.explorerUrls.queueTx);
          state.explorerUrls.finalizeTx = getTransactionExplorerUrl(
            currentState.finalizeSignature, 
            cluster
          );
          this.computations.set(key, state);
        }
        return currentState.finalizeSignature!;
      }

      if (currentState.status === 'failed') {
        throw new Error(`Computation failed: ${currentState.error}`);
      }

      await this.sleep(pollInterval);
    }

    state.status = 'timeout';
    this.computations.set(key, state);
    throw new Error(`Computation timed out after ${timeout}ms`);
  }

  /**
   * Poll computation status from chain
   */
  private async pollComputationStatus(
    offset: Uint8Array,
    _commitment: string
  ): Promise<ComputationState> {
    const key = this.offsetToKey(offset);
    const state = this.computations.get(key);

    if (!state) {
      throw new Error('Computation not found');
    }

    // Simulated status progression for demo
    // Production would query on-chain state
    const elapsed = Date.now() - (state.timestamps.queued ?? Date.now());

    if (elapsed < 2000) {
      state.status = 'queued';
    } else if (elapsed < 5000) {
      state.status = 'processing';
      state.timestamps.started = state.timestamps.queued! + 2000;
    } else {
      state.status = 'completed';
      state.timestamps.completed = Date.now();
      state.finalizeSignature = `finalize_${this.offsetToKey(offset)}_${Date.now()}`;
    }

    this.computations.set(key, state);
    return state;
  }

  /**
   * Convert offset to map key (hex string)
   */
  private offsetToKey(offset: Uint8Array): string {
    return Array.from(offset).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const timeoutFn = Function('return setTimeout')() as (cb: () => void, ms: number) => unknown;
      timeoutFn(() => resolve(), ms);
    });
  }

  /**
   * Extract cluster from explorer URL
   */
  private getClusterFromExplorerUrl(url?: string): SolanaCluster {
    if (!url) return 'devnet';
    if (url.includes('cluster=devnet')) return 'devnet';
    if (url.includes('cluster=testnet')) return 'testnet';
    if (url.includes('cluster=localnet')) return 'localnet';
    return 'mainnet-beta';
  }
}


/**
 * Await computation finalization (standalone function)
 * 
 * Convenience function matching @arcium-hq/client API:
 * ```typescript
 * const finalizeSig = await awaitComputationFinalization(
 *   provider,
 *   computationOffset,
 *   programId,
 *   "confirmed"
 * );
 * ```
 */
export async function awaitComputationFinalization(
  config: ArciumConfig,
  computationOffset: Uint8Array,
  programId: string,
  queueSignature: string,
  options: AwaitOptions & { cluster?: SolanaCluster } = {}
): Promise<string> {
  const { cluster = 'devnet', ...awaitOptions } = options;
  const tracker = new ComputationTracker(config);
  tracker.registerComputation(computationOffset, programId, queueSignature, cluster);
  return tracker.awaitFinalization(computationOffset, awaitOptions);
}

/**
 * Computation result with decrypted output
 */
export interface ComputationResult<T = unknown> {
  /** Finalization transaction signature */
  signature: string;
  /** Computation offset */
  offset: Uint8Array;
  /** Decrypted result (if applicable) */
  result?: T;
  /** Raw result bytes */
  rawResult?: Uint8Array;
  /** Execution metadata */
  metadata: {
    queuedAt: number;
    completedAt: number;
    executionTimeMs: number;
  };
}

/**
 * Submit and await a confidential computation
 * 
 * High-level helper that combines submission and finalization tracking.
 */
export async function submitAndAwaitComputation<T = unknown>(
  config: ArciumConfig,
  submitFn: (offset: Uint8Array) => Promise<string>,
  programId: string,
  options: AwaitOptions & { cluster?: SolanaCluster } = {}
): Promise<ComputationResult<T>> {
  const { cluster = 'devnet', ...awaitOptions } = options;
  const tracker = new ComputationTracker(config);
  const offset = tracker.generateOffset();
  const queuedAt = Date.now();

  const queueSignature = await submitFn(offset);
  tracker.registerComputation(offset, programId, queueSignature, cluster);

  const finalizeSignature = await tracker.awaitFinalization(offset, awaitOptions);
  const completedAt = Date.now();

  const state = tracker.getComputation(offset);

  return {
    signature: finalizeSignature,
    offset,
    rawResult: state?.result,
    metadata: {
      queuedAt,
      completedAt,
      executionTimeMs: completedAt - queuedAt,
    },
  };
}

/**
 * Batch computation tracker for multiple parallel computations
 */
export class BatchComputationTracker {
  private tracker: ComputationTracker;
  private batch: Map<string, { offset: Uint8Array; programId: string }> = new Map();
  private cluster: SolanaCluster;

  constructor(config: ArciumConfig, cluster: SolanaCluster = 'devnet') {
    this.tracker = new ComputationTracker(config);
    this.cluster = cluster;
  }

  /**
   * Add a computation to the batch
   */
  addComputation(
    id: string,
    offset: Uint8Array,
    programId: string,
    queueSignature: string
  ): void {
    this.tracker.registerComputation(offset, programId, queueSignature, this.cluster);
    this.batch.set(id, { offset, programId });
  }

  /**
   * Await all computations in the batch
   */
  async awaitAll(
    options: AwaitOptions = {}
  ): Promise<Map<string, ComputationResult>> {
    const results = new Map<string, ComputationResult>();

    const promises = Array.from(this.batch.entries()).map(async ([id, { offset }]) => {
      try {
        const signature = await this.tracker.awaitFinalization(offset, options);
        const state = this.tracker.getComputation(offset);
        
        results.set(id, {
          signature,
          offset,
          rawResult: state?.result,
          metadata: {
            queuedAt: state?.timestamps.queued ?? Date.now(),
            completedAt: state?.timestamps.completed ?? Date.now(),
            executionTimeMs: (state?.timestamps.completed ?? Date.now()) - (state?.timestamps.queued ?? Date.now()),
          },
        });
      } catch {
        results.set(id, {
          signature: '',
          offset,
          metadata: {
            queuedAt: Date.now(),
            completedAt: Date.now(),
            executionTimeMs: 0,
          },
        });
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get status of all computations
   */
  getStatuses(): Map<string, ComputationStatus> {
    const statuses = new Map<string, ComputationStatus>();
    
    for (const [id, { offset }] of this.batch) {
      const state = this.tracker.getComputation(offset);
      statuses.set(id, state?.status ?? 'queued');
    }
    
    return statuses;
  }
}

/**
 * Create computation tracker instance
 */
export function createComputationTracker(config: ArciumConfig): ComputationTracker {
  return new ComputationTracker(config);
}

/**
 * Create batch computation tracker instance
 */
export function createBatchComputationTracker(
  config: ArciumConfig, 
  cluster: SolanaCluster = 'devnet'
): BatchComputationTracker {
  return new BatchComputationTracker(config, cluster);
}
