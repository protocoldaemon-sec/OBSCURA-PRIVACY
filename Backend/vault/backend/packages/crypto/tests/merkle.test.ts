/**
 * Merkle Tree Tests
 */

import { describe, it, expect } from 'vitest';
import { MerkleTree, verifyMerkleProof, computeMerkleRoot } from '../src/merkle/index.js';
import { hash, toHex, randomBytes } from '../src/hash.js';

describe('Merkle Tree', () => {
  describe('Construction', () => {
    it('should create tree from leaves', () => {
      const leaves = [
        hash(new TextEncoder().encode('leaf1')),
        hash(new TextEncoder().encode('leaf2')),
        hash(new TextEncoder().encode('leaf3')),
        hash(new TextEncoder().encode('leaf4'))
      ];
      
      const tree = MerkleTree.fromLeaves(leaves);
      
      expect(tree.leafCount).toBe(4);
      expect(tree.depth).toBe(2);
      expect(tree.root.length).toBe(32);
    });

    it('should pad to power of 2', () => {
      const leaves = [
        hash(new TextEncoder().encode('leaf1')),
        hash(new TextEncoder().encode('leaf2')),
        hash(new TextEncoder().encode('leaf3'))
      ];
      
      const tree = MerkleTree.fromLeaves(leaves);
      
      expect(tree.leafCount).toBe(4); // Padded from 3 to 4
      expect(tree.depth).toBe(2);
    });

    it('should handle single leaf', () => {
      const leaves = [hash(new TextEncoder().encode('single'))];
      const tree = MerkleTree.fromLeaves(leaves);
      
      expect(tree.leafCount).toBe(1);
      expect(tree.depth).toBe(0);
    });

    it('should reject empty leaves', () => {
      expect(() => MerkleTree.fromLeaves([])).toThrow();
    });
  });

  describe('Proof Generation', () => {
    it('should generate valid proof', () => {
      const leaves = [
        hash(new TextEncoder().encode('a')),
        hash(new TextEncoder().encode('b')),
        hash(new TextEncoder().encode('c')),
        hash(new TextEncoder().encode('d'))
      ];
      
      const tree = MerkleTree.fromLeaves(leaves);
      
      for (let i = 0; i < leaves.length; i++) {
        const proof = tree.getProof(i);
        expect(proof.leafIndex).toBe(i);
        expect(proof.siblings.length).toBe(2);
        expect(proof.pathIndices.length).toBe(2);
      }
    });

    it('should reject out of range index', () => {
      const leaves = [
        hash(new TextEncoder().encode('a')),
        hash(new TextEncoder().encode('b'))
      ];
      
      const tree = MerkleTree.fromLeaves(leaves);
      
      expect(() => tree.getProof(-1)).toThrow();
      expect(() => tree.getProof(2)).toThrow();
    });
  });

  describe('Proof Verification', () => {
    it('should verify valid proof', () => {
      const leaves = [
        hash(new TextEncoder().encode('a')),
        hash(new TextEncoder().encode('b')),
        hash(new TextEncoder().encode('c')),
        hash(new TextEncoder().encode('d'))
      ];
      
      const tree = MerkleTree.fromLeaves(leaves);
      
      for (let i = 0; i < leaves.length; i++) {
        const proof = tree.getProof(i);
        const valid = tree.verifyProof(proof, leaves[i]);
        expect(valid).toBe(true);
      }
    });

    it('should reject invalid leaf', () => {
      const leaves = [
        hash(new TextEncoder().encode('a')),
        hash(new TextEncoder().encode('b'))
      ];
      
      const tree = MerkleTree.fromLeaves(leaves);
      const proof = tree.getProof(0);
      
      const wrongLeaf = hash(new TextEncoder().encode('wrong'));
      const valid = tree.verifyProof(proof, wrongLeaf);
      expect(valid).toBe(false);
    });

    it('should reject invalid root', () => {
      const leaves = [
        hash(new TextEncoder().encode('a')),
        hash(new TextEncoder().encode('b'))
      ];
      
      const tree = MerkleTree.fromLeaves(leaves);
      const proof = tree.getProof(0);
      
      const wrongRoot = randomBytes(32);
      const valid = tree.verifyProof(proof, leaves[0], wrongRoot);
      expect(valid).toBe(false);
    });
  });

  describe('Standalone Verification', () => {
    it('should verify using standalone function', () => {
      const leaves = [
        hash(new TextEncoder().encode('a')),
        hash(new TextEncoder().encode('b')),
        hash(new TextEncoder().encode('c')),
        hash(new TextEncoder().encode('d'))
      ];
      
      const tree = MerkleTree.fromLeaves(leaves);
      const proof = tree.getProof(2);
      
      // Use standalone function
      const valid = verifyMerkleProof(proof, leaves[2], tree.root);
      expect(valid).toBe(true);
    });

    it('should compute root from proof', () => {
      const leaves = [
        hash(new TextEncoder().encode('a')),
        hash(new TextEncoder().encode('b')),
        hash(new TextEncoder().encode('c')),
        hash(new TextEncoder().encode('d'))
      ];
      
      const tree = MerkleTree.fromLeaves(leaves);
      const proof = tree.getProof(1);
      
      const computedRoot = computeMerkleRoot(leaves[1], proof);
      expect(toHex(computedRoot)).toBe(toHex(tree.root));
    });
  });

  describe('Large Trees', () => {
    it('should handle 1024 leaves', () => {
      const leaves: Uint8Array[] = [];
      for (let i = 0; i < 1024; i++) {
        leaves.push(hash(new Uint8Array([i >> 8, i & 0xff])));
      }
      
      const tree = MerkleTree.fromLeaves(leaves);
      
      expect(tree.leafCount).toBe(1024);
      expect(tree.depth).toBe(10);
      
      // Verify random proofs
      for (const i of [0, 100, 500, 999, 1023]) {
        const proof = tree.getProof(i);
        const valid = tree.verifyProof(proof, leaves[i]);
        expect(valid).toBe(true);
      }
    });
  });

  describe('Serialization', () => {
    it('should serialize tree', () => {
      const leaves = [
        hash(new TextEncoder().encode('a')),
        hash(new TextEncoder().encode('b'))
      ];
      
      const tree = MerkleTree.fromLeaves(leaves);
      const serialized = tree.serialize();
      
      expect(serialized.leaves).toHaveLength(2);
      expect(serialized.root).toHaveLength(64); // hex string
    });
  });
});
