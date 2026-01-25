/**
 * Standalone Merkle proof verification
 * 
 * These functions can be used without the full MerkleTree class,
 * suitable for verification-only scenarios (e.g., in contracts or light clients)
 */

import { hash as hashFn, bytesEqual } from '../hash.js';
import type { Hash, MerkleProof } from '../types.js';

/**
 * Verify a Merkle proof
 * 
 * @param proof - The Merkle proof
 * @param leaf - The leaf hash to verify
 * @param root - The expected root hash
 * @returns true if the proof is valid
 */
export function verifyMerkleProof(
  proof: MerkleProof,
  leaf: Hash,
  root: Hash
): boolean {
  const computedRoot = computeMerkleRoot(leaf, proof);
  return bytesEqual(computedRoot, root);
}

/**
 * Compute Merkle root from a leaf and proof
 * 
 * @param leaf - The leaf hash
 * @param proof - The Merkle proof containing siblings and path
 * @returns The computed root hash
 */
export function computeMerkleRoot(leaf: Hash, proof: MerkleProof): Hash {
  let current = leaf;
  
  for (let i = 0; i < proof.siblings.length; i++) {
    const sibling = proof.siblings[i];
    const isRight = proof.pathIndices[i];
    
    if (isRight) {
      // Current is on the right, sibling is on the left
      current = hashNodes(sibling, current);
    } else {
      // Current is on the left, sibling is on the right
      current = hashNodes(current, sibling);
    }
  }
  
  return current;
}

/**
 * Compute leaf hash from data (with domain separation)
 * 
 * @param data - Raw data to hash as a leaf
 * @returns Leaf hash
 */
export function computeLeafHash(data: Uint8Array): Hash {
  // Prefix with 0x00 to distinguish from internal nodes
  const prefixed = new Uint8Array(1 + data.length);
  prefixed[0] = 0x00;
  prefixed.set(data, 1);
  return hashFn(prefixed);
}

/**
 * Verify batch of proofs efficiently
 * 
 * Useful for batch verification in aggregator
 */
export function verifyMerkleProofBatch(
  proofs: Array<{ proof: MerkleProof; leaf: Hash }>,
  root: Hash
): boolean {
  for (const { proof, leaf } of proofs) {
    if (!verifyMerkleProof(proof, leaf, root)) {
      return false;
    }
  }
  return true;
}

/**
 * Hash two sibling nodes together
 */
function hashNodes(left: Hash, right: Hash): Hash {
  // Prefix with 0x01 to distinguish from leaf hashes
  const combined = new Uint8Array(1 + left.length + right.length);
  combined[0] = 0x01;
  combined.set(left, 1);
  combined.set(right, 1 + left.length);
  return hashFn(combined);
}

/**
 * Compute index from path
 */
export function proofPathToIndex(proof: MerkleProof): number {
  let index = 0;
  for (let i = 0; i < proof.pathIndices.length; i++) {
    if (proof.pathIndices[i]) {
      index |= (1 << i);
    }
  }
  return index;
}

/**
 * Check if proof is for a specific index
 */
export function isProofForIndex(proof: MerkleProof, index: number): boolean {
  return proof.leafIndex === index && proofPathToIndex(proof) === index;
}
