/**
 * Arcium Encryption Helpers
 * 
 * Implements encryption using RescueCipher and x25519 ECDH key exchange
 * for confidential computations on Arcium MXE.
 * 
 * Based on @arcium-hq/client SDK patterns:
 * - x25519 for key exchange with MXE cluster
 * - RescueCipher for symmetric encryption
 * - Nonce management for encryption/decryption
 */

import { sha256 } from '@noble/hashes/sha256';
import crypto from 'node:crypto';
import type { EncryptedValue, EncryptionOwner } from './types.js';

/**
 * Convert ASCII string to Uint8Array
 */
function stringToBytes(str: string): Uint8Array {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr;
}

/** x25519 key pair for ECDH */
export interface X25519KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

/** Encryption context for a computation */
export interface EncryptionContext {
  /** Client's ephemeral key pair */
  keyPair: X25519KeyPair;
  /** MXE cluster's public key */
  mxePublicKey: Uint8Array;
  /** Derived shared secret */
  sharedSecret: Uint8Array;
  /** Nonce for this context */
  nonce: Uint8Array;
}

/**
 * Simplified x25519 utilities
 * 
 * In production, use @arcium-hq/client which provides:
 * ```typescript
 * import { x25519 } from "@arcium-hq/client";
 * const privateKey = x25519.utils.randomSecretKey();
 * const publicKey = x25519.getPublicKey(privateKey);
 * const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
 * ```
 * 
 * This implementation uses @noble/hashes for the crypto primitives.
 */
export const x25519Utils = {
  /**
   * Generate a random x25519 private key
   */
  randomSecretKey(): Uint8Array {
    return new Uint8Array(crypto.randomBytes(32));
  },

  /**
   * Derive public key from private key
   * 
   * Note: This is a simplified implementation.
   * Production should use actual x25519 curve operations.
   */
  getPublicKey(privateKey: Uint8Array): Uint8Array {
    // Simplified: hash the private key to get a deterministic "public key"
    // Real x25519 uses curve25519 scalar multiplication
    return sha256(privateKey);
  },

  /**
   * Compute shared secret via ECDH
   * 
   * Note: This is a simplified implementation.
   * Production should use actual x25519 ECDH.
   */
  getSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
    // Simplified: hash(privateKey || publicKey)
    // Real x25519 uses curve25519 scalar multiplication
    const combined = new Uint8Array(privateKey.length + publicKey.length);
    combined.set(privateKey, 0);
    combined.set(publicKey, privateKey.length);
    return sha256(combined);
  },
};

/**
 * RescueCipher implementation for Arcium encryption
 * 
 * Rescue is a ZK-friendly cipher used by Arcium for encrypting
 * data that will be processed in MPC computations.
 * 
 * In production, use @arcium-hq/client:
 * ```typescript
 * import { RescueCipher } from "@arcium-hq/client";
 * const cipher = new RescueCipher(sharedSecret);
 * const ciphertext = cipher.encrypt(plaintext, nonce);
 * const decrypted = cipher.decrypt(ciphertext, nonce);
 * ```
 */
export class RescueCipher {
  private key: Uint8Array;

  constructor(sharedSecret: Uint8Array) {
    // Derive encryption key from shared secret
    const suffix = stringToBytes('rescue-key');
    const keyInput = new Uint8Array(sharedSecret.length + suffix.length);
    keyInput.set(sharedSecret, 0);
    keyInput.set(suffix, sharedSecret.length);
    this.key = sha256(keyInput);
  }

  /**
   * Encrypt plaintext values
   * 
   * @param plaintext - Array of BigInt values to encrypt
   * @param nonce - 16-byte random nonce
   * @returns Ciphertext as Uint8Array (32 bytes per value)
   */
  encrypt(plaintext: bigint[], nonce: Uint8Array): Uint8Array {
    if (nonce.length !== 16) {
      throw new Error('Nonce must be 16 bytes');
    }

    // Each encrypted value is 32 bytes
    const ciphertext = new Uint8Array(plaintext.length * 32);

    for (let i = 0; i < plaintext.length; i++) {
      // Convert bigint to 32-byte buffer (little-endian)
      const valueBytes = bigintToBytes(plaintext[i], 32);
      
      // Generate keystream for this block
      const blockNonce = incrementNonce(nonce, i);
      const keystream = this.generateKeystream(blockNonce);
      
      // XOR plaintext with keystream
      for (let j = 0; j < 32; j++) {
        ciphertext[i * 32 + j] = valueBytes[j] ^ keystream[j];
      }
    }

    return ciphertext;
  }

  /**
   * Decrypt ciphertext back to plaintext values
   * 
   * @param ciphertext - Encrypted data (32 bytes per value)
   * @param nonce - Same nonce used for encryption
   * @returns Array of BigInt values
   */
  decrypt(ciphertext: Uint8Array, nonce: Uint8Array): bigint[] {
    if (nonce.length !== 16) {
      throw new Error('Nonce must be 16 bytes');
    }

    const numValues = ciphertext.length / 32;
    const plaintext: bigint[] = [];

    for (let i = 0; i < numValues; i++) {
      // Generate keystream for this block
      const blockNonce = incrementNonce(nonce, i);
      const keystream = this.generateKeystream(blockNonce);
      
      // XOR ciphertext with keystream
      const valueBytes = new Uint8Array(32);
      for (let j = 0; j < 32; j++) {
        valueBytes[j] = ciphertext[i * 32 + j] ^ keystream[j];
      }
      
      plaintext.push(bytesToBigint(valueBytes));
    }

    return plaintext;
  }

  /**
   * Generate keystream block using Rescue-like construction
   */
  private generateKeystream(nonce: Uint8Array): Uint8Array {
    // Simplified: use SHA-256 as PRF
    // Real Rescue uses algebraic operations over prime fields
    const input = new Uint8Array(this.key.length + nonce.length);
    input.set(this.key, 0);
    input.set(nonce, this.key.length);
    return sha256(input);
  }
}

/**
 * Arcium Encryption Helper
 * 
 * High-level API for encrypting data for Arcium MXE computations.
 */
export class ArciumEncryption {
  private mxePublicKey: Uint8Array | null = null;

  /**
   * Set the MXE cluster's public key
   * 
   * In production, fetch this from the cluster account:
   * ```typescript
   * const mxePublicKey = await getMXEPublicKeyWithRetry(provider, programId);
   * ```
   */
  setMXEPublicKey(publicKey: Uint8Array): void {
    this.mxePublicKey = publicKey;
  }

  /**
   * Create a new encryption context for a computation
   * 
   * Each computation should use a fresh context with new ephemeral keys.
   */
  createContext(): EncryptionContext {
    if (!this.mxePublicKey) {
      throw new Error('MXE public key not set. Call setMXEPublicKey() first.');
    }

    const privateKey = x25519Utils.randomSecretKey();
    const publicKey = x25519Utils.getPublicKey(privateKey);
    const sharedSecret = x25519Utils.getSharedSecret(privateKey, this.mxePublicKey);
    const nonce = new Uint8Array(crypto.randomBytes(16));

    return {
      keyPair: { privateKey, publicKey },
      mxePublicKey: this.mxePublicKey,
      sharedSecret,
      nonce,
    };
  }

  /**
   * Encrypt values for an Arcium confidential instruction
   * 
   * Example usage:
   * ```typescript
   * const encryption = new ArciumEncryption();
   * encryption.setMXEPublicKey(mxePublicKey);
   * 
   * const ctx = encryption.createContext();
   * const encrypted = encryption.encryptValues(ctx, [42n, 101n]);
   * ```
   */
  encryptValues(
    context: EncryptionContext,
    values: bigint[],
    owner: EncryptionOwner = 'Shared'
  ): EncryptedValue {
    const cipher = new RescueCipher(context.sharedSecret);
    const ciphertext = cipher.encrypt(values, context.nonce);

    // Generate commitment to plaintext
    const commitment = this.generateCommitment(values, context.nonce);

    return {
      ciphertext,
      nonce: context.nonce,
      ephemeralPubKey: context.keyPair.publicKey,
      commitment,
      owner,
    };
  }

  /**
   * Decrypt values from an Arcium computation result
   */
  decryptValues(
    context: EncryptionContext,
    encrypted: EncryptedValue
  ): bigint[] {
    const cipher = new RescueCipher(context.sharedSecret);
    return cipher.decrypt(encrypted.ciphertext, encrypted.nonce);
  }

  /**
   * Encrypt a single amount (u64)
   */
  encryptAmount(
    context: EncryptionContext,
    amount: bigint,
    owner: EncryptionOwner = 'Shared'
  ): EncryptedValue {
    return this.encryptValues(context, [amount], owner);
  }

  /**
   * Decrypt a single amount
   */
  decryptAmount(context: EncryptionContext, encrypted: EncryptedValue): bigint {
    const values = this.decryptValues(context, encrypted);
    return values[0];
  }

  /**
   * Generate commitment to plaintext values
   */
  private generateCommitment(values: bigint[], nonce: Uint8Array): Uint8Array {
    const valueBytes = values.map(v => bigintToBytes(v, 32));
    const totalLength = valueBytes.reduce((sum, b) => sum + b.length, 0) + nonce.length;
    const data = new Uint8Array(totalLength);
    
    let offset = 0;
    for (const bytes of valueBytes) {
      data.set(bytes, offset);
      offset += bytes.length;
    }
    data.set(nonce, offset);

    return sha256(data);
  }
}

// ============ Utility Functions ============

/**
 * Convert BigInt to Uint8Array (little-endian)
 */
function bigintToBytes(value: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let remaining = value;
  
  for (let i = 0; i < length && remaining > 0n; i++) {
    bytes[i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  
  return bytes;
}

/**
 * Convert Uint8Array to BigInt (little-endian)
 */
function bytesToBigint(bytes: Uint8Array): bigint {
  let value = 0n;
  
  for (let i = bytes.length - 1; i >= 0; i--) {
    value = (value << 8n) | BigInt(bytes[i]);
  }
  
  return value;
}

/**
 * Increment nonce by a counter value
 */
function incrementNonce(nonce: Uint8Array, counter: number): Uint8Array {
  const result = new Uint8Array(nonce);
  
  // Add counter to last 4 bytes (little-endian)
  let carry = counter;
  for (let i = 12; i < 16 && carry > 0; i++) {
    const sum = result[i] + (carry & 0xff);
    result[i] = sum & 0xff;
    carry = (carry >> 8) + (sum >> 8);
  }
  
  return result;
}

/**
 * Generate a random nonce for encryption
 */
export function generateNonce(): Uint8Array {
  return new Uint8Array(crypto.randomBytes(16));
}

/**
 * Create encryption helper instance
 */
export function createArciumEncryption(): ArciumEncryption {
  return new ArciumEncryption();
}
