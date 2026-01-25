/**
 * Multi-Chain Executor
 *
 * Handles settlement across EVM and Solana chains
 *
 * Integrations:
 * - Helius: Enhanced Solana RPC with priority fees
 * - ZK Compression: Compressed settlement record storage
 * - Arcium: Confidential batch optimization (optional)
 */
import type { BatchCommitment, SettlementRecord, ChainId, SettlementStatus, ShieldedIntent, SelectedQuote } from '../types.js';
import { HeliusClient } from '../solana/helius.js';
import { ZKCompressionClient, type CompressedSettlementRecord } from '../solana/zk-compression.js';
import { ArciumClient } from '../solana/arcium/index.js';
/** Chain configuration */
export interface ChainConfig {
    chainId: ChainId;
    rpcUrl: string;
    contractAddress: string;
    type: 'evm' | 'solana';
    confirmations: number;
    /** Use Helius for Solana chains */
    useHelius?: boolean;
    /** Use ZK Compression for settlement records */
    useCompression?: boolean;
}
/** Executor configuration */
export interface ExecutorConfig {
    chains: ChainConfig[];
    privateKey?: string;
    quorumRequired?: number;
    /** Enable Helius integration for Solana */
    enableHelius?: boolean;
    /** Enable ZK Compression for settlement records */
    enableCompression?: boolean;
    /** Enable Arcium confidential computing */
    enableArcium?: boolean;
}
/** Submission result */
export interface SubmissionResult {
    success: boolean;
    txHash?: string;
    error?: string;
    gasUsed?: bigint;
    /** Compressed record reference (if compression enabled) */
    compressedRecord?: CompressedSettlementRecord;
    /** Priority fee used (Solana with Helius) */
    priorityFee?: number;
}
/**
 * Multi-Chain Executor class
 *
 * Handles settlement across EVM and Solana chains with integrations:
 * - Helius: Priority fees, webhooks, enhanced APIs
 * - ZK Compression: Compressed settlement record storage
 * - Arcium: Confidential batch optimization
 */
export declare class MultiChainExecutor {
    protected chains: Map<ChainId, ChainConfig>;
    protected pendingSettlements: Map<string, SettlementRecord>;
    protected heliusClient: HeliusClient | null;
    protected compressionClient: ZKCompressionClient | null;
    protected arciumClient: ArciumClient | null;
    constructor(config: ExecutorConfig);
    /**
     * Get Helius client for direct access
     */
    getHeliusClient(): HeliusClient | null;
    /**
     * Get ZK Compression client for direct access
     */
    getCompressionClient(): ZKCompressionClient | null;
    /**
     * Get Arcium client for direct access
     */
    getArciumClient(): ArciumClient | null;
    /**
     * Submit a batch for settlement
     */
    submitBatch(batch: BatchCommitment): Promise<SubmissionResult>;
    /**
     * Submit to EVM chain
     */
    protected submitToEVM(batch: BatchCommitment, config: ChainConfig): Promise<SubmissionResult>;
    /**
     * Submit to Solana
     *
     * Uses Helius for priority fees and ZK Compression for record storage
     */
    protected submitToSolana(batch: BatchCommitment, config: ChainConfig): Promise<SubmissionResult>;
    /**
     * Check settlement status
     */
    checkSettlementStatus(batchId: string): Promise<SettlementRecord | undefined>;
    /**
     * Update settlement status (called after confirmation)
     */
    updateSettlementStatus(batchId: string, status: SettlementStatus, blockNumber?: number): void;
    /**
     * Get all pending settlements
     */
    getPendingSettlements(): SettlementRecord[];
    /**
     * Get chain config
     */
    getChainConfig(chainId: ChainId): ChainConfig | undefined;
    /**
     * Get supported chains
     */
    getSupportedChains(): ChainId[];
    /**
     * Execute directly with a solver quote (bypasses batching)
     *
     * Used when a quote provides direct calldata for immediate execution
     */
    executeDirectWithQuote(shielded: ShieldedIntent, quote: SelectedQuote): Promise<SubmissionResult>;
    /**
     * Execute quote on EVM chain
     */
    protected executeQuoteOnEVM(_shielded: ShieldedIntent, quote: SelectedQuote, config: ChainConfig): Promise<SubmissionResult>;
    /**
     * Execute quote on Solana
     *
     * Uses Helius smart transactions for optimal execution
     */
    protected executeQuoteOnSolana(_shielded: ShieldedIntent, quote: SelectedQuote, config: ChainConfig): Promise<SubmissionResult>;
}
//# sourceMappingURL=multi-chain.d.ts.map