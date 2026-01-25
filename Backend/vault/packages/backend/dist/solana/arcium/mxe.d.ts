/**
 * MXE (Multi-Party Execution Environment) Client
 *
 * Handles MPC computations on encrypted data:
 * - Confidential auctions for solver selection
 * - Private batch optimization
 * - Encrypted quote comparison
 * - Threshold decryption for settlement
 */
import type { ArciumConfig, MXECluster, MPCComputationRequest, MPCComputationResult, EncryptedValue, ConfidentialBid, AuctionResult, ConfidentialSwapParams } from './types.js';
/** Supported MPC computation types */
export declare enum MPCComputationType {
    /** Compare encrypted values, return index of max */
    MAX_COMPARISON = "max_comparison",
    /** Compare encrypted values, return index of min */
    MIN_COMPARISON = "min_comparison",
    /** Sum encrypted values */
    SUM = "sum",
    /** Multiply encrypted values */
    MULTIPLY = "multiply",
    /** Confidential auction - find winner without revealing bids */
    AUCTION = "auction",
    /** Batch optimization - order intents for gas efficiency */
    BATCH_OPTIMIZE = "batch_optimize",
    /** Threshold decryption - decrypt with t-of-n nodes */
    THRESHOLD_DECRYPT = "threshold_decrypt",
    /** Private set intersection */
    PSI = "psi",
    /** Confidential swap matching */
    SWAP_MATCH = "swap_match"
}
/**
 * MXE Client for Multi-Party Computation
 */
export declare class MXEClient {
    private config;
    private cluster;
    constructor(config: ArciumConfig);
    /**
     * Initialize and connect to MXE cluster
     */
    connect(): Promise<MXECluster>;
    /**
     * Get cluster public key for encryption
     */
    getClusterPublicKey(): Uint8Array;
    /**
     * Encrypt data for MPC computation
     */
    encrypt(plaintext: Uint8Array): Promise<EncryptedValue>;
    /**
     * Encrypt a bigint amount
     */
    encryptAmount(amount: bigint): Promise<EncryptedValue>;
    /**
     * Submit MPC computation request
     */
    compute(request: MPCComputationRequest): Promise<MPCComputationResult>;
    /**
     * Get computation status
     */
    getComputationStatus(computationId: string): Promise<MPCComputationResult>;
    /**
     * Run confidential auction for solver selection
     *
     * Solvers submit encrypted bids, MXE determines winner
     * without revealing individual bid amounts
     */
    runConfidentialAuction(bids: ConfidentialBid[]): Promise<AuctionResult>;
    /**
     * Compare encrypted quotes and return best one
     *
     * Used for solver quote comparison without revealing amounts
     */
    compareQuotes(quotes: Array<{
        solverId: string;
        encryptedOutput: EncryptedValue;
    }>): Promise<{
        winnerId: string;
        proof: Uint8Array;
    }>;
    /**
     * Optimize batch ordering confidentially
     *
     * Computes optimal ordering of intents without revealing
     * individual intent details
     */
    optimizeBatch(encryptedIntents: Array<{
        intentId: string;
        encryptedData: EncryptedValue;
    }>): Promise<{
        ordering: string[];
        gasSavings: bigint;
        proof: Uint8Array;
    }>;
    /**
     * Match confidential swap orders
     *
     * Finds matching buy/sell orders without revealing amounts
     */
    matchSwaps(swaps: Array<{
        orderId: string;
        params: ConfidentialSwapParams;
    }>): Promise<Array<{
        buyOrderId: string;
        sellOrderId: string;
        proof: Uint8Array;
    }>>;
    /**
     * Threshold decryption
     *
     * Decrypt a value using t-of-n MXE nodes
     * Only works if caller has authorization
     */
    thresholdDecrypt(encrypted: EncryptedValue, authorizationProof: Uint8Array): Promise<Uint8Array>;
    /**
     * Verify computation proof
     */
    verifyProof(computationId: string, proof: Uint8Array): Promise<boolean>;
    private serializeEncryptedValue;
    private parseComputationResult;
}
/**
 * Create MXE client from config
 */
export declare function createMXEClient(config: ArciumConfig): MXEClient;
//# sourceMappingURL=mxe.d.ts.map