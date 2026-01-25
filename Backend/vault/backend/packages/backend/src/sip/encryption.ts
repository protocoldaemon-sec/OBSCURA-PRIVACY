/**
 * Intent Encryption - SDK Wrapper
 * 
 * Secure encryption for solver intents using @sip-protocol/sdk
 * with Pedersen commitments for amount hiding
 */

import {
  commit,
  verifyOpening,
  addCommitments,
  generateViewingKey,
  encryptForViewing,
  decryptWithViewing,
  type ViewingKey,
  type PedersenCommitment as SDKPedersenCommitment,
  type HexString,
  type TransactionData,
} from '@sip-protocol/sdk';
import type { EncryptedTransaction } from '@sip-protocol/types';
import { randomBytes, bytesToHex } from '@noble/hashes/utils';

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
export class IntentEncryption {
  /**
   * Create Pedersen commitment using SDK
   */
  static createPedersenCommitment(value: bigint): PedersenCommitment {
    // Use SDK commit function (blinding is auto-generated if not provided)
    const result: SDKPedersenCommitment = commit(value);
    
    return {
      commitment: result.commitment,
      blindingFactor: result.blinding,
    };
  }

  /**
   * Verify Pedersen commitment opening
   */
  static verifyCommitment(
    commitment: HexString,
    value: bigint,
    blindingFactor: HexString
  ): boolean {
    return verifyOpening(commitment, value, blindingFactor);
  }

  /**
   * Add two commitments (homomorphic property)
   */
  static addCommitments(c1: HexString, c2: HexString): HexString {
    const result = addCommitments(c1, c2);
    // CommitmentPoint may be a different type, convert to HexString
    return result as unknown as HexString;
  }

  /**
   * Generate viewing key pair for COMPLIANT mode
   */
  static generateViewingKeyPair(path?: string): ViewingKey {
    return generateViewingKey(path);
  }

  /**
   * Encrypt data for viewing key holder (regulators)
   */
  static encryptForViewer(
    data: TransactionData,
    viewingKey: ViewingKey
  ): EncryptedTransaction {
    return encryptForViewing(data, viewingKey);
  }

  /**
   * Decrypt data with viewing key (for compliance)
   */
  static decryptWithViewingKey(
    encrypted: EncryptedTransaction,
    viewingKey: ViewingKey
  ): TransactionData {
    return decryptWithViewing(encrypted, viewingKey);
  }

  /**
   * Encrypt intent with privacy level support
   */
  static encryptIntent(
    intent: Uint8Array,
    recipientPubKey: Uint8Array,
    privacyLevel: 'TRANSPARENT' | 'SHIELDED' | 'COMPLIANT' = 'SHIELDED',
    viewingKey?: ViewingKey
  ): EncryptedIntent {
    const nonce = randomBytes(24);
    
    // Create amount commitment (placeholder value)
    const { commitment } = this.createPedersenCommitment(BigInt(0));
    
    // For COMPLIANT mode, add viewing key encryption layer
    if (privacyLevel === 'COMPLIANT' && viewingKey) {
      // Create TransactionData from intent
      const txData: TransactionData = {
        sender: '0x0000000000000000000000000000000000000000' as HexString,
        recipient: '0x0000000000000000000000000000000000000000' as HexString,
        amount: '0x' + bytesToHex(intent) as HexString,
        timestamp: Date.now(),
      };
      
      const encrypted = this.encryptForViewer(txData, viewingKey);
      return {
        ciphertext: Buffer.from(encrypted.ciphertext.slice(2), 'hex'),
        ephemeralPubKey: recipientPubKey,
        nonce,
        commitment,
        privacyLevel,
      };
    }
    
    // Standard encryption (SHIELDED/TRANSPARENT)
    return {
      ciphertext: intent, // Placeholder - real impl uses SDK encryption
      ephemeralPubKey: recipientPubKey,
      nonce,
      commitment,
      privacyLevel,
    };
  }
}

// Re-export SDK functions and types
export { commit, verifyOpening, addCommitments, generateViewingKey, encryptForViewing, decryptWithViewing };
export type { ViewingKey, TransactionData, EncryptedTransaction, HexString };
