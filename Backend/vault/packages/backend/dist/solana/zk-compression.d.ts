/**
 * ZK Compression Integration
 *
 * Compressed account storage for Solana:
 * - ~1000x cheaper storage costs
 * - Ideal for settlement records and audit trails
 * - Uses state compression with concurrent Merkle trees
 */
import type { Hash } from '@obscura/crypto';
import type { SettlementRecord, AuditEntry } from '../types.js';
/** ZK Compression configuration */
export interface ZKCompressionConfig {
    rpcUrl: string;
    compressionApiUrl?: string;
}
/** Compressed account proof */
export interface CompressedProof {
    root: Uint8Array;
    proof: Uint8Array[];
    leafIndex: number;
    leaf: Uint8Array;
}
/** Compressed settlement record */
export interface CompressedSettlementRecord {
    /** Original record data hash */
    dataHash: Hash;
    /** Compression tree address */
    treeAddress: string;
    /** Leaf index in the tree */
    leafIndex: number;
    /** Slot when compressed */
    slot: number;
    /** Sequence number */
    seq: number;
}
/** Compression statistics */
export interface CompressionStats {
    totalRecords: number;
    compressedSize: number;
    uncompressedSize: number;
    savingsPercent: number;
    treesUsed: number;
}
/**
 * ZK Compression client for compressed account storage
 *
 * Uses Light Protocol's ZK Compression for efficient on-chain storage
 */
export declare class ZKCompressionClient {
    private rpcUrl;
    private compressionApiUrl;
    constructor(config: ZKCompressionConfig);
    /**
     * Compress a settlement record for on-chain storage
     */
    compressSettlementRecord(record: SettlementRecord): Promise<CompressedSettlementRecord>;
    /**
     * Compress multiple settlement records in a batch
     */
    compressBatch(records: SettlementRecord[]): Promise<CompressedSettlementRecord[]>;
    /**
     * Compress an audit entry for compliant mode
     */
    compressAuditEntry(entry: AuditEntry): Promise<CompressedSettlementRecord>;
    /**
     * Get proof for a compressed record
     */
    getProof(treeAddress: string, leafIndex: number): Promise<CompressedProof>;
    /**
     * Verify a compressed record exists
     */
    verifyRecord(treeAddress: string, leafIndex: number, expectedHash: Hash): Promise<boolean>;
    /**
     * Get compression statistics
     */
    getStats(): Promise<CompressionStats>;
    /**
     * Serialize settlement record to bytes
     */
    private serializeSettlementRecord;
    /**
     * Serialize audit entry to bytes
     */
    private serializeAuditEntry;
    /**
     * Hash data using SHA-256
     */
    private hashData;
}
/**
 * Create ZK Compression client from environment
 */
export declare function createZKCompressionClient(): ZKCompressionClient | null;
//# sourceMappingURL=zk-compression.d.ts.map