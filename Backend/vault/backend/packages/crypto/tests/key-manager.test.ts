/**
 * Key Manager Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WOTSKeyManager } from '../src/wots/key-manager.js';
import { hash, toHex, randomBytes } from '../src/hash.js';

describe('WOTS Key Manager', () => {
  describe('Pool Creation', () => {
    it('should create pool with specified key count', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 8 });
      const stats = manager.getStats();
      
      expect(stats.total).toBe(8);
      expect(stats.used).toBe(0);
      expect(stats.available).toBe(8);
    });

    it('should pad to power of 2', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 5 });
      const stats = manager.getStats();
      
      expect(stats.total).toBe(8); // Padded from 5 to 8
    });

    it('should generate Merkle root', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 4 });
      const root = manager.getMerkleRoot();
      
      expect(root.length).toBe(32);
    });

    it('should create deterministic pool from seed', async () => {
      const seed = randomBytes(32);
      
      const manager1 = await WOTSKeyManager.create({ keyCount: 4, seed });
      const manager2 = await WOTSKeyManager.create({ keyCount: 4, seed });
      
      expect(toHex(manager1.getMerkleRoot())).toBe(toHex(manager2.getMerkleRoot()));
    });
  });

  describe('Intent Signing', () => {
    it('should sign intent successfully', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 4 });
      const intentHash = hash(new TextEncoder().encode('test intent'));
      
      const signed = manager.signIntent(intentHash);
      
      expect(signed.intentHash).toBe(intentHash);
      expect(signed.keyIndex).toBe(0);
      expect(signed.signature.length).toBe(manager.exportPublicInfo().params.len);
      expect(signed.merkleProof.siblings.length).toBe(2);
    });

    it('should burn key after signing', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 4 });
      const intentHash = hash(new TextEncoder().encode('test intent'));
      
      expect(manager.isKeyUsed(0)).toBe(false);
      manager.signIntent(intentHash);
      expect(manager.isKeyUsed(0)).toBe(true);
    });

    it('should use sequential keys', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 4 });
      
      const signed1 = manager.signIntent(hash(new TextEncoder().encode('1')));
      const signed2 = manager.signIntent(hash(new TextEncoder().encode('2')));
      const signed3 = manager.signIntent(hash(new TextEncoder().encode('3')));
      
      expect(signed1.keyIndex).toBe(0);
      expect(signed2.keyIndex).toBe(1);
      expect(signed3.keyIndex).toBe(2);
    });

    it('should throw when no keys available', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 2 });
      
      manager.signIntent(hash(new TextEncoder().encode('1')));
      manager.signIntent(hash(new TextEncoder().encode('2')));
      
      expect(() => manager.signIntent(hash(new TextEncoder().encode('3')))).toThrow();
    });

    it('should prevent signing with used key', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 4 });
      
      manager.signIntent(hash(new TextEncoder().encode('1')));
      
      expect(() => 
        manager.signWithKey(0, hash(new TextEncoder().encode('2')))
      ).toThrow();
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid signed intent', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 4 });
      const intentHash = hash(new TextEncoder().encode('test intent'));
      
      const signed = manager.signIntent(intentHash);
      const valid = manager.verifySignedIntent(signed);
      
      expect(valid).toBe(true);
    });

    it('should reject tampered signature', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 4 });
      const intentHash = hash(new TextEncoder().encode('test intent'));
      
      const signed = manager.signIntent(intentHash);
      
      // Tamper with signature
      signed.signature[0][0] ^= 0xff;
      
      const valid = manager.verifySignedIntent(signed);
      expect(valid).toBe(false);
    });

    it('should reject tampered intent hash', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 4 });
      const intentHash = hash(new TextEncoder().encode('test intent'));
      
      const signed = manager.signIntent(intentHash);
      
      // Tamper with intent hash
      signed.intentHash = hash(new TextEncoder().encode('different'));
      
      const valid = manager.verifySignedIntent(signed);
      expect(valid).toBe(false);
    });

    it('should reject wrong Merkle root', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 4 });
      const intentHash = hash(new TextEncoder().encode('test intent'));
      
      const signed = manager.signIntent(intentHash);
      
      // Wrong root
      const wrongRoot = randomBytes(32);
      const valid = manager.verifySignedIntent(signed, wrongRoot);
      expect(valid).toBe(false);
    });
  });

  describe('State Persistence', () => {
    it('should export and restore state', async () => {
      const manager1 = await WOTSKeyManager.create({ keyCount: 4 });
      
      // Use some keys
      manager1.signIntent(hash(new TextEncoder().encode('1')));
      manager1.signIntent(hash(new TextEncoder().encode('2')));
      
      // Export state
      const state = manager1.exportState();
      
      // Restore
      const manager2 = WOTSKeyManager.fromState(state);
      
      expect(manager2.getStats().used).toBe(2);
      expect(manager2.isKeyUsed(0)).toBe(true);
      expect(manager2.isKeyUsed(1)).toBe(true);
      expect(manager2.isKeyUsed(2)).toBe(false);
      expect(toHex(manager2.getMerkleRoot())).toBe(toHex(manager1.getMerkleRoot()));
    });

    it('should export safe public info', async () => {
      const manager = await WOTSKeyManager.create({ keyCount: 4 });
      const pubInfo = manager.exportPublicInfo();
      
      expect(pubInfo.totalKeys).toBe(4);
      expect(pubInfo.merkleRoot.length).toBe(32);
      expect(pubInfo.params).toBeDefined();
      // Should not contain private keys
      expect((pubInfo as any).keys).toBeUndefined();
    });
  });
});
