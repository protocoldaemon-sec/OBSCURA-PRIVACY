/**
 * Photon Indexer Client
 *
 * Query interface for compressed accounts on Solana:
 * - Get compressed accounts by owner
 * - Get compressed token accounts
 * - Get account proofs for transactions
 * - Subscribe to account changes
 */
import type { LightProtocolConfig, CompressedAccount, CompressedAccountWithProof, CompressedTokenAccount, PhotonQueryParams, PhotonResponse, StateTree } from './types.js';
/** Photon RPC methods */
export declare enum PhotonMethod {
    GetCompressedAccount = "getCompressedAccount",
    GetCompressedAccountsByOwner = "getCompressedAccountsByOwner",
    GetCompressedTokenAccountsByOwner = "getCompressedTokenAccountsByOwner",
    GetCompressedTokenAccountsByDelegate = "getCompressedTokenAccountsByDelegate",
    GetCompressedAccountProof = "getCompressedAccountProof",
    GetMultipleCompressedAccountProofs = "getMultipleCompressedAccountProofs",
    GetValidityProof = "getValidityProof",
    GetLatestSignatures = "getLatestSignatures",
    GetIndexerHealth = "getIndexerHealth",
    GetStateTree = "getStateTree"
}
/**
 * Photon Indexer Client
 *
 * Provides read access to compressed account state
 */
export declare class PhotonClient {
    private config;
    constructor(config: LightProtocolConfig);
    /**
     * Get a compressed account by hash
     */
    getCompressedAccount(hash: Uint8Array): Promise<CompressedAccount | null>;
    /**
     * Get compressed accounts by owner
     */
    getCompressedAccountsByOwner(owner: string, params?: PhotonQueryParams): Promise<PhotonResponse<CompressedAccount>>;
    /**
     * Get compressed token accounts by owner
     */
    getCompressedTokenAccountsByOwner(owner: string, mint?: string, params?: PhotonQueryParams): Promise<PhotonResponse<CompressedTokenAccount>>;
    /**
     * Get proof for a compressed account
     */
    getCompressedAccountProof(hash: Uint8Array): Promise<CompressedAccountWithProof | null>;
    /**
     * Get proofs for multiple compressed accounts
     */
    getMultipleCompressedAccountProofs(hashes: Uint8Array[]): Promise<(CompressedAccountWithProof | null)[]>;
    /**
     * Get validity proof for a state transition
     */
    getValidityProof(inputHashes: Uint8Array[], newAddresses?: string[]): Promise<{
        compressedProof: Uint8Array;
        rootIndices: number[];
        leafIndices: number[];
        roots: Uint8Array[];
    }>;
    /**
     * Get state tree information
     */
    getStateTree(pubkey: string): Promise<StateTree | null>;
    /**
     * Get indexer health status
     */
    getHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        latestSlot: bigint;
        indexedSlot: bigint;
        lag: number;
    }>;
    /**
     * Get latest signatures for compressed transactions
     */
    getLatestSignatures(limit?: number): Promise<Array<{
        signature: string;
        slot: bigint;
        timestamp: number;
    }>>;
    private rpc;
    private encodeBytes;
    private decodeBytes;
    private parseCompressedAccount;
    private parseCompressedTokenAccount;
    private parseCompressedAccountWithProof;
}
/**
 * Create Photon client from config
 */
export declare function createPhotonClient(config: LightProtocolConfig): PhotonClient;
//# sourceMappingURL=photon.d.ts.map