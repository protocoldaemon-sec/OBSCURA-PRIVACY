// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MerkleVerifier
 * @notice Gas-optimized Merkle proof verification
 * @dev Compatible with the TypeScript Merkle tree implementation
 */
library MerkleVerifier {
    /// @notice Maximum proof length (tree depth)
    uint256 internal constant MAX_PROOF_LENGTH = 32;

    /**
     * @notice Verify a Merkle proof
     * @param proof Array of sibling hashes
     * @param root Expected Merkle root
     * @param leaf Leaf hash to verify
     * @param index Leaf index (determines left/right for each level)
     * @return True if proof is valid
     */
    function verify(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf,
        uint256 index
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; ) {
            bytes32 proofElement = proof[i];

            if (index & 1 == 1) {
                // Current is right child
                computedHash = _hashPair(proofElement, computedHash);
            } else {
                // Current is left child
                computedHash = _hashPair(computedHash, proofElement);
            }

            index >>= 1;

            unchecked {
                ++i;
            }
        }

        return computedHash == root;
    }

    /**
     * @notice Verify with path indices instead of numeric index
     * @param proof Array of sibling hashes
     * @param pathIndices Bitmap of path directions (1 = right)
     * @param root Expected Merkle root
     * @param leaf Leaf hash to verify
     * @return True if proof is valid
     */
    function verifyWithPath(
        bytes32[] calldata proof,
        uint256 pathIndices,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; ) {
            bytes32 proofElement = proof[i];

            if ((pathIndices >> i) & 1 == 1) {
                // Current is right child
                computedHash = _hashPair(proofElement, computedHash);
            } else {
                // Current is left child
                computedHash = _hashPair(computedHash, proofElement);
            }

            unchecked {
                ++i;
            }
        }

        return computedHash == root;
    }

    /**
     * @notice Hash two nodes together with domain separation
     * @dev Prefix with 0x01 to match TypeScript implementation
     */
    function _hashPair(bytes32 left, bytes32 right) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(bytes1(0x01), left, right));
    }
}
