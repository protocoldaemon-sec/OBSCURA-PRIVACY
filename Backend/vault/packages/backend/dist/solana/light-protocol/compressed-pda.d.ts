/**
 * Compressed PDA (Program Derived Address) Operations
 *
 * Create and manage compressed accounts with PDAs:
 * - Derive compressed PDAs
 * - Create compressed accounts
 * - Update compressed account data
 * - Close compressed accounts
 */
import type { LightProtocolConfig, CompressedAccountWithProof, ValidityProof } from './types.js';
import { PhotonClient } from './photon.js';
/** Light Protocol program IDs */
export declare const LIGHT_PROGRAM_IDS: {
    /** Light System Program */
    readonly systemProgram: "SySTEM1eSU2p4BGQfQpimFEWWSC1XDFeun3Nqzz3rT7";
    /** Compressed Token Program */
    readonly compressedToken: "cTokenmWW8bLPjZEBAUgYy3zKxQZW6VKi7bqNFEVv3m";
    /** Account Compression Program */
    readonly accountCompression: "cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK";
    /** Noop Program (for logging) */
    readonly noop: "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV";
};
/** State tree configuration */
export interface StateTreeConfig {
    /** Tree public key */
    pubkey: string;
    /** Queue public key */
    queuePubkey: string;
    /** CPI context public key */
    cpiContextPubkey?: string;
}
/**
 * Compressed PDA Manager
 *
 * Handles creation and management of compressed accounts
 */
export declare class CompressedPDAManager {
    private photon;
    private stateTree;
    constructor(_config: LightProtocolConfig, photon: PhotonClient);
    /**
     * Set the state tree to use for operations
     */
    setStateTree(tree: StateTreeConfig): void;
    /**
     * Derive a compressed PDA
     */
    deriveCompressedPDA(seeds: Uint8Array[], programId: string): Promise<{
        address: Uint8Array;
        bump: number;
    }>;
    /**
     * Create a new compressed account
     */
    createCompressedAccount(owner: string, data: Uint8Array, lamports?: bigint, seeds?: Uint8Array[]): Promise<{
        instruction: Uint8Array;
        accountHash: Uint8Array;
    }>;
    /**
     * Create a compressed token account
     */
    createCompressedTokenAccount(mint: string, owner: string): Promise<{
        instruction: Uint8Array;
        accountHash: Uint8Array;
    }>;
    /**
     * Update compressed account data
     */
    updateCompressedAccount(accountWithProof: CompressedAccountWithProof, newData: Uint8Array): Promise<{
        instruction: Uint8Array;
        newAccountHash: Uint8Array;
    }>;
    /**
     * Close a compressed account
     */
    closeCompressedAccount(accountWithProof: CompressedAccountWithProof, recipient: string): Promise<{
        instruction: Uint8Array;
    }>;
    /**
     * Transfer compressed tokens
     */
    transferCompressedTokens(sourceAccountsWithProofs: CompressedAccountWithProof[], destinationOwner: string, amount: bigint, mint: string): Promise<{
        instruction: Uint8Array;
    }>;
    /**
     * Get validity proof for accounts
     */
    getValidityProof(inputAccounts: CompressedAccountWithProof[]): Promise<ValidityProof>;
    private computeAccountHash;
    private hashSeeds;
    private poseidonHash;
    private sha256;
    private isValidPDA;
    private encodeCreateInstruction;
    private encodeUpdateInstruction;
    private encodeCloseInstruction;
    private encodeTokenTransferInstruction;
    private encodeTokenAccountData;
    private decodeTokenAccountData;
    private encodeBigInt;
    private decodeBase58;
    private encodeBase58;
}
/**
 * Create Compressed PDA Manager
 */
export declare function createCompressedPDAManager(config: LightProtocolConfig, photon: PhotonClient): CompressedPDAManager;
//# sourceMappingURL=compressed-pda.d.ts.map