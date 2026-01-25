/**
 * WOTS Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WOTSScheme, createWOTS, computeWOTSParams } from '../src/wots/index.js';
import { hash, randomBytes, toHex } from '../src/hash.js';

describe('WOTS Scheme', () => {
  let wots: WOTSScheme;

  beforeEach(() => {
    wots = createWOTS(16);
  });

  describe('Parameters', () => {
    it('should compute correct parameters for w=16', () => {
      const params = computeWOTSParams(16, 32);
      expect(params.w).toBe(16);
      expect(params.n).toBe(32);
      expect(params.len1).toBe(64); // ceil(256/4)
      expect(params.len2).toBe(3);  // floor(log2(64*15)/4) + 1
      expect(params.len).toBe(67);
    });

    it('should compute correct parameters for w=4', () => {
      const params = computeWOTSParams(4, 32);
      expect(params.w).toBe(4);
      expect(params.len1).toBe(128); // ceil(256/2)
      expect(params.len2).toBe(5);
    });

    it('should compute correct parameters for w=256', () => {
      const params = computeWOTSParams(256, 32);
      expect(params.w).toBe(256);
      expect(params.len1).toBe(32); // ceil(256/8)
      expect(params.len2).toBe(2);
    });

    it('should reject invalid w values', () => {
      expect(() => computeWOTSParams(3, 32)).toThrow();
      expect(() => computeWOTSParams(0, 32)).toThrow();
    });
  });

  describe('Key Generation', () => {
    it('should generate private key with correct length', () => {
      const sk = wots.generatePrivateKey();
      expect(sk.length).toBe(wots.params.len);
      sk.forEach(chain => {
        expect(chain.length).toBe(wots.params.n);
      });
    });

    it('should generate different keys each time', () => {
      const sk1 = wots.generatePrivateKey();
      const sk2 = wots.generatePrivateKey();
      expect(toHex(sk1[0])).not.toBe(toHex(sk2[0]));
    });

    it('should derive deterministic keys from seed', () => {
      const seed = randomBytes(32);
      const sk1 = wots.derivePrivateKey(seed, 0);
      const sk2 = wots.derivePrivateKey(seed, 0);
      expect(toHex(sk1[0])).toBe(toHex(sk2[0]));
    });

    it('should derive different keys for different indices', () => {
      const seed = randomBytes(32);
      const sk1 = wots.derivePrivateKey(seed, 0);
      const sk2 = wots.derivePrivateKey(seed, 1);
      expect(toHex(sk1[0])).not.toBe(toHex(sk2[0]));
    });
  });

  describe('Public Key Computation', () => {
    it('should compute public key with correct length', () => {
      const sk = wots.generatePrivateKey();
      const pk = wots.computePublicKey(sk);
      expect(pk.length).toBe(wots.params.len);
      pk.forEach(chain => {
        expect(chain.length).toBe(wots.params.n);
      });
    });

    it('should compute same public key from same private key', () => {
      const sk = wots.generatePrivateKey();
      const pk1 = wots.computePublicKey(sk);
      const pk2 = wots.computePublicKey(sk);
      expect(wots.publicKeysEqual(pk1, pk2)).toBe(true);
    });
  });

  describe('Signing and Verification', () => {
    it('should sign and verify successfully', () => {
      const sk = wots.generatePrivateKey();
      const pk = wots.computePublicKey(sk);
      const message = hash(new TextEncoder().encode('test message'));
      
      const sig = wots.sign(sk, message);
      const valid = wots.verifyWithPublicKey(sig, message, pk);
      
      expect(valid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const sk = wots.generatePrivateKey();
      const pk = wots.computePublicKey(sk);
      const message = hash(new TextEncoder().encode('test message'));
      
      const sig = wots.sign(sk, message);
      
      // Corrupt signature
      sig[0][0] ^= 0xff;
      
      const valid = wots.verifyWithPublicKey(sig, message, pk);
      expect(valid).toBe(false);
    });

    it('should reject wrong message', () => {
      const sk = wots.generatePrivateKey();
      const pk = wots.computePublicKey(sk);
      const message1 = hash(new TextEncoder().encode('message 1'));
      const message2 = hash(new TextEncoder().encode('message 2'));
      
      const sig = wots.sign(sk, message1);
      const valid = wots.verifyWithPublicKey(sig, message2, pk);
      
      expect(valid).toBe(false);
    });

    it('should reject wrong public key', () => {
      const sk1 = wots.generatePrivateKey();
      const sk2 = wots.generatePrivateKey();
      const pk2 = wots.computePublicKey(sk2);
      const message = hash(new TextEncoder().encode('test'));
      
      const sig = wots.sign(sk1, message);
      const valid = wots.verifyWithPublicKey(sig, message, pk2);
      
      expect(valid).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize public key', () => {
      const sk = wots.generatePrivateKey();
      const pk = wots.computePublicKey(sk);
      
      const bytes = wots.serializePublicKey(pk);
      const restored = wots.deserializePublicKey(bytes);
      
      expect(wots.publicKeysEqual(pk, restored)).toBe(true);
    });

    it('should serialize and deserialize signature', () => {
      const sk = wots.generatePrivateKey();
      const message = hash(new TextEncoder().encode('test'));
      const sig = wots.sign(sk, message);
      
      const bytes = wots.serializeSignature(sig);
      const restored = wots.deserializeSignature(bytes);
      
      const pk = wots.computePublicKey(sk);
      const valid = wots.verifyWithPublicKey(restored, message, pk);
      expect(valid).toBe(true);
    });
  });

  describe('Public Key Hash', () => {
    it('should hash public key consistently', () => {
      const sk = wots.generatePrivateKey();
      const pk = wots.computePublicKey(sk);
      
      const hash1 = wots.hashPublicKey(pk);
      const hash2 = wots.hashPublicKey(pk);
      
      expect(toHex(hash1)).toBe(toHex(hash2));
    });

    it('should produce different hashes for different keys', () => {
      const sk1 = wots.generatePrivateKey();
      const sk2 = wots.generatePrivateKey();
      const pk1 = wots.computePublicKey(sk1);
      const pk2 = wots.computePublicKey(sk2);
      
      const hash1 = wots.hashPublicKey(pk1);
      const hash2 = wots.hashPublicKey(pk2);
      
      expect(toHex(hash1)).not.toBe(toHex(hash2));
    });
  });
});
