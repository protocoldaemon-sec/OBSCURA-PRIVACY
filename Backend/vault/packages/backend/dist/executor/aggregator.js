/**
 * Aggregator Service
 *
 * Main orchestrator that combines:
 * - SIP privacy layer with SDK integration
 * - PQ authorization (WOTS signatures)
 * - Batch building
 * - Multi-chain execution
 * - Solver quote integration
 */
import { SIP } from '@sip-protocol/sdk';
import { PQAuthService } from '../auth/service.js';
import { BatchBuilder } from './batch.js';
import { MultiChainExecutor } from './multi-chain.js';
import { toHex } from '@obscura/crypto';
/**
 * Aggregator class
 *
 * The main service that:
 * 1. Receives shielded intents with WOTS authorization
 * 2. Validates authorization off-chain
 * 3. Fetches solver quotes for best execution
 * 4. Batches valid intents
 * 5. Submits to settlement contracts
 */
export class Aggregator {
    authService;
    batchBuilder;
    executor;
    config;
    intervalId;
    sdk;
    /** Authorized intents waiting for batch */
    pendingIntents = new Map();
    /** Completed batches */
    completedBatches = new Map();
    /** Cached quotes by intent ID */
    quoteCache = new Map();
    constructor(config, authService) {
        this.config = config;
        this.authService = authService ?? new PQAuthService();
        this.batchBuilder = new BatchBuilder(config.batch);
        this.executor = new MultiChainExecutor(config.executor);
        // Initialize SDK for quote fetching
        this.sdk = new SIP({ network: config.network ?? 'mainnet' });
        // Set up batch ready callback
        this.batchBuilder.onReady(batch => this.handleBatchReady(batch));
        // Start auto-submit if enabled
        if (config.autoSubmit) {
            this.startAutoSubmit();
        }
    }
    /**
     * Submit a shielded intent with WOTS authorization
     */
    submitIntent(shielded, wotsAuth) {
        // Authorize the intent
        const { authorized, result } = this.authService.authorizeIntent(shielded, wotsAuth);
        if (!result.valid) {
            return {
                success: false,
                error: result.error
            };
        }
        // Generate intent ID
        const intentId = toHex(shielded.commitment);
        // Store authorized intent
        this.pendingIntents.set(intentId, authorized);
        // Add to batch builder
        this.batchBuilder.addIntent(authorized);
        return {
            success: true,
            intentId,
            position: this.batchBuilder.getTotalPending()
        };
    }
    /**
     * Force build and submit all pending batches
     */
    async flushBatches() {
        const batches = this.batchBuilder.buildAllBatches();
        const records = [];
        for (const batch of batches) {
            const record = await this.submitBatch(batch);
            if (record) {
                records.push(record);
            }
        }
        return records;
    }
    /**
     * Submit a batch to settlement
     */
    async submitBatch(batch) {
        const result = await this.executor.submitBatch(batch);
        if (result.success && result.txHash) {
            this.completedBatches.set(batch.batchId, batch);
            return {
                batchId: batch.batchId,
                chain: batch.targetChain,
                txHash: result.txHash,
                blockNumber: 0,
                status: 'submitted',
                gasUsed: result.gasUsed ?? 0n,
                settledAt: Date.now()
            };
        }
        console.error(`Failed to submit batch ${batch.batchId}: ${result.error}`);
        return undefined;
    }
    /**
     * Handle batch ready callback
     */
    async handleBatchReady(batch) {
        console.log(`Batch ready: ${batch.batchId} with ${batch.count} intents for ${batch.targetChain}`);
        if (this.config.autoSubmit) {
            await this.submitBatch(batch);
        }
    }
    /**
     * Start automatic batch submission
     */
    startAutoSubmit() {
        const interval = this.config.batchInterval ?? 30000; // 30 seconds default
        this.intervalId = setInterval(() => {
            const expired = this.batchBuilder.checkExpiredBatches();
            for (const batch of expired) {
                this.submitBatch(batch);
            }
        }, interval);
    }
    /**
     * Stop automatic batch submission
     */
    stopAutoSubmit() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }
    /**
     * Register a WOTS key pool
     */
    registerPool(merkleRoot, params, totalKeys, owner) {
        this.authService.registerPool(merkleRoot, params, totalKeys, owner);
    }
    // ============ Solver Quote Integration ============
    /**
     * Fetch quotes from solver network
     *
     * Uses @sip-protocol/sdk to query NEAR Intents solver network
     * for the best execution prices
     */
    async getQuotes(request) {
        if (!this.config.enableQuotes) {
            return [];
        }
        try {
            // Build SDK intent for quote request
            const intent = await this.sdk
                .intent()
                .input(request.sourceChain, request.inputAsset, request.amount)
                .output(request.targetChain, request.outputAsset)
                .build();
            // Fetch quotes from solver network
            const sdkQuotes = await this.sdk.getQuotes(intent);
            // Convert to our format
            return sdkQuotes.map((q, i) => this.convertQuote(q, i));
        }
        catch (error) {
            console.error('Failed to fetch quotes:', error);
            return [];
        }
    }
    /**
     * Get best quote for a request
     */
    async getBestQuote(request) {
        const quotes = await this.getQuotes(request);
        if (quotes.length === 0)
            return null;
        // Sort by output amount (descending) - best value first
        quotes.sort((a, b) => Number(b.outputAmount - a.outputAmount));
        return quotes[0];
    }
    /**
     * Execute with a specific quote
     */
    async executeWithQuote(shielded, wotsAuth, quote) {
        // First authorize the intent
        const submitResult = this.submitIntent(shielded, wotsAuth);
        if (!submitResult.success) {
            return submitResult;
        }
        // If quote requires direct execution (bypass batching)
        if (quote.calldata) {
            // Direct solver execution
            try {
                const result = await this.executor.executeDirectWithQuote(shielded, quote);
                return {
                    ...submitResult,
                    quote,
                };
            }
            catch (error) {
                return {
                    success: false,
                    error: `Quote execution failed: ${error}`,
                };
            }
        }
        // Otherwise, proceed with normal batching
        return {
            ...submitResult,
            quote,
        };
    }
    /**
     * Convert SDK quote to our format
     */
    convertQuote(sdkQuote, index) {
        return {
            id: sdkQuote.quoteId ?? `quote-${Date.now()}-${index}`,
            solverId: sdkQuote.solverId ?? 'unknown',
            inputAmount: BigInt(0), // SDK Quote doesn't have inputAmount
            outputAmount: BigInt(sdkQuote.outputAmount ?? 0),
            fee: BigInt(sdkQuote.fee ?? 0),
            gasEstimate: BigInt(0), // SDK Quote doesn't have gasEstimate
            expiresAt: sdkQuote.expiry ?? Date.now() + 60000,
            estimatedTime: sdkQuote.estimatedTime ?? 60,
            solverReputation: 0, // SDK Quote doesn't have reputation
        };
    }
    /**
     * Get intent status
     */
    getIntentStatus(intentId) {
        // Check pending
        if (this.pendingIntents.has(intentId)) {
            return { status: 'pending' };
        }
        // Check completed batches
        for (const [batchId, batch] of this.completedBatches) {
            const commitment = batch.commitments.find(c => toHex(c) === intentId);
            if (commitment) {
                // checkSettlementStatus is async but we need sync result here
                // In production, this would be cached
                return {
                    status: 'batched',
                    batchId
                };
            }
        }
        return { status: 'unknown' };
    }
    /**
     * Get all pending batches
     */
    getPendingBatches() {
        return this.batchBuilder.getAllPendingBatches();
    }
    /**
     * Get batch by ID
     */
    getBatch(batchId) {
        return this.completedBatches.get(batchId) ??
            this.batchBuilder.getBatchById(batchId);
    }
    /**
     * Get aggregator statistics
     */
    getStats() {
        return {
            pendingIntents: this.pendingIntents.size,
            pendingBatches: this.batchBuilder.getPendingCounts(),
            completedBatches: this.completedBatches.size,
            supportedChains: this.executor.getSupportedChains()
        };
    }
    /**
     * Get auth service for direct access
     */
    getAuthService() {
        return this.authService;
    }
    /**
     * Get executor for direct access
     */
    getExecutor() {
        return this.executor;
    }
    /**
     * Shutdown aggregator
     */
    shutdown() {
        this.stopAutoSubmit();
    }
}
//# sourceMappingURL=aggregator.js.map