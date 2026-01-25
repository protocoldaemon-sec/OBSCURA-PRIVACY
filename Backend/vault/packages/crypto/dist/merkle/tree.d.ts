/**
 * Merkle Tree implementation
 *
 * Binary hash tree for efficient batch commitment of WOTS public keys
 */
import type { Hash, MerkleProof } from '../types.js';
/**
 * Merkle Tree class
 *
 * Builds a complete binary tree from leaves and provides proof generation
 */
export declare class MerkleTree {
    /** All nodes in the tree, level by level (leaves first, root last) */
    private levels;
    /** Number of leaves */
    readonly leafCount: number;
    /** Tree depth (0 = single leaf) */
    readonly depth: number;
    /** Root hash */
    readonly root: Hash;
    private constructor();
    /**
     * Build a Merkle tree from leaf hashes
     *
     * @param leaves - Array of leaf hashes (will be padded to power of 2)
     */
    static fromLeaves(leaves: Hash[]): MerkleTree;
    /**
     * Get Merkle proof for a leaf at given index
     */
    getProof(leafIndex: number): MerkleProof;
    /**
     * Verify a Merkle proof
     */
    verifyProof(proof: MerkleProof, leaf: Hash, expectedRoot?: Hash): boolean;
    /**
     * Get leaf at index
     */
    getLeaf(index: number): Hash;
    /**
     * Get all leaves
     */
    getLeaves(): Hash[];
    /**
     * Update a leaf and recompute affected nodes
     *
     * Note: This creates a new tree, doesn't modify in place
     */
    updateLeaf(index: number, newLeaf: Hash): MerkleTree;
    /**
     * Serialize tree for storage
     */
    serialize(): {
        leaves: string[];
        root: string;
    };
}
/**
 * Compute root from leaf and proof
 */
export declare function computeRootFromProof(leaf: Hash, proof: MerkleProof): Hash;
//# sourceMappingURL=tree.d.ts.map