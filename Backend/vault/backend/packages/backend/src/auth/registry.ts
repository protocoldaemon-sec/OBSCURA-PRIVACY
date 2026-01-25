/**
 * Key Index Registry
 * 
 * Tracks used WOTS key indices across all registered pools
 * Prevents key reuse (which would break security)
 */

import type { Hash } from '@obscura/crypto';
import { toHex } from '@obscura/crypto';

/** Key usage record */
interface KeyUsageRecord {
  /** Pool Merkle root */
  poolRoot: string;
  /** Key index */
  keyIndex: number;
  /** Intent hash signed with this key */
  intentHash: string;
  /** Timestamp of usage */
  usedAt: number;
  /** Transaction where this was settled (if settled) */
  settlementTx?: string;
}

/**
 * Key Index Registry class
 * 
 * Critical security component that:
 * - Tracks which key indices have been used
 * - Prevents key reuse attacks
 * - Maintains audit trail
 */
export class KeyIndexRegistry {
  /** Map of poolRoot -> Set of used indices */
  private usedIndices: Map<string, Set<number>> = new Map();
  
  /** Detailed usage records for auditing */
  private usageRecords: Map<string, KeyUsageRecord> = new Map();

  /**
   * Check if a key index has been used
   */
  isKeyUsed(poolRoot: Hash, keyIndex: number): boolean {
    const rootHex = toHex(poolRoot);
    const usedSet = this.usedIndices.get(rootHex);
    return usedSet?.has(keyIndex) ?? false;
  }

  /**
   * Mark a key index as used
   * 
   * @throws Error if key has already been used
   */
  markKeyUsed(
    poolRoot: Hash,
    keyIndex: number,
    intentHash: Hash
  ): void {
    const rootHex = toHex(poolRoot);
    const intentHex = toHex(intentHash);
    
    // Check for duplicate
    if (this.isKeyUsed(poolRoot, keyIndex)) {
      const existing = this.getKeyUsageRecord(poolRoot, keyIndex);
      throw new Error(
        `Key index ${keyIndex} in pool ${rootHex.slice(0, 16)}... has already been used ` +
        `for intent ${existing?.intentHash.slice(0, 16)}...`
      );
    }

    // Add to used set
    let usedSet = this.usedIndices.get(rootHex);
    if (!usedSet) {
      usedSet = new Set();
      this.usedIndices.set(rootHex, usedSet);
    }
    usedSet.add(keyIndex);

    // Record usage
    const recordKey = `${rootHex}:${keyIndex}`;
    this.usageRecords.set(recordKey, {
      poolRoot: rootHex,
      keyIndex,
      intentHash: intentHex,
      usedAt: Date.now()
    });
  }

  /**
   * Get usage record for a key
   */
  getKeyUsageRecord(poolRoot: Hash, keyIndex: number): KeyUsageRecord | undefined {
    const rootHex = toHex(poolRoot);
    const recordKey = `${rootHex}:${keyIndex}`;
    return this.usageRecords.get(recordKey);
  }

  /**
   * Update settlement info for a key usage
   */
  markSettled(poolRoot: Hash, keyIndex: number, txHash: string): void {
    const rootHex = toHex(poolRoot);
    const recordKey = `${rootHex}:${keyIndex}`;
    const record = this.usageRecords.get(recordKey);
    if (record) {
      record.settlementTx = txHash;
    }
  }

  /**
   * Get all used indices for a pool
   */
  getUsedIndices(poolRoot: Hash): number[] {
    const rootHex = toHex(poolRoot);
    const usedSet = this.usedIndices.get(rootHex);
    return usedSet ? Array.from(usedSet) : [];
  }

  /**
   * Get count of used keys in a pool
   */
  getUsedCount(poolRoot: Hash): number {
    const rootHex = toHex(poolRoot);
    const usedSet = this.usedIndices.get(rootHex);
    return usedSet?.size ?? 0;
  }

  /**
   * Check if a pool is registered (has any usage)
   */
  isPoolKnown(poolRoot: Hash): boolean {
    const rootHex = toHex(poolRoot);
    return this.usedIndices.has(rootHex);
  }

  /**
   * Register a new pool (optional, for tracking)
   */
  registerPool(poolRoot: Hash): void {
    const rootHex = toHex(poolRoot);
    if (!this.usedIndices.has(rootHex)) {
      this.usedIndices.set(rootHex, new Set());
    }
  }

  /**
   * Export state for persistence
   */
  exportState(): {
    pools: Array<{ root: string; usedIndices: number[] }>;
    records: KeyUsageRecord[];
  } {
    const pools: Array<{ root: string; usedIndices: number[] }> = [];
    for (const [root, indices] of this.usedIndices) {
      pools.push({ root, usedIndices: Array.from(indices) });
    }

    return {
      pools,
      records: Array.from(this.usageRecords.values())
    };
  }

  /**
   * Import state from persistence
   */
  importState(state: {
    pools: Array<{ root: string; usedIndices: number[] }>;
    records: KeyUsageRecord[];
  }): void {
    for (const pool of state.pools) {
      this.usedIndices.set(pool.root, new Set(pool.usedIndices));
    }
    for (const record of state.records) {
      const recordKey = `${record.poolRoot}:${record.keyIndex}`;
      this.usageRecords.set(recordKey, record);
    }
  }

  /**
   * Clear all data (use with caution!)
   */
  clear(): void {
    this.usedIndices.clear();
    this.usageRecords.clear();
  }
}
