/**
 * WOTS+ Scheme Implementation
 * 
 * Core cryptographic operations for Winternitz One-Time Signatures
 */

import { hash, hashWithDomain, randomBytes, HASH_SIZE } from '../hash.js';
import { computeWOTSParams } from './params.js';
import type { 
  WOTSParams, 
  WOTSPublicKey, 
  WOTSPrivateKey, 
  WOTSSignature,
  Hash 
} from '../types.js';

/**
 * WOTS+ Scheme class
 */
export class WOTSScheme {
  readonly params: WOTSParams;

  constructor(params?: WOTSParams) {
    this.params = params ?? computeWOTSParams(16, 32);
  }

  /**
   * Generate a new WOTS private key
   * 
   * Private key is len random n-byte values
   */
  generatePrivateKey(): WOTSPrivateKey {
    const sk: WOTSPrivateKey = [];
    for (let i = 0; i < this.params.len; i++) {
      sk.push(randomBytes(this.params.n));
    }
    return sk;
  }

  /**
   * Derive private key from seed (deterministic)
   * 
   * Useful for HD-wallet style derivation
   */
  derivePrivateKey(seed: Uint8Array, index: number): WOTSPrivateKey {
    const sk: WOTSPrivateKey = [];
    const indexBytes = new Uint8Array(4);
    new DataView(indexBytes.buffer).setUint32(0, index, false);

    for (let i = 0; i < this.params.len; i++) {
      const chainIndexBytes = new Uint8Array(4);
      new DataView(chainIndexBytes.buffer).setUint32(0, i, false);
      
      const combined = new Uint8Array(seed.length + 8);
      combined.set(seed, 0);
      combined.set(indexBytes, seed.length);
      combined.set(chainIndexBytes, seed.length + 4);
      
      sk.push(hashWithDomain('WOTS_SK', combined));
    }
    return sk;
  }

  /**
   * Compute public key from private key
   * 
   * Each chain: apply hash (w-1) times
   */
  computePublicKey(privateKey: WOTSPrivateKey): WOTSPublicKey {
    if (privateKey.length !== this.params.len) {
      throw new Error(`Invalid private key length: expected ${this.params.len}, got ${privateKey.length}`);
    }

    const pk: WOTSPublicKey = [];
    for (let i = 0; i < this.params.len; i++) {
      pk.push(this.chain(privateKey[i], 0, this.params.w - 1, i));
    }
    return pk;
  }

  /**
   * Sign a message hash
   * 
   * @param privateKey - WOTS private key (one-time use!)
   * @param messageHash - Hash of the message to sign
   */
  sign(privateKey: WOTSPrivateKey, messageHash: Hash): WOTSSignature {
    if (privateKey.length !== this.params.len) {
      throw new Error(`Invalid private key length: expected ${this.params.len}, got ${privateKey.length}`);
    }
    if (messageHash.length !== this.params.n) {
      throw new Error(`Invalid message hash length: expected ${this.params.n}, got ${messageHash.length}`);
    }

    // Convert message to base-w representation
    const msgBaseW = this.baseW(messageHash, this.params.len1);
    
    // Compute checksum
    const checksum = this.computeChecksum(msgBaseW);
    
    // Combine message digits and checksum digits
    const allDigits = [...msgBaseW, ...checksum];

    // Generate signature
    const sig: WOTSSignature = [];
    for (let i = 0; i < this.params.len; i++) {
      sig.push(this.chain(privateKey[i], 0, allDigits[i], i));
    }
    return sig;
  }

  /**
   * Verify a signature and recover public key
   * 
   * @param signature - WOTS signature
   * @param messageHash - Hash of the signed message
   * @returns Recovered public key
   */
  verify(signature: WOTSSignature, messageHash: Hash): WOTSPublicKey {
    if (signature.length !== this.params.len) {
      throw new Error(`Invalid signature length: expected ${this.params.len}, got ${signature.length}`);
    }
    if (messageHash.length !== this.params.n) {
      throw new Error(`Invalid message hash length: expected ${this.params.n}, got ${messageHash.length}`);
    }

    // Convert message to base-w representation
    const msgBaseW = this.baseW(messageHash, this.params.len1);
    
    // Compute checksum
    const checksum = this.computeChecksum(msgBaseW);
    
    // Combine message digits and checksum digits
    const allDigits = [...msgBaseW, ...checksum];

    // Recover public key by completing the chains
    const recoveredPk: WOTSPublicKey = [];
    for (let i = 0; i < this.params.len; i++) {
      const remaining = this.params.w - 1 - allDigits[i];
      recoveredPk.push(this.chain(signature[i], allDigits[i], remaining, i));
    }
    return recoveredPk;
  }

  /**
   * Check if signature is valid for a message given expected public key
   */
  verifyWithPublicKey(
    signature: WOTSSignature, 
    messageHash: Hash, 
    publicKey: WOTSPublicKey
  ): boolean {
    try {
      const recoveredPk = this.verify(signature, messageHash);
      return this.publicKeysEqual(recoveredPk, publicKey);
    } catch {
      return false;
    }
  }

  /**
   * Compute hash of public key (for Merkle tree leaf)
   */
  hashPublicKey(publicKey: WOTSPublicKey): Hash {
    // Concatenate all public key elements and hash
    const totalLength = publicKey.reduce((acc, pk) => acc + pk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const pk of publicKey) {
      combined.set(pk, offset);
      offset += pk.length;
    }
    return hashWithDomain('WOTS_PK', combined);
  }

  /**
   * Compare two public keys for equality
   */
  publicKeysEqual(a: WOTSPublicKey, b: WOTSPublicKey): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].length !== b[i].length) return false;
      for (let j = 0; j < a[i].length; j++) {
        if (a[i][j] !== b[i][j]) return false;
      }
    }
    return true;
  }

  /**
   * Serialize public key to bytes
   */
  serializePublicKey(publicKey: WOTSPublicKey): Uint8Array {
    const result = new Uint8Array(this.params.len * this.params.n);
    for (let i = 0; i < publicKey.length; i++) {
      result.set(publicKey[i], i * this.params.n);
    }
    return result;
  }

  /**
   * Deserialize bytes to public key
   */
  deserializePublicKey(bytes: Uint8Array): WOTSPublicKey {
    if (bytes.length !== this.params.len * this.params.n) {
      throw new Error(`Invalid serialized public key length`);
    }
    const pk: WOTSPublicKey = [];
    for (let i = 0; i < this.params.len; i++) {
      pk.push(bytes.slice(i * this.params.n, (i + 1) * this.params.n));
    }
    return pk;
  }

  /**
   * Serialize signature to bytes
   */
  serializeSignature(signature: WOTSSignature): Uint8Array {
    const result = new Uint8Array(this.params.len * this.params.n);
    for (let i = 0; i < signature.length; i++) {
      result.set(signature[i], i * this.params.n);
    }
    return result;
  }

  /**
   * Deserialize bytes to signature
   */
  deserializeSignature(bytes: Uint8Array): WOTSSignature {
    if (bytes.length !== this.params.len * this.params.n) {
      throw new Error(`Invalid serialized signature length`);
    }
    const sig: WOTSSignature = [];
    for (let i = 0; i < this.params.len; i++) {
      sig.push(bytes.slice(i * this.params.n, (i + 1) * this.params.n));
    }
    return sig;
  }

  // ============ Private Methods ============

  /**
   * Hash chain function F
   * 
   * Chain(x, start, steps, chainIndex)
   * Applies hash `steps` times starting from position `start`
   */
  private chain(x: Uint8Array, start: number, steps: number, chainIndex: number): Uint8Array {
    if (steps === 0) {
      return new Uint8Array(x);
    }

    let result: Uint8Array = new Uint8Array(x);
    const chainIndexBytes = new Uint8Array(4);
    new DataView(chainIndexBytes.buffer).setUint32(0, chainIndex, false);

    for (let i = start; i < start + steps; i++) {
      const posBytes = new Uint8Array(4);
      new DataView(posBytes.buffer).setUint32(0, i, false);
      
      // Domain-separated hash: H(chainIndex || position || value)
      const combined = new Uint8Array(8 + result.length);
      combined.set(chainIndexBytes, 0);
      combined.set(posBytes, 4);
      combined.set(result, 8);
      result = new Uint8Array(hash(combined));
    }

    return result;
  }

  /**
   * Convert bytes to base-w representation
   */
  private baseW(input: Uint8Array, outLen: number): number[] {
    const log2w = Math.log2(this.params.w);
    const result: number[] = [];
    
    let bits = 0;
    let total = 0;
    let consumed = 0;

    for (let i = 0; i < outLen; i++) {
      // Get more bits if needed
      while (bits < log2w) {
        if (consumed < input.length) {
          total = (total << 8) | input[consumed];
          consumed++;
          bits += 8;
        } else {
          // Pad with zeros if we run out of input
          total = total << (log2w - bits);
          bits = log2w;
        }
      }

      // Extract one base-w digit
      bits -= log2w;
      result.push((total >> bits) & (this.params.w - 1));
    }

    return result;
  }

  /**
   * Compute checksum for base-w message
   */
  private computeChecksum(msgBaseW: number[]): number[] {
    // Sum of (w-1 - digit) for each message digit
    let checksum = 0;
    for (const digit of msgBaseW) {
      checksum += (this.params.w - 1) - digit;
    }

    // Shift checksum left by padding bits
    const log2w = Math.log2(this.params.w);
    const neededBits = this.params.len2 * log2w;
    const checksumBits = Math.ceil(Math.log2(this.params.len1 * (this.params.w - 1) + 1));
    const shift = neededBits - checksumBits;
    if (shift > 0) {
      checksum = checksum << shift;
    }

    // Convert checksum to bytes then to base-w
    const checksumBytes = new Uint8Array(Math.ceil(neededBits / 8));
    let temp = checksum;
    for (let i = checksumBytes.length - 1; i >= 0; i--) {
      checksumBytes[i] = temp & 0xff;
      temp = temp >> 8;
    }

    return this.baseW(checksumBytes, this.params.len2);
  }
}

/**
 * Create a new WOTS scheme with specified w parameter
 */
export function createWOTS(w: number = 16): WOTSScheme {
  return new WOTSScheme(computeWOTSParams(w, HASH_SIZE));
}
