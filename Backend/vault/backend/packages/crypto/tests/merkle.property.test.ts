/**
 * Merkle Tree Property-Based Tests
 * 
 * Feature: codebase-review-optimization
 * 
 * These tests verify universal properties of the Merkle tree implementation
 * using fast-check for property-based testing.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MerkleTree, verifyMerkleProof, computeMerkleRoot } from '../src/merkle/index.js';
import { hash, toHex, bytesEqual } from '../src/hash.js';
import type { Hash, MerkleProof } from '../src/types.js';

// ============ Generators ============

/**
 * Generator for valid 32-byte leaf hashes
 */
const leafHashArb: fc.Arbitrary<Hash> = fc.uint8Array({ minLength: 32, maxLength: 32 });

/**
 * Generator for non-empty arrays of leaf hashes (1 to 64 leaves)
 */
const leafArrayArb: fc.Arbitrary<Hash[]> = fc.array(leafHashArb, { minLength: 1, maxLength: 64 });

/**
 * Generator for larger leaf arrays (for stress testing)
 */
const largeLeafArrayArb: fc.Arbitrary<Hash[]> = fc.array(leafHashArb, { minLength: 1, maxLength: 256 });

/**
 * Generator for a Merkle tree with a valid leaf index
 * Returns tuple of [leaves, validIndex]
 */
const treeWithValidIndexArb: fc.Arbitrary<{ leaves: Hash[]; index: number }> = leafArrayArb.chain(
  (leaves: Hash[]) => fc.record({
    leaves: fc.constant(leaves),
    index: fc.integer({ min: 0, max: leaves.length - 1 })
  })
);

/**
 * Generator for byte corruption (position and XOR value)
 */
const byteCorruptionArb = (maxLength: number): fc.Arbitrary<{ position: number; xorValue: number }> => fc.record({
  position: fc.integer({ min: 0, max: maxLength - 1 }),
  xorValue: fc.integer({ min: 1, max: 255 }) // Non-zero to ensure actual corruption
});

/**
 * Generator for sibling corruption in a proof
 */
const siblingCorruptionArb = (numSiblings: number): fc.Arbitrary<{ siblingIndex: number; byteIndex: number; xorValue: number }> => fc.record({
  siblingIndex: fc.integer({ min: 0, max: numSiblings - 1 }),
  byteIndex: fc.integer({ min: 0, max: 31 }), // 32-byte hashes
  xorValue: fc.integer({ min: 1, max: 255 })
});

// ============ Test Helpers ============

/**
 * Create a leaf hash from arbitrary data
 */
function createLeaf(data: Uint8Array): Hash {
  return hash(data);
}

/**
 * Corrupt a proof by XORing a byte in one of the siblings
 */
function corruptProof(
  proof: MerkleProof,
  siblingIndex: number,
  byteIndex: number,
  xorValue: number
): MerkleProof {
  const corruptedSiblings = proof.siblings.map((sibling: Hash) => new Uint8Array(sibling));
  corruptedSiblings[siblingIndex][byteIndex] ^= xorValue;
  return {
    siblings: corruptedSiblings,
    pathIndices: [...proof.pathIndices],
    leafIndex: proof.leafIndex
  };
}

/**
 * Create a different leaf (guaranteed to be different from original)
 */
function createDifferentLeaf(original: Hash): Hash {
  const modified = new Uint8Array(original);
  modified[0] ^= 0xff; // Flip all bits in first byte
  return hash(modified); // Hash to get a proper leaf
}

// ============ Property Tests ============

describe('Merkle Tree Property Tests', () => {

  /**
   * Property 6: Merkle Tree Determinism
   * 
   * For any set of leaves, building a Merkle tree SHALL always produce the same root hash.
   * 
   * **Validates: Requirements 2.1**
   */
  describe('Property 6: Merkle Tree Determinism', () => {
    it('for any set of leaves, building a tree twice produces the same root', () => {
      fc.assert(
        fc.property(leafArrayArb, (leaves: Hash[]) => {
          // Build the tree twice
          const tree1 = MerkleTree.fromLeaves(leaves);
          const tree2 = MerkleTree.fromLeaves(leaves);
          
          // Roots should be identical
          return bytesEqual(tree1.root, tree2.root);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Merkle Proof Validity
   * 
   * For any Merkle tree and any valid leaf index, the generated proof SHALL verify against the tree's root.
   * 
   * **Validates: Requirements 2.2**
   */
  describe('Property 7: Merkle Proof Validity', () => {
    it('for any tree and valid leaf index, the generated proof verifies', () => {
      fc.assert(
        fc.property(treeWithValidIndexArb, ({ leaves, index }: { leaves: Hash[]; index: number }) => {
          // Build tree and get proof
          const tree = MerkleTree.fromLeaves(leaves);
          const proof = tree.getProof(index);
          const leaf = tree.getLeaf(index);
          
          // Proof should verify
          return tree.verifyProof(proof, leaf);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Merkle Proof Rejection for Invalid Leaves
   * 
   * For any Merkle tree and proof, verifying with a different leaf than the original SHALL fail.
   * 
   * **Validates: Requirements 2.3**
   */
  describe('Property 8: Merkle Proof Rejection for Invalid Leaves', () => {
    it('for any tree and proof, verifying with a different leaf fails', () => {
      fc.assert(
        fc.property(treeWithValidIndexArb, ({ leaves, index }: { leaves: Hash[]; index: number }) => {
          // Build tree and get proof
          const tree = MerkleTree.fromLeaves(leaves);
          const proof = tree.getProof(index);
          const originalLeaf = tree.getLeaf(index);
          
          // Create a different leaf
          const differentLeaf = createDifferentLeaf(originalLeaf);
          
          // Verification with different leaf should fail
          return !tree.verifyProof(proof, differentLeaf);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Merkle Proof Corruption Detection
   * 
   * For any valid Merkle proof, corrupting any sibling hash SHALL cause verification to fail.
   * 
   * **Validates: Requirements 2.4**
   */
  describe('Property 9: Merkle Proof Corruption Detection', () => {
    it('for any valid proof, corrupting any sibling causes verification to fail', () => {
      fc.assert(
        fc.property(
          // Use trees with at least 2 leaves to ensure we have siblings
          fc.array(leafHashArb, { minLength: 2, maxLength: 64 }).chain(
            (leaves: Hash[]) => fc.record({
              leaves: fc.constant(leaves),
              index: fc.integer({ min: 0, max: leaves.length - 1 })
            })
          ),
          ({ leaves, index }: { leaves: Hash[]; index: number }) => {
            // Build tree and get proof
            const tree = MerkleTree.fromLeaves(leaves);
            const proof = tree.getProof(index);
            const leaf = tree.getLeaf(index);
            
            // Skip if no siblings (single leaf tree)
            if (proof.siblings.length === 0) {
              return true; // Vacuously true for single-leaf trees
            }
            
            // Generate corruption parameters
            const siblingIndex = Math.floor(Math.random() * proof.siblings.length);
            const byteIndex = Math.floor(Math.random() * 32);
            const xorValue = 1 + Math.floor(Math.random() * 254); // 1-255
            
            // Corrupt the proof
            const corruptedProof = corruptProof(proof, siblingIndex, byteIndex, xorValue);
            
            // Verification should fail
            return !tree.verifyProof(corruptedProof, leaf);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: Merkle Root Computation Consistency
   * 
   * For any Merkle tree and valid proof, computing the root from the proof SHALL match the tree's root.
   * 
   * **Validates: Requirements 2.5**
   */
  describe('Property 10: Merkle Root Computation Consistency', () => {
    it('for any tree and valid proof, computing root from proof matches tree root', () => {
      fc.assert(
        fc.property(treeWithValidIndexArb, ({ leaves, index }: { leaves: Hash[]; index: number }) => {
          // Build tree and get proof
          const tree = MerkleTree.fromLeaves(leaves);
          const proof = tree.getProof(index);
          const leaf = tree.getLeaf(index);
          
          // Compute root from proof
          const computedRoot = computeMerkleRoot(leaf, proof);
          
          // Should match tree's root
          return bytesEqual(computedRoot, tree.root);
        }),
        { numRuns: 100 }
      );
    });
  });
});
