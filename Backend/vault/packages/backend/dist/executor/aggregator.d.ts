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
import { PQAuthService } from '../auth/service.js';
import { MultiChainExecutor, type ExecutorConfig } from './multi-chain.js';
import type { ShieldedIntent, SettlementRecord, ChainId, QuoteRequest, SolverQuote, SelectedQuote } from '../types.js';
import type { WOTSSignedIntent, Hash } from '@obscura/crypto';
/** Aggregator configuration */
export interface AggregatorConfig {
    /** Executor configuration */
    executor: ExecutorConfig;
    /** Batch configuration */
    batch?: {
        maxBatchSize?: number;
        maxWaitTime?: number;
        minBatchSize?: number;
    };
    /** Enable automatic batch submission */
    autoSubmit?: boolean;
    /** Batch check interval (ms) */
    batchInterval?: number;
    /** SDK network (mainnet or testnet) */
    network?: 'mainnet' | 'testnet';
    /** Enable solver quote fetching */
    enableQuotes?: boolean;
    /** Quote timeout (ms) */
    quoteTimeout?: number;
}
/** Intent submission result */
export interface IntentSubmissionResult {
    success: boolean;
    intentId?: string;
    error?: string;
    batchId?: string;
    position?: number;
    /** Best quote if available */
    quote?: SolverQuote;
}
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
export declare class Aggregator {
    private authService;
    private batchBuilder;
    private executor;
    private config;
    private intervalId?;
    private sdk;
    /** Authorized intents waiting for batch */
    private pendingIntents;
    /** Completed batches */
    private completedBatches;
    /** Cached quotes by intent ID */
    private quoteCache;
    constructor(config: AggregatorConfig, authService?: PQAuthService);
    /**
     * Submit a shielded intent with WOTS authorization
     */
    submitIntent(shielded: ShieldedIntent, wotsAuth: WOTSSignedIntent): IntentSubmissionResult;
    /**
     * Force build and submit all pending batches
     */
    flushBatches(): Promise<SettlementRecord[]>;
    /**
     * Submit a batch to settlement
     */
    private submitBatch;
    /**
     * Handle batch ready callback
     */
    private handleBatchReady;
    /**
     * Start automatic batch submission
     */
    private startAutoSubmit;
    /**
     * Stop automatic batch submission
     */
    stopAutoSubmit(): void;
    /**
     * Register a WOTS key pool
     */
    registerPool(merkleRoot: Hash, params: import('@obscura/crypto').WOTSParams, totalKeys: number, owner?: string): void;
    /**
     * Get best quote for a request
     */
    getBestQuote(request: QuoteRequest): Promise<SolverQuote | null>;
    /**
     * Execute with a specific quote
     */
    executeWithQuote(shielded: ShieldedIntent, wotsAuth: WOTSSignedIntent, quote: SelectedQuote): Promise<IntentSubmissionResult>;
    /**
     * Convert SDK quote to our format
     */
    private convertQuote;
    /**
     * Get aggregator statistics
     */
    getStats(): {
        pendingIntents: number;
        pendingBatches: Map<ChainId, number>;
        completedBatches: number;
        supportedChains: ChainId[];
    };
    /**
     * Get auth service for direct access
     */
    getAuthService(): PQAuthService;
    /**
     * Get executor for direct access
     */
    getExecutor(): MultiChainExecutor;
    /**
     * Shutdown aggregator
     */
    shutdown(): void;
}
//# sourceMappingURL=aggregator.d.ts.map