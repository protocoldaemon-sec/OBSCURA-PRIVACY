/**
 * Batch Builder
 *
 * Builds Merkle commitment batches from authorized intents
 */
import type { Hash, MerkleProof } from '@obscura/crypto';
import type { AuthorizedIntent, BatchCommitment, ChainId } from '../types.js';
/** Batch configuration */
export interface BatchConfig {
    /** Maximum intents per batch */
    maxBatchSize: number;
    /** Maximum wait time before forcing batch (ms) */
    maxWaitTime: number;
    /** Minimum intents to create batch */
    minBatchSize: number;
}
/**
 * Batch Builder class
 *
 * Collects authorized intents and builds Merkle commitments
 */
export declare class BatchBuilder {
    private config;
    private pendingByChain;
    private onBatchReady?;
    constructor(config?: Partial<BatchConfig>);
    /**
     * Set callback for when a batch is ready
     */
    onReady(callback: (batch: BatchCommitment) => void): void;
    /**
     * Add an authorized intent to the batch queue
     */
    addIntent(intent: AuthorizedIntent): void;
    /**
     * Build a batch for a specific chain
     */
    buildBatch(chain: ChainId): BatchCommitment | null;
    /**
     * Build all pending batches
     */
    buildAllBatches(): BatchCommitment[];
    /**
     * Check for expired batches (past max wait time)
     */
    checkExpiredBatches(): BatchCommitment[];
    /**
     * Get pending count by chain
     */
    getPendingCounts(): Map<ChainId, number>;
    /**
     * Get total pending count
     */
    getTotalPending(): number;
    /**
     * Get all pending batches as BatchCommitment objects (preview without building)
     */
    getAllPendingBatches(): BatchCommitment[];
    /**
     * Get batch by ID (for pending batches, returns undefined as they don't have IDs yet)
     */
    getBatchById(_batchId: string): BatchCommitment | undefined;
    /**
     * Clear all pending intents (use with caution)
     */
    clear(): void;
}
/**
 * Verify a commitment is in a batch
 */
export declare function verifyBatchInclusion(batch: BatchCommitment, commitment: Hash, proof: MerkleProof): boolean;
//# sourceMappingURL=batch.d.ts.map