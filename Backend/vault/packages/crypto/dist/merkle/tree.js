/**
 * Merkle Tree implementation
 *
 * Binary hash tree for efficient batch commitment of WOTS public keys
 */
import { hash as hashFn, bytesEqual } from '../hash.js';
/**
 * Merkle Tree class
 *
 * Builds a complete binary tree from leaves and provides proof generation
 */
export class MerkleTree {
    /** All nodes in the tree, level by level (leaves first, root last) */
    levels;
    /** Number of leaves */
    leafCount;
    /** Tree depth (0 = single leaf) */
    depth;
    /** Root hash */
    root;
    constructor(levels) {
        this.levels = levels;
        this.leafCount = levels[0].length;
        this.depth = levels.length - 1;
        this.root = levels[levels.length - 1][0];
    }
    /**
     * Build a Merkle tree from leaf hashes
     *
     * @param leaves - Array of leaf hashes (will be padded to power of 2)
     */
    static fromLeaves(leaves) {
        if (leaves.length === 0) {
            throw new Error('Cannot create Merkle tree with no leaves');
        }
        // Pad to power of 2 with zero hashes
        const paddedCount = nextPowerOf2(leaves.length);
        const zeroHash = new Uint8Array(32); // All zeros
        const paddedLeaves = [...leaves];
        while (paddedLeaves.length < paddedCount) {
            paddedLeaves.push(zeroHash);
        }
        // Build tree bottom-up
        const levels = [paddedLeaves];
        let currentLevel = paddedLeaves;
        while (currentLevel.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i];
                const right = currentLevel[i + 1];
                nextLevel.push(hashNodes(left, right));
            }
            levels.push(nextLevel);
            currentLevel = nextLevel;
        }
        return new MerkleTree(levels);
    }
    /**
     * Get Merkle proof for a leaf at given index
     */
    getProof(leafIndex) {
        if (leafIndex < 0 || leafIndex >= this.leafCount) {
            throw new Error(`Leaf index out of range: ${leafIndex}`);
        }
        const siblings = [];
        const pathIndices = [];
        let index = leafIndex;
        for (let level = 0; level < this.depth; level++) {
            const isRight = (index % 2) === 1;
            const siblingIndex = isRight ? index - 1 : index + 1;
            siblings.push(this.levels[level][siblingIndex]);
            pathIndices.push(isRight);
            index = Math.floor(index / 2);
        }
        return { siblings, pathIndices, leafIndex };
    }
    /**
     * Verify a Merkle proof
     */
    verifyProof(proof, leaf, expectedRoot) {
        const root = expectedRoot ?? this.root;
        const computedRoot = computeRootFromProof(leaf, proof);
        return bytesEqual(computedRoot, root);
    }
    /**
     * Get leaf at index
     */
    getLeaf(index) {
        if (index < 0 || index >= this.leafCount) {
            throw new Error(`Leaf index out of range: ${index}`);
        }
        return this.levels[0][index];
    }
    /**
     * Get all leaves
     */
    getLeaves() {
        return [...this.levels[0]];
    }
    /**
     * Update a leaf and recompute affected nodes
     *
     * Note: This creates a new tree, doesn't modify in place
     */
    updateLeaf(index, newLeaf) {
        if (index < 0 || index >= this.leafCount) {
            throw new Error(`Leaf index out of range: ${index}`);
        }
        const newLeaves = [...this.levels[0]];
        newLeaves[index] = newLeaf;
        return MerkleTree.fromLeaves(newLeaves);
    }
    /**
     * Serialize tree for storage
     */
    serialize() {
        const toHex = (bytes) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        return {
            leaves: this.levels[0].map(toHex),
            root: toHex(this.root)
        };
    }
}
/**
 * Compute root from leaf and proof
 */
export function computeRootFromProof(leaf, proof) {
    let current = leaf;
    for (let i = 0; i < proof.siblings.length; i++) {
        const sibling = proof.siblings[i];
        const isRight = proof.pathIndices[i];
        if (isRight) {
            // Current is on the right, sibling is on the left
            current = hashNodes(sibling, current);
        }
        else {
            // Current is on the left, sibling is on the right
            current = hashNodes(current, sibling);
        }
    }
    return current;
}
/**
 * Hash two sibling nodes together
 *
 * Uses domain separation to prevent second preimage attacks
 */
function hashNodes(left, right) {
    // Prefix with 0x01 to distinguish from leaf hashes
    const combined = new Uint8Array(1 + left.length + right.length);
    combined[0] = 0x01;
    combined.set(left, 1);
    combined.set(right, 1 + left.length);
    return hashFn(combined);
}
/**
 * Helper: Get next power of 2
 */
function nextPowerOf2(n) {
    if (n <= 1)
        return 1;
    return Math.pow(2, Math.ceil(Math.log2(n)));
}
//# sourceMappingURL=tree.js.map