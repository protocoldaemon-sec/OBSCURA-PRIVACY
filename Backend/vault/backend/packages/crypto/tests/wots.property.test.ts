/**
 * WOTS+ Property-Based Tests
 * 
 * Feature: codebase-review-optimization
 * 
 * These tests verify universal properties of the WOTS+ implementation
 * using fast-check for property-based testing.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { WOTSScheme, createWOTS } from '../src/wots/index.js';
import { hash, randomBytes, toHex } from '../src/hash.js';
import type { WOTSPrivateKey, WOTSPublicKey, WOTSSignature, Hash } from '../src/types.js';

// ============ Generators ============

/**
 * Generator for valid 32-byte message hashes
 */
const messageHashArb = fc.uint8Array({ minLength: 32, maxLength: 32 });

/**
 * Generator for valid 32-byte seeds
 */
const seedArb = fc.uint8Array({ minLength: 32, maxLength: 32 });

/**
 * Generator for key indices (reasonable range for testing)
 */
const keyIndexArb = fc.integer({ min: 0, max: 1000000 });

/**
 * Generator for two distinct key indices
 */
const distinctIndicesArb = fc.tuple(keyIndexArb, keyIndexArb).filter(([a, b]) => a !== b);

/**
 * Generator for byte corruption position and value
 */
const corruptionArb = (maxLength: number) => fc.record({
  position: fc.integer({ min: 0, max: maxLength - 1 }),
  xorValue: fc.integer({ min: 1, max: 255 }) // Non-zero to ensure actual corruption
});

/**
 * Generator for chain index corruption (which chain to corrupt)
 */
const chainCorruptionArb = (numChains: number) => fc.record({
  chainIndex: fc.integer({ min: 0, max: numChains - 1 }),
  byteIndex: fc.integer({ min: 0, max: 31 }), // 32-byte chains
  xorValue: fc.integer({ min: 1, max: 255 })
});

/**
 * Generator for two distinct message hashes
 */
const distinctMessagesArb = fc.tuple(messageHashArb, messageHashArb).filter(([a, b]) => {
  return toHex(a) !== toHex(b);
});

// ============ Test Helpers ============

/**
 * Create a WOTS scheme for testing (w=16 is the balanced default)
 */
function createTestWOTS(): WOTSScheme {
  return createWOTS(16);
}

/**
 * Generate a valid private key for testing
 */
function generateTestPrivateKey(wots: WOTSScheme): WOTSPrivateKey {
  return wots.generatePrivateKey();
}

/**
 * Corrupt a signature by XORing a byte
 */
function corruptSignature(
  sig: WOTSSignature, 
  chainIndex: number, 
  byteIndex: number, 
  xorValue: number
): WOTSSignature {
  const corrupted = sig.map(chain => new Uint8Array(chain));
  corrupted[chainIndex][byteIndex] ^= xorValue;
  return corrupted;
}

/**
 * Check if two public keys are equal
 */
function publicKeysEqual(a: WOTSPublicKey, b: WOTSPublicKey): boolean {
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
 * Check if two signatures are equal
 */
function signaturesEqual(a: WOTSSignature, b: WOTSSignature): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false;
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }
  return true;
}

// ============ Property Tests ============

describe('WOTS+ Property Tests', () => {

  /**
   * Property 1: WOTS+ Sign/Verify Round-Trip
   * 
   * For any valid private key and any message hash, signing the message
   * and then verifying the signature with the corresponding public key SHALL succeed.
   * 
   * **Validates: Requirements 1.1, 1.2**
   */
  describe('Property 1: WOTS+ Sign/Verify Round-Trip', () => {
    it('for any valid private key and message hash, sign then verify succeeds', () => {
      const wots = createTestWOTS();
      
      fc.assert(
        fc.property(messageHashArb, (messageHash) => {
          // Generate a fresh private key for each test
          const privateKey = wots.generatePrivateKey();
          const publicKey = wots.computePublicKey(privateKey);
          
          // Sign the message
          const signature = wots.sign(privateKey, messageHash);
          
          // Verify should succeed
          const isValid = wots.verifyWithPublicKey(signature, messageHash, publicKey);
          
          return isValid === true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: WOTS+ Signature Corruption Detection
   * 
   * For any valid signature, corrupting any byte of the signature SHALL cause verification to fail.
   * 
   * **Validates: Requirements 1.3**
   */
  describe('Property 2: WOTS+ Signature Corruption Detection', () => {
    it('for any valid signature, corrupting any byte causes verification to fail', () => {
      const wots = createTestWOTS();
      
      fc.assert(
        fc.property(
          messageHashArb,
          chainCorruptionArb(wots.params.len),
          (messageHash, corruption) => {
            // Generate keys and sign
            const privateKey = wots.generatePrivateKey();
            const publicKey = wots.computePublicKey(privateKey);
            const signature = wots.sign(privateKey, messageHash);
            
            // Corrupt the signature
            const corruptedSig = corruptSignature(
              signature,
              corruption.chainIndex,
              corruption.byteIndex,
              corruption.xorValue
            );
            
            // Verification should fail
            const isValid = wots.verifyWithPublicKey(corruptedSig, messageHash, publicKey);
            
            return isValid === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: WOTS+ Signature Uniqueness
   * 
   * For any private key and any two distinct message hashes, the signatures produced SHALL be different.
   * 
   * **Validates: Requirements 1.4**
   */
  describe('Property 3: WOTS+ Signature Uniqueness', () => {
    it('for any private key and two distinct messages, signatures are different', () => {
      const wots = createTestWOTS();
      
      fc.assert(
        fc.property(distinctMessagesArb, ([message1, message2]) => {
          // Generate a single private key
          const privateKey = wots.generatePrivateKey();
          
          // Sign both messages
          const sig1 = wots.sign(privateKey, message1);
          const sig2 = wots.sign(privateKey, message2);
          
          // Signatures should be different
          return !signaturesEqual(sig1, sig2);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: WOTS+ Public Key Serialization Round-Trip
   * 
   * For any public key, serializing and then deserializing SHALL produce an equal public key.
   * 
   * **Validates: Requirements 1.5**
   */
  describe('Property 4: WOTS+ Public Key Serialization Round-Trip', () => {
    it('for any public key, serialize then deserialize produces equal key', () => {
      const wots = createTestWOTS();
      
      fc.assert(
        fc.property(fc.constant(null), () => {
          // Generate a public key
          const privateKey = wots.generatePrivateKey();
          const publicKey = wots.computePublicKey(privateKey);
          
          // Serialize and deserialize
          const serialized = wots.serializePublicKey(publicKey);
          const deserialized = wots.deserializePublicKey(serialized);
          
          // Should be equal
          return publicKeysEqual(publicKey, deserialized);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: WOTS+ Signature Serialization Round-Trip
   * 
   * For any valid signature, serializing and deserializing SHALL preserve verification validity.
   * 
   * **Validates: Requirements 1.6**
   */
  describe('Property 5: WOTS+ Signature Serialization Round-Trip', () => {
    it('for any valid signature, serialize then deserialize preserves verification', () => {
      const wots = createTestWOTS();
      
      fc.assert(
        fc.property(messageHashArb, (messageHash) => {
          // Generate keys and sign
          const privateKey = wots.generatePrivateKey();
          const publicKey = wots.computePublicKey(privateKey);
          const signature = wots.sign(privateKey, messageHash);
          
          // Serialize and deserialize
          const serialized = wots.serializeSignature(signature);
          const deserialized = wots.deserializeSignature(serialized);
          
          // Verification should still succeed
          const isValid = wots.verifyWithPublicKey(deserialized, messageHash, publicKey);
          
          return isValid === true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 20: WOTS+ Key Derivation Determinism
   * 
   * For any seed and index, deriving a private key SHALL always produce the same result.
   * 
   * **Validates: Requirements 7.1**
   */
  describe('Property 20: WOTS+ Key Derivation Determinism', () => {
    it('for any seed and index, key derivation is deterministic', () => {
      const wots = createTestWOTS();
      
      fc.assert(
        fc.property(seedArb, keyIndexArb, (seed, index) => {
          // Derive the same key twice
          const key1 = wots.derivePrivateKey(seed, index);
          const key2 = wots.derivePrivateKey(seed, index);
          
          // Keys should be identical
          if (key1.length !== key2.length) return false;
          for (let i = 0; i < key1.length; i++) {
            if (toHex(key1[i]) !== toHex(key2[i])) return false;
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 21: WOTS+ Key Derivation Uniqueness
   * 
   * For any seed and any two different indices, the derived private keys SHALL be different.
   * 
   * **Validates: Requirements 7.2**
   */
  describe('Property 21: WOTS+ Key Derivation Uniqueness', () => {
    it('for any seed and two different indices, derived keys are different', () => {
      const wots = createTestWOTS();
      
      fc.assert(
        fc.property(seedArb, distinctIndicesArb, (seed, [index1, index2]) => {
          // Derive keys at different indices
          const key1 = wots.derivePrivateKey(seed, index1);
          const key2 = wots.derivePrivateKey(seed, index2);
          
          // At least one chain should be different
          for (let i = 0; i < key1.length; i++) {
            if (toHex(key1[i]) !== toHex(key2[i])) return true;
          }
          return false; // All chains were identical - this should not happen
        }),
        { numRuns: 100 }
      );
    });
  });
});
