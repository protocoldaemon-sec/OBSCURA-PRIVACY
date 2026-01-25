/**
 * Light Protocol Client
 *
 * Unified client for ZK Compression on Solana:
 * - Compressed account management
 * - Compressed token operations
 * - Settlement record storage
 * - Intent commitment storage
 */
import type { LightProtocolConfig, CompressedTokenAccount, CompressedSettlementData, CompressedIntentCommitment, CompressedAuditRecord, CreateCompressedAccountResult } from './types.js';
import { PhotonClient } from './photon.js';
import { CompressedPDAManager } from './compressed-pda.js';
import type { SettlementRecord, AuditEntry } from '../../types.js';
/**
 * Light Protocol Client
 *
 * Main entry point for ZK Compression integration
 */
export declare class LightProtocolClient {
    private config;
    private photon;
    private pdaManager;
    private connected;
    private stateTree;
    constructor(config: LightProtocolConfig);
    /**
     * Initialize and connect to Light Protocol
     */
    connect(stateTreePubkey?: string): Promise<void>;
    /**
     * Check if connected
     */
    isConnected(): boolean;
    /**
     * Get Photon client for direct queries
     */
    getPhotonClient(): PhotonClient;
    /**
     * Get PDA manager for direct operations
     */
    getPDAManager(): CompressedPDAManager;
    /**
     * Store a settlement record in compressed storage
     */
    storeSettlementRecord(record: SettlementRecord): Promise<CreateCompressedAccountResult>;
    /**
     * Get settlement record by batch ID
     */
    getSettlementRecord(batchId: string): Promise<CompressedSettlementData | null>;
    /**
     * Update settlement record status
     */
    updateSettlementStatus(batchId: string, status: 'pending' | 'confirmed' | 'finalized'): Promise<{
        signature: string;
    }>;
    /**
     * Store an intent commitment
     */
    storeIntentCommitment(intentId: string, commitment: Uint8Array, expiresAt: number, batchId?: string): Promise<CreateCompressedAccountResult>;
    /**
     * Get intent commitment by ID
     */
    getIntentCommitment(intentId: string): Promise<CompressedIntentCommitment | null>;
    /**
     * Mark intent as settled
     */
    markIntentSettled(intentId: string, batchId: string): Promise<{
        signature: string;
    }>;
    /**
     * Store an audit record for compliant mode
     */
    storeAuditRecord(entry: AuditEntry): Promise<CreateCompressedAccountResult>;
    /**
     * Get audit records for an intent
     */
    getAuditRecord(intentCommitment: Uint8Array): Promise<CompressedAuditRecord | null>;
    /**
     * Get compressed token balance
     */
    getCompressedTokenBalance(owner: string, mint: string): Promise<bigint>;
    /**
     * Get all compressed token accounts for owner
     */
    getCompressedTokenAccounts(owner: string, mint?: string): Promise<CompressedTokenAccount[]>;
    /**
     * Store multiple settlement records in batch
     */
    storeSettlementRecordsBatch(records: SettlementRecord[]): Promise<CreateCompressedAccountResult[]>;
    /**
     * Store multiple intent commitments in batch
     */
    storeIntentCommitmentsBatch(intents: Array<{
        intentId: string;
        commitment: Uint8Array;
        expiresAt: number;
    }>): Promise<CreateCompressedAccountResult[]>;
    private ensureConnected;
    private encodeSettlementData;
    private decodeSettlementData;
    private encodeIntentCommitment;
    private decodeIntentCommitment;
    private encodeAuditRecord;
    private decodeAuditRecord;
}
/**
 * Create Light Protocol client from environment
 */
export declare function createLightProtocolClient(): LightProtocolClient | null;
/**
 * Create Light Protocol client with explicit config
 */
export declare function createLightProtocolClientWithConfig(config: LightProtocolConfig): LightProtocolClient;
//# sourceMappingURL=client.d.ts.map