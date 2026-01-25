/**
 * Key Index Registry
 *
 * Tracks used WOTS key indices across all registered pools
 * Prevents key reuse (which would break security)
 */
import type { Hash } from '@obscura/crypto';
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
export declare class KeyIndexRegistry {
    /** Map of poolRoot -> Set of used indices */
    private usedIndices;
    /** Detailed usage records for auditing */
    private usageRecords;
    /**
     * Check if a key index has been used
     */
    isKeyUsed(poolRoot: Hash, keyIndex: number): boolean;
    /**
     * Mark a key index as used
     *
     * @throws Error if key has already been used
     */
    markKeyUsed(poolRoot: Hash, keyIndex: number, intentHash: Hash): void;
    /**
     * Get usage record for a key
     */
    getKeyUsageRecord(poolRoot: Hash, keyIndex: number): KeyUsageRecord | undefined;
    /**
     * Update settlement info for a key usage
     */
    markSettled(poolRoot: Hash, keyIndex: number, txHash: string): void;
    /**
     * Get all used indices for a pool
     */
    getUsedIndices(poolRoot: Hash): number[];
    /**
     * Get count of used keys in a pool
     */
    getUsedCount(poolRoot: Hash): number;
    /**
     * Check if a pool is registered (has any usage)
     */
    isPoolKnown(poolRoot: Hash): boolean;
    /**
     * Register a new pool (optional, for tracking)
     */
    registerPool(poolRoot: Hash): void;
    /**
     * Export state for persistence
     */
    exportState(): {
        pools: Array<{
            root: string;
            usedIndices: number[];
        }>;
        records: KeyUsageRecord[];
    };
    /**
     * Import state from persistence
     */
    importState(state: {
        pools: Array<{
            root: string;
            usedIndices: number[];
        }>;
        records: KeyUsageRecord[];
    }): void;
    /**
     * Clear all data (use with caution!)
     */
    clear(): void;
}
export {};
//# sourceMappingURL=registry.d.ts.map