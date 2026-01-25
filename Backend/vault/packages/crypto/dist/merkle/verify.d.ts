/**
 * Standalone Merkle proof verification
 *
 * These functions can be used without the full MerkleTree class,
 * suitable for verification-only scenarios (e.g., in contracts or light clients)
 */
import type { Hash, MerkleProof } from '../types.js';
/**
 * Verify a Merkle proof
 *
 * @param proof - The Merkle proof
 * @param leaf - The leaf hash to verify
 * @param root - The expected root hash
 * @returns true if the proof is valid
 */
export declare function verifyMerkleProof(proof: MerkleProof, leaf: Hash, root: Hash): boolean;
/**
 * Compute Merkle root from a leaf and proof
 *
 * @param leaf - The leaf hash
 * @param proof - The Merkle proof containing siblings and path
 * @returns The computed root hash
 */
export declare function computeMerkleRoot(leaf: Hash, proof: MerkleProof): Hash;
/**
 * Compute leaf hash from data (with domain separation)
 *
 * @param data - Raw data to hash as a leaf
 * @returns Leaf hash
 */
export declare function computeLeafHash(data: Uint8Array): Hash;
/**
 * Verify batch of proofs efficiently
 *
 * Useful for batch verification in aggregator
 */
export declare function verifyMerkleProofBatch(proofs: Array<{
    proof: MerkleProof;
    leaf: Hash;
}>, root: Hash): boolean;
/**
 * Compute index from path
 */
export declare function proofPathToIndex(proof: MerkleProof): number;
/**
 * Check if proof is for a specific index
 */
export declare function isProofForIndex(proof: MerkleProof, index: number): boolean;
//# sourceMappingURL=verify.d.ts.map