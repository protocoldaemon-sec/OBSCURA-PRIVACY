/**
 * WOTS Key Manager
 *
 * Manages pre-generated WOTS key pools with:
 * - Key generation and storage
 * - Index tracking and burn enforcement
 * - Merkle tree commitment
 * - State persistence
 */
import type { WOTSParams, WOTSKeyPool, WOTSSignedIntent, Hash, MerkleProof } from '../types.js';
/**
 * Options for key pool generation
 */
export interface KeyPoolOptions {
    /** Number of keys to pre-generate */
    keyCount: number;
    /** WOTS w parameter (default 16) */
    w?: number;
    /** Optional seed for deterministic key generation */
    seed?: Uint8Array;
    /** Pool identifier (auto-generated if not provided) */
    id?: string;
}
/**
 * WOTS Key Manager class
 *
 * Handles pre-generated key pools with XMSS-style Merkle commitment
 */
export declare class WOTSKeyManager {
    private pool;
    private scheme;
    private merkleTree;
    private constructor();
    /**
     * Create a new key pool with pre-generated keys
     */
    static create(options: KeyPoolOptions): Promise<WOTSKeyManager>;
    /**
     * Restore a key manager from serialized pool state
     */
    static fromState(state: WOTSKeyPool): WOTSKeyManager;
    /**
     * Get the Merkle root of all public keys
     *
     * This is what gets registered on-chain or with the SIP backend
     */
    getMerkleRoot(): Hash;
    /**
     * Get pool statistics
     */
    getStats(): {
        total: number;
        used: number;
        available: number;
    };
    /**
     * Get the next available key index
     */
    getNextIndex(): number;
    /**
     * Check if a key index has been used
     */
    isKeyUsed(index: number): boolean;
    /**
     * Get available key count
     */
    availableKeys(): number;
    /**
     * Sign an intent hash using the next available key
     *
     * This will:
     * 1. Get next unused key
     * 2. Sign the intent hash
     * 3. Mark the key as burned
     * 4. Generate Merkle proof
     *
     * @returns Signed intent with signature and Merkle proof
     */
    signIntent(intentHash: Hash): WOTSSignedIntent;
    /**
     * Sign with a specific key index (advanced use)
     *
     * WARNING: Make sure you know what you're doing!
     * This bypasses the sequential key usage pattern.
     */
    signWithKey(keyIndex: number, intentHash: Hash): WOTSSignedIntent;
    /**
     * Verify a signed intent
     *
     * Checks:
     * 1. WOTS signature is valid
     * 2. Public key matches Merkle proof
     * 3. Merkle proof leads to expected root
     */
    verifySignedIntent(signedIntent: WOTSSignedIntent, expectedRoot?: Hash): boolean;
    /**
     * Export pool state for persistence
     *
     * WARNING: Contains private keys! Handle with extreme care.
     */
    exportState(): WOTSKeyPool;
    /**
     * Export public pool info (safe to share)
     *
     * Contains only public keys and Merkle root
     */
    exportPublicInfo(): {
        id: string;
        merkleRoot: Hash;
        totalKeys: number;
        usedKeys: number;
        params: WOTSParams;
    };
    /**
     * Get Merkle proof for a key index
     */
    getKeyProof(keyIndex: number): MerkleProof;
    /**
     * Get public key for an index
     */
    getPublicKey(keyIndex: number): Uint8Array[];
    private getNextUnusedKey;
    private burnKey;
}
//# sourceMappingURL=key-manager.d.ts.map