/**
 * Batch Builder
 *
 * Builds Merkle commitment batches from authorized intents
 */
import { MerkleTree, toHex, randomBytes } from '@obscura/crypto';
/**
 * Batch Builder class
 *
 * Collects authorized intents and builds Merkle commitments
 */
export class BatchBuilder {
    config;
    pendingByChain = new Map();
    onBatchReady;
    constructor(config) {
        this.config = {
            maxBatchSize: config?.maxBatchSize ?? 100,
            maxWaitTime: config?.maxWaitTime ?? 60000, // 1 minute
            minBatchSize: config?.minBatchSize ?? 1
        };
    }
    /**
     * Set callback for when a batch is ready
     */
    onReady(callback) {
        this.onBatchReady = callback;
    }
    /**
     * Add an authorized intent to the batch queue
     */
    addIntent(intent) {
        const chain = intent.shielded.targetChainHint ?? 'ethereum';
        let pending = this.pendingByChain.get(chain);
        if (!pending) {
            pending = [];
            this.pendingByChain.set(chain, pending);
        }
        pending.push({ intent, addedAt: Date.now() });
        // Check if we should build a batch
        if (pending.length >= this.config.maxBatchSize) {
            this.buildBatch(chain);
        }
    }
    /**
     * Build a batch for a specific chain
     */
    buildBatch(chain) {
        const pending = this.pendingByChain.get(chain);
        if (!pending || pending.length < this.config.minBatchSize) {
            return null;
        }
        // Take up to maxBatchSize intents
        const toProcess = pending.splice(0, this.config.maxBatchSize);
        // Extract commitments
        const commitments = toProcess.map(p => p.intent.shielded.commitment);
        // Build Merkle tree
        const tree = MerkleTree.fromLeaves(commitments);
        // Generate proofs
        const proofs = commitments.map((_, i) => tree.getProof(i));
        const batch = {
            batchId: toHex(randomBytes(16)),
            batchRoot: tree.root,
            commitments,
            proofs,
            targetChain: chain,
            createdAt: Date.now(),
            count: commitments.length
        };
        // Notify callback
        if (this.onBatchReady) {
            this.onBatchReady(batch);
        }
        return batch;
    }
    /**
     * Build all pending batches
     */
    buildAllBatches() {
        const batches = [];
        for (const chain of this.pendingByChain.keys()) {
            const batch = this.buildBatch(chain);
            if (batch) {
                batches.push(batch);
            }
        }
        return batches;
    }
    /**
     * Check for expired batches (past max wait time)
     */
    checkExpiredBatches() {
        const now = Date.now();
        const batches = [];
        for (const [chain, pending] of this.pendingByChain) {
            if (pending.length > 0) {
                const oldest = pending[0].addedAt;
                if (now - oldest >= this.config.maxWaitTime) {
                    const batch = this.buildBatch(chain);
                    if (batch) {
                        batches.push(batch);
                    }
                }
            }
        }
        return batches;
    }
    /**
     * Get pending count by chain
     */
    getPendingCounts() {
        const counts = new Map();
        for (const [chain, pending] of this.pendingByChain) {
            counts.set(chain, pending.length);
        }
        return counts;
    }
    /**
     * Get total pending count
     */
    getTotalPending() {
        let total = 0;
        for (const pending of this.pendingByChain.values()) {
            total += pending.length;
        }
        return total;
    }
    /**
     * Get all pending batches as BatchCommitment objects (preview without building)
     */
    getAllPendingBatches() {
        const batches = [];
        for (const [chain, pending] of this.pendingByChain) {
            if (pending.length >= this.config.minBatchSize) {
                const commitments = pending.map(p => p.intent.shielded.commitment);
                const tree = MerkleTree.fromLeaves(commitments);
                const proofs = commitments.map((_, i) => tree.getProof(i));
                batches.push({
                    batchId: `pending-${chain}-${Date.now()}`,
                    batchRoot: tree.root,
                    commitments,
                    proofs,
                    targetChain: chain,
                    createdAt: pending[0]?.addedAt ?? Date.now(),
                    count: commitments.length
                });
            }
        }
        return batches;
    }
    /**
     * Get batch by ID (for pending batches, returns undefined as they don't have IDs yet)
     */
    getBatchById(_batchId) {
        // Pending batches don't have IDs until they are built
        // This is used for completed batches only
        return undefined;
    }
    /**
     * Clear all pending intents (use with caution)
     */
    clear() {
        this.pendingByChain.clear();
    }
}
/**
 * Verify a commitment is in a batch
 */
export function verifyBatchInclusion(batch, commitment, proof) {
    // Reconstruct tree and verify
    const tree = MerkleTree.fromLeaves(batch.commitments);
    return tree.verifyProof(proof, commitment, batch.batchRoot);
}
//# sourceMappingURL=batch.js.map