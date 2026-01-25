/**
 * Intent Encryption - SDK Wrapper
 *
 * Secure encryption for solver intents using @sip-protocol/sdk
 * with Pedersen commitments for amount hiding
 */
import { commit, verifyOpening, addCommitments, generateViewingKey, encryptForViewing, decryptWithViewing, type ViewingKey, type HexString, type TransactionData } from '@sip-protocol/sdk';
import type { EncryptedTransaction } from '@sip-protocol/types';
/** Encrypted intent data */
export interface EncryptedIntent {
    /** Encrypted intent payload */
    ciphertext: Uint8Array;
    /** Ephemeral public key for decryption */
    ephemeralPubKey: Uint8Array;
    /** Nonce used for encryption */
    nonce: Uint8Array;
    /** Pedersen commitment to amounts */
    commitment: HexString;
    /** Privacy level */
    privacyLevel: 'TRANSPARENT' | 'SHIELDED' | 'COMPLIANT';
}
/** Pedersen commitment result */
export interface PedersenCommitment {
    /** The commitment point (hex string) */
    commitment: HexString;
    /** Blinding factor (hex string) */
    blindingFactor: HexString;
}
/**
 * Intent Encryption class
 *
 * Uses @sip-protocol/sdk for:
 * - Pedersen commitments for amount hiding
 * - Viewing key encryption for compliance
 */
export declare class IntentEncryption {
    /**
     * Create Pedersen commitment using SDK
     */
    static createPedersenCommitment(value: bigint): PedersenCommitment;
    /**
     * Verify Pedersen commitment opening
     */
    static verifyCommitment(commitment: HexString, value: bigint, blindingFactor: HexString): boolean;
    /**
     * Add two commitments (homomorphic property)
     */
    static addCommitments(c1: HexString, c2: HexString): HexString;
    /**
     * Generate viewing key pair for COMPLIANT mode
     */
    static generateViewingKeyPair(path?: string): ViewingKey;
    /**
     * Encrypt data for viewing key holder (regulators)
     */
    static encryptForViewer(data: TransactionData, viewingKey: ViewingKey): EncryptedTransaction;
    /**
     * Decrypt data with viewing key (for compliance)
     */
    static decryptWithViewingKey(encrypted: EncryptedTransaction, viewingKey: ViewingKey): TransactionData;
    /**
     * Encrypt intent with privacy level support
     */
    static encryptIntent(intent: Uint8Array, recipientPubKey: Uint8Array, privacyLevel?: 'TRANSPARENT' | 'SHIELDED' | 'COMPLIANT', viewingKey?: ViewingKey): EncryptedIntent;
}
export { commit, verifyOpening, addCommitments, generateViewingKey, encryptForViewing, decryptWithViewing };
export type { ViewingKey, TransactionData, EncryptedTransaction, HexString };
//# sourceMappingURL=encryption.d.ts.map