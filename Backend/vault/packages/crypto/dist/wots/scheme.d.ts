/**
 * WOTS+ Scheme Implementation
 *
 * Core cryptographic operations for Winternitz One-Time Signatures
 */
import type { WOTSParams, WOTSPublicKey, WOTSPrivateKey, WOTSSignature, Hash } from '../types.js';
/**
 * WOTS+ Scheme class
 */
export declare class WOTSScheme {
    readonly params: WOTSParams;
    constructor(params?: WOTSParams);
    /**
     * Generate a new WOTS private key
     *
     * Private key is len random n-byte values
     */
    generatePrivateKey(): WOTSPrivateKey;
    /**
     * Derive private key from seed (deterministic)
     *
     * Useful for HD-wallet style derivation
     */
    derivePrivateKey(seed: Uint8Array, index: number): WOTSPrivateKey;
    /**
     * Compute public key from private key
     *
     * Each chain: apply hash (w-1) times
     */
    computePublicKey(privateKey: WOTSPrivateKey): WOTSPublicKey;
    /**
     * Sign a message hash
     *
     * @param privateKey - WOTS private key (one-time use!)
     * @param messageHash - Hash of the message to sign
     */
    sign(privateKey: WOTSPrivateKey, messageHash: Hash): WOTSSignature;
    /**
     * Verify a signature and recover public key
     *
     * @param signature - WOTS signature
     * @param messageHash - Hash of the signed message
     * @returns Recovered public key
     */
    verify(signature: WOTSSignature, messageHash: Hash): WOTSPublicKey;
    /**
     * Check if signature is valid for a message given expected public key
     */
    verifyWithPublicKey(signature: WOTSSignature, messageHash: Hash, publicKey: WOTSPublicKey): boolean;
    /**
     * Compute hash of public key (for Merkle tree leaf)
     */
    hashPublicKey(publicKey: WOTSPublicKey): Hash;
    /**
     * Compare two public keys for equality
     */
    publicKeysEqual(a: WOTSPublicKey, b: WOTSPublicKey): boolean;
    /**
     * Serialize public key to bytes
     */
    serializePublicKey(publicKey: WOTSPublicKey): Uint8Array;
    /**
     * Deserialize bytes to public key
     */
    deserializePublicKey(bytes: Uint8Array): WOTSPublicKey;
    /**
     * Serialize signature to bytes
     */
    serializeSignature(signature: WOTSSignature): Uint8Array;
    /**
     * Deserialize bytes to signature
     */
    deserializeSignature(bytes: Uint8Array): WOTSSignature;
    /**
     * Hash chain function F
     *
     * Chain(x, start, steps, chainIndex)
     * Applies hash `steps` times starting from position `start`
     */
    private chain;
    /**
     * Convert bytes to base-w representation
     */
    private baseW;
    /**
     * Compute checksum for base-w message
     */
    private computeChecksum;
}
/**
 * Create a new WOTS scheme with specified w parameter
 */
export declare function createWOTS(w?: number): WOTSScheme;
//# sourceMappingURL=scheme.d.ts.map