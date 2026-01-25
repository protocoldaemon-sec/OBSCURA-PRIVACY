/**
 * Core types for the cryptographic layer
 */
/** 32-byte hash/key represented as Uint8Array */
export type Hash = Uint8Array;
/** Hex-encoded string representation of a hash */
export type HexString = string;
/** WOTS signature - array of hash chains */
export type WOTSSignature = Uint8Array[];
/** WOTS public key - array of hash chain endpoints */
export type WOTSPublicKey = Uint8Array[];
/** WOTS private key - array of random seeds */
export type WOTSPrivateKey = Uint8Array[];
/** Merkle proof - array of sibling hashes with directions */
export interface MerkleProof {
    /** Sibling hashes from leaf to root */
    siblings: Hash[];
    /** Path directions: false = left, true = right */
    pathIndices: boolean[];
    /** Leaf index in the tree */
    leafIndex: number;
}
/** WOTS parameters */
export interface WOTSParams {
    /** Winternitz parameter (typically 4, 16, or 256) */
    w: number;
    /** Hash output length in bytes (typically 32) */
    n: number;
    /** Number of chains for message (computed from w and n) */
    len1: number;
    /** Number of chains for checksum (computed from w and len1) */
    len2: number;
    /** Total number of chains */
    len: number;
}
/** Pre-generated WOTS key entry */
export interface WOTSKeyEntry {
    /** Key index in the pool */
    index: number;
    /** Private key (only stored locally, never transmitted) */
    privateKey: WOTSPrivateKey;
    /** Public key */
    publicKey: WOTSPublicKey;
    /** Compressed public key hash for Merkle tree */
    publicKeyHash: Hash;
    /** Whether this key has been used (burned) */
    used: boolean;
    /** Timestamp of usage if used */
    usedAt?: number;
    /** Intent hash if used */
    usedFor?: Hash;
}
/** WOTS key pool state */
export interface WOTSKeyPool {
    /** Unique identifier for this key pool */
    id: string;
    /** Creation timestamp */
    createdAt: number;
    /** WOTS parameters used */
    params: WOTSParams;
    /** All pre-generated keys */
    keys: WOTSKeyEntry[];
    /** Merkle root of all public key hashes */
    merkleRoot: Hash;
    /** Next available (unused) key index */
    nextIndex: number;
    /** Total number of keys */
    totalKeys: number;
    /** Number of used keys */
    usedKeys: number;
}
/** Signed intent with WOTS authorization */
export interface WOTSSignedIntent {
    /** The intent hash that was signed */
    intentHash: Hash;
    /** Key index used for signing */
    keyIndex: number;
    /** WOTS signature */
    signature: WOTSSignature;
    /** Public key used */
    publicKey: WOTSPublicKey;
    /** Merkle proof of public key in the pool */
    merkleProof: MerkleProof;
    /** Merkle root (for verification against registered root) */
    merkleRoot: Hash;
}
/** Result of WOTS verification */
export interface WOTSVerificationResult {
    /** Whether the signature is valid */
    valid: boolean;
    /** Error message if invalid */
    error?: string;
    /** Recovered public key from signature */
    recoveredPublicKey?: WOTSPublicKey;
}
//# sourceMappingURL=types.d.ts.map