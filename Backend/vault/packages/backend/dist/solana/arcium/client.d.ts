/**
 * Arcium Client
 *
 * Unified client for Arcium integration combining:
 * - cSPL: Confidential token operations
 * - MXE: Multi-party computation
 * - Settlement: Confidential intent settlement
 */
import type { ArciumConfig, EncryptedValue, ViewingKey } from './types.js';
import { CSPLClient } from './cspl.js';
import { MXEClient } from './mxe.js';
import type { ShieldedIntent, SolverQuote, BatchCommitment } from '../../types.js';
/** Arcium settlement result */
export interface ArciumSettlementResult {
    /** Settlement transaction signature */
    txSignature: string;
    /** Batch ID */
    batchId: string;
    /** Proof of correct settlement */
    proof: Uint8Array;
    /** Compressed record (if using ZK compression) */
    compressedRecord?: {
        treeAddress: string;
        leafIndex: number;
    };
}
/** Confidential quote from solver */
export interface ConfidentialSolverQuote {
    /** Solver ID */
    solverId: string;
    /** Encrypted output amount */
    encryptedOutput: EncryptedValue;
    /** Encrypted fee */
    encryptedFee: EncryptedValue;
    /** Quote expiry */
    expiresAt: number;
    /** Commitment to quote */
    commitment: Uint8Array;
    /** Solver signature */
    signature: Uint8Array;
}
/**
 * Arcium Client - Main entry point for Arcium integration
 */
export declare class ArciumClient {
    private config;
    private cspl;
    private mxe;
    private connected;
    constructor(config: ArciumConfig);
    /**
     * Initialize and connect to Arcium network
     */
    connect(): Promise<void>;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Get cSPL client for direct token operations
     */
    getCSPLClient(): CSPLClient;
    /**
     * Get MXE client for direct MPC operations
     */
    getMXEClient(): MXEClient;
    /**
     * Encrypt an intent for confidential processing
     */
    encryptIntent(intent: {
        action: string;
        inputAmount: bigint;
        outputAmount: bigint;
        deadline: number;
    }): Promise<EncryptedValue>;
    /**
     * Run confidential solver auction
     *
     * Solvers submit encrypted quotes, best quote wins
     * without revealing individual amounts
     */
    runSolverAuction(quotes: ConfidentialSolverQuote[]): Promise<{
        winnerId: string;
        proof: Uint8Array;
    }>;
    /**
     * Encrypt a solver quote for confidential auction
     */
    encryptQuote(quote: SolverQuote): Promise<ConfidentialSolverQuote>;
    /**
     * Optimize batch ordering using MPC
     *
     * Computes optimal intent ordering without revealing
     * individual intent details
     */
    optimizeBatch(intents: Array<{
        id: string;
        shielded: ShieldedIntent;
    }>): Promise<{
        ordering: string[];
        gasSavings: bigint;
        proof: Uint8Array;
    }>;
    /**
     * Create confidential token account
     */
    createConfidentialAccount(mint: string, owner: string): Promise<{
        account: string;
        instruction: Uint8Array;
    }>;
    /**
     * Deposit tokens to confidential account
     */
    depositToConfidential(account: string, amount: bigint, sourceTokenAccount: string): Promise<{
        instruction: Uint8Array;
        encryptedAmount: EncryptedValue;
    }>;
    /**
     * Transfer tokens confidentially
     */
    confidentialTransfer(source: string, destination: string, amount: bigint): Promise<{
        instruction: Uint8Array;
    }>;
    /**
     * Create viewing key for selective disclosure
     */
    createViewingKey(account: string, viewerPubKey: Uint8Array, permissions: ViewingKey['permissions'], expiresAt?: number): Promise<ViewingKey>;
    /**
     * Decrypt balance using viewing key
     */
    decryptBalance(account: string, viewingKey: ViewingKey): Promise<bigint>;
    /**
     * Settle a batch using confidential computation
     *
     * Uses MPC to verify batch validity without revealing
     * individual intent details
     */
    settleConfidentialBatch(batch: BatchCommitment, encryptedIntents: EncryptedValue[]): Promise<ArciumSettlementResult>;
    private ensureConnected;
    private generateCommitment;
}
/**
 * Create Arcium client from environment variables
 */
export declare function createArciumClient(): ArciumClient | null;
/**
 * Create Arcium client with explicit config
 */
export declare function createArciumClientWithConfig(config: ArciumConfig): ArciumClient;
//# sourceMappingURL=client.d.ts.map