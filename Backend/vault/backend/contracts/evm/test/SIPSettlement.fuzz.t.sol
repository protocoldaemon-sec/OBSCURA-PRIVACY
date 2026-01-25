// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {SIPSettlement} from "../src/SIPSettlement.sol";
import {MerkleVerifier} from "../src/MerkleVerifier.sol";

/**
 * @title SIPSettlementFuzzTest
 * @notice Fuzz tests for the SIPSettlement contract
 * @dev Property-based tests using Foundry's fuzzing capabilities
 * 
 * Feature: codebase-review-optimization
 * Properties tested:
 * - Property 12: Settlement Replay Protection
 * - Property 13: Settlement Invalid Proof Rejection
 * - Property 14: Settlement Access Control
 * - Property 15: Settlement Batch Size Limit
 */
contract SIPSettlementFuzzTest is Test {
    SIPSettlement public settlement;
    address public owner;
    address public executor;

    // ============ Setup ============

    function setUp() public {
        owner = address(this);
        executor = makeAddr("executor");

        settlement = new SIPSettlement();
        settlement.setExecutor(executor, true);
    }

    // ============ Merkle Tree Helpers ============

    /**
     * @notice Hash two nodes together with domain separation
     * @dev Matches TypeScript implementation with 0x01 prefix
     */
    function _hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(bytes1(0x01), a, b));
    }

    /**
     * @notice Build a simple 2-leaf Merkle tree and return root + proof for leaf at index 0
     */
    function _buildTwoLeafTree(bytes32 leaf1, bytes32 leaf2)
        internal
        pure
        returns (bytes32 root, bytes32[] memory proof)
    {
        root = _hashPair(leaf1, leaf2);
        proof = new bytes32[](1);
        proof[0] = leaf2;
    }


    /**
     * @notice Build a 4-leaf Merkle tree and return root + proofs for all leaves
     */
    function _buildFourLeafTree(bytes32 leaf1, bytes32 leaf2, bytes32 leaf3, bytes32 leaf4)
        internal
        pure
        returns (
            bytes32 root,
            bytes32[] memory proof0,
            bytes32[] memory proof1,
            bytes32[] memory proof2,
            bytes32[] memory proof3
        )
    {
        bytes32 left = _hashPair(leaf1, leaf2);
        bytes32 right = _hashPair(leaf3, leaf4);
        root = _hashPair(left, right);

        // Proof for leaf1 (index 0)
        proof0 = new bytes32[](2);
        proof0[0] = leaf2;
        proof0[1] = right;

        // Proof for leaf2 (index 1)
        proof1 = new bytes32[](2);
        proof1[0] = leaf1;
        proof1[1] = right;

        // Proof for leaf3 (index 2)
        proof2 = new bytes32[](2);
        proof2[0] = leaf4;
        proof2[1] = left;

        // Proof for leaf4 (index 3)
        proof3 = new bytes32[](2);
        proof3[0] = leaf3;
        proof3[1] = left;
    }

    // ============ Property 12: Settlement Replay Protection ============
    // **Validates: Requirements 4.1**
    // FOR ALL settled commitments, THE SIP_Settlement SHALL reject subsequent
    // settlement attempts with the same commitment

    /**
     * @notice Fuzz test: Replay protection prevents double settlement
     * @dev Property 12: Settlement Replay Protection
     * Feature: codebase-review-optimization, Property 12: Settlement Replay Protection
     * Validates: Requirements 4.1
     */
    function testFuzz_ReplayProtection(bytes32 commitment1, bytes32 commitment2) public {
        // Ensure distinct commitments for valid tree
        vm.assume(commitment1 != bytes32(0) && commitment2 != bytes32(0));
        vm.assume(commitment1 != commitment2);

        // Build tree and set root
        (bytes32 root, bytes32[] memory proof) = _buildTwoLeafTree(commitment1, commitment2);
        
        vm.prank(executor);
        settlement.updateRoot(root);

        // First settlement should succeed
        settlement.settle(commitment1, proof, 0);
        assertTrue(settlement.usedCommitments(commitment1), "Commitment should be marked as used");

        // Second settlement with same commitment should fail
        vm.expectRevert(SIPSettlement.CommitmentAlreadyUsed.selector);
        settlement.settle(commitment1, proof, 0);
    }


    /**
     * @notice Fuzz test: Replay protection works across different batches
     * @dev Property 12: Settlement Replay Protection
     * Feature: codebase-review-optimization, Property 12: Settlement Replay Protection
     * Validates: Requirements 4.1
     */
    function testFuzz_ReplayProtectionAcrossBatches(
        bytes32 commitment1,
        bytes32 commitment2,
        bytes32 commitment3,
        bytes32 commitment4
    ) public {
        // Ensure distinct commitments
        vm.assume(commitment1 != bytes32(0) && commitment2 != bytes32(0));
        vm.assume(commitment3 != bytes32(0) && commitment4 != bytes32(0));
        vm.assume(commitment1 != commitment2 && commitment3 != commitment4);
        vm.assume(commitment1 != commitment3 && commitment1 != commitment4);

        // Build first tree and settle
        (bytes32 root1, bytes32[] memory proof1) = _buildTwoLeafTree(commitment1, commitment2);
        vm.prank(executor);
        settlement.updateRoot(root1);
        settlement.settle(commitment1, proof1, 0);

        // Build second tree with same commitment1
        (bytes32 root2, bytes32[] memory proof2) = _buildTwoLeafTree(commitment1, commitment3);
        vm.prank(executor);
        settlement.updateRoot(root2);

        // Should still fail even with new root
        vm.expectRevert(SIPSettlement.CommitmentAlreadyUsed.selector);
        settlement.settle(commitment1, proof2, 0);
    }

    // ============ Property 13: Settlement Invalid Proof Rejection ============
    // **Validates: Requirements 4.2**
    // FOR ALL invalid Merkle proofs, THE SIP_Settlement SHALL reject settlement

    /**
     * @notice Fuzz test: Invalid proof is rejected
     * @dev Property 13: Settlement Invalid Proof Rejection
     * Feature: codebase-review-optimization, Property 13: Settlement Invalid Proof Rejection
     * Validates: Requirements 4.2
     */
    function testFuzz_InvalidProofRejection(
        bytes32 commitment,
        bytes32 wrongSibling,
        bytes32 actualSibling
    ) public {
        vm.assume(commitment != bytes32(0) && actualSibling != bytes32(0));
        vm.assume(wrongSibling != actualSibling);

        // Build valid tree
        (bytes32 root, ) = _buildTwoLeafTree(commitment, actualSibling);
        
        vm.prank(executor);
        settlement.updateRoot(root);

        // Create invalid proof with wrong sibling
        bytes32[] memory invalidProof = new bytes32[](1);
        invalidProof[0] = wrongSibling;

        // Should reject invalid proof
        vm.expectRevert(SIPSettlement.InvalidProof.selector);
        settlement.settle(commitment, invalidProof, 0);
    }


    /**
     * @notice Fuzz test: Wrong leaf index causes proof rejection
     * @dev Property 13: Settlement Invalid Proof Rejection
     * Feature: codebase-review-optimization, Property 13: Settlement Invalid Proof Rejection
     * Validates: Requirements 4.2
     */
    function testFuzz_WrongLeafIndexRejection(bytes32 commitment1, bytes32 commitment2) public {
        vm.assume(commitment1 != bytes32(0) && commitment2 != bytes32(0));
        vm.assume(commitment1 != commitment2);

        // Build tree
        (bytes32 root, bytes32[] memory proof) = _buildTwoLeafTree(commitment1, commitment2);
        
        vm.prank(executor);
        settlement.updateRoot(root);

        // Try to settle with wrong index (1 instead of 0)
        vm.expectRevert(SIPSettlement.InvalidProof.selector);
        settlement.settle(commitment1, proof, 1);
    }

    /**
     * @notice Fuzz test: Commitment not in tree is rejected
     * @dev Property 13: Settlement Invalid Proof Rejection
     * Feature: codebase-review-optimization, Property 13: Settlement Invalid Proof Rejection
     * Validates: Requirements 4.2
     */
    function testFuzz_CommitmentNotInTreeRejection(
        bytes32 commitment1,
        bytes32 commitment2,
        bytes32 fakeCommitment
    ) public {
        vm.assume(commitment1 != bytes32(0) && commitment2 != bytes32(0));
        vm.assume(fakeCommitment != bytes32(0));
        vm.assume(commitment1 != commitment2);
        vm.assume(fakeCommitment != commitment1 && fakeCommitment != commitment2);

        // Build tree with commitment1 and commitment2
        (bytes32 root, bytes32[] memory proof) = _buildTwoLeafTree(commitment1, commitment2);
        
        vm.prank(executor);
        settlement.updateRoot(root);

        // Try to settle fakeCommitment using proof for commitment1
        vm.expectRevert(SIPSettlement.InvalidProof.selector);
        settlement.settle(fakeCommitment, proof, 0);
    }

    // ============ Property 14: Settlement Access Control ============
    // **Validates: Requirements 4.3**
    // WHEN a non-executor calls updateRoot, THE SIP_Settlement SHALL revert with Unauthorized

    /**
     * @notice Fuzz test: Non-executor cannot update root
     * @dev Property 14: Settlement Access Control
     * Feature: codebase-review-optimization, Property 14: Settlement Access Control
     * Validates: Requirements 4.3
     */
    function testFuzz_AccessControl_UpdateRoot(address caller, bytes32 newRoot) public {
        vm.assume(caller != owner && caller != executor);
        vm.assume(caller != address(0));
        vm.assume(newRoot != bytes32(0));

        vm.prank(caller);
        vm.expectRevert(SIPSettlement.Unauthorized.selector);
        settlement.updateRoot(newRoot);
    }


    /**
     * @notice Fuzz test: Authorized executor can update root
     * @dev Property 14: Settlement Access Control
     * Feature: codebase-review-optimization, Property 14: Settlement Access Control
     * Validates: Requirements 4.3
     */
    function testFuzz_AccessControl_AuthorizedExecutor(bytes32 newRoot) public {
        vm.assume(newRoot != bytes32(0));

        // Executor should succeed
        vm.prank(executor);
        uint256 batchId = settlement.updateRoot(newRoot);
        
        assertEq(settlement.currentRoot(), newRoot);
        assertEq(batchId, 1);
    }

    /**
     * @notice Fuzz test: Owner can always update root
     * @dev Property 14: Settlement Access Control
     * Feature: codebase-review-optimization, Property 14: Settlement Access Control
     * Validates: Requirements 4.3
     */
    function testFuzz_AccessControl_OwnerCanUpdateRoot(bytes32 newRoot) public {
        vm.assume(newRoot != bytes32(0));

        // Owner should succeed (owner is also authorized by default)
        uint256 batchId = settlement.updateRoot(newRoot);
        
        assertEq(settlement.currentRoot(), newRoot);
        assertEq(batchId, 1);
    }

    /**
     * @notice Fuzz test: Revoked executor cannot update root
     * @dev Property 14: Settlement Access Control
     * Feature: codebase-review-optimization, Property 14: Settlement Access Control
     * Validates: Requirements 4.3
     */
    function testFuzz_AccessControl_RevokedExecutor(bytes32 newRoot) public {
        vm.assume(newRoot != bytes32(0));

        // Revoke executor
        settlement.setExecutor(executor, false);

        // Revoked executor should fail
        vm.prank(executor);
        vm.expectRevert(SIPSettlement.Unauthorized.selector);
        settlement.updateRoot(newRoot);
    }

    // ============ Property 15: Settlement Batch Size Limit ============
    // **Validates: Requirements 4.4**
    // FOR ALL batch settlements larger than MAX_BATCH_SIZE (100), 
    // settleBatch SHALL revert with BatchTooLarge

    /**
     * @notice Fuzz test: Batch size limit is enforced
     * @dev Property 15: Settlement Batch Size Limit
     * Feature: codebase-review-optimization, Property 15: Settlement Batch Size Limit
     * Validates: Requirements 4.4
     */
    function testFuzz_BatchSizeLimit(uint8 extraSize) public {
        // Create batch larger than MAX_BATCH_SIZE (100)
        uint256 batchSize = 101 + uint256(extraSize);
        
        bytes32[] memory commitments = new bytes32[](batchSize);
        bytes32[][] memory proofs = new bytes32[][](batchSize);
        uint256[] memory indices = new uint256[](batchSize);

        // Fill with dummy data (doesn't matter, should fail before verification)
        for (uint256 i = 0; i < batchSize; i++) {
            commitments[i] = keccak256(abi.encodePacked(i));
            proofs[i] = new bytes32[](1);
            proofs[i][0] = bytes32(0);
            indices[i] = i;
        }

        vm.expectRevert(SIPSettlement.BatchTooLarge.selector);
        settlement.settleBatch(commitments, proofs, indices);
    }


    /**
     * @notice Fuzz test: Batch at exactly MAX_BATCH_SIZE is allowed
     * @dev Property 15: Settlement Batch Size Limit
     * Feature: codebase-review-optimization, Property 15: Settlement Batch Size Limit
     * Validates: Requirements 4.4
     */
    function testFuzz_BatchSizeAtLimit(uint8 seed) public {
        // Use seed to generate unique commitments
        uint256 batchSize = 100; // Exactly MAX_BATCH_SIZE
        
        // Build a tree with 128 leaves (next power of 2 >= 100)
        bytes32[] memory leaves = new bytes32[](128);
        for (uint256 i = 0; i < 128; i++) {
            leaves[i] = keccak256(abi.encodePacked(seed, i));
        }

        // Build tree bottom-up
        bytes32[] memory currentLevel = leaves;
        while (currentLevel.length > 1) {
            uint256 nextLevelSize = currentLevel.length / 2;
            bytes32[] memory nextLevel = new bytes32[](nextLevelSize);
            for (uint256 i = 0; i < nextLevelSize; i++) {
                nextLevel[i] = _hashPair(currentLevel[i * 2], currentLevel[i * 2 + 1]);
            }
            currentLevel = nextLevel;
        }
        bytes32 root = currentLevel[0];

        vm.prank(executor);
        settlement.updateRoot(root);

        // Prepare batch of 100 commitments (first 100 leaves)
        bytes32[] memory commitments = new bytes32[](batchSize);
        bytes32[][] memory proofs = new bytes32[][](batchSize);
        uint256[] memory indices = new uint256[](batchSize);

        for (uint256 i = 0; i < batchSize; i++) {
            commitments[i] = leaves[i];
            proofs[i] = _buildProofForLeaf(leaves, i);
            indices[i] = i;
        }

        // Should not revert with BatchTooLarge
        settlement.settleBatch(commitments, proofs, indices);

        // Verify all commitments are marked as used
        for (uint256 i = 0; i < batchSize; i++) {
            assertTrue(settlement.usedCommitments(commitments[i]));
        }
    }

    /**
     * @notice Helper to build proof for a leaf in a power-of-2 tree
     */
    function _buildProofForLeaf(bytes32[] memory leaves, uint256 leafIndex)
        internal
        pure
        returns (bytes32[] memory)
    {
        uint256 treeDepth = _log2(leaves.length);
        bytes32[] memory proof = new bytes32[](treeDepth);
        
        bytes32[] memory currentLevel = leaves;
        uint256 currentIndex = leafIndex;

        for (uint256 level = 0; level < treeDepth; level++) {
            // Get sibling index
            uint256 siblingIndex = currentIndex ^ 1;
            proof[level] = currentLevel[siblingIndex];

            // Move to next level
            uint256 nextLevelSize = currentLevel.length / 2;
            bytes32[] memory nextLevel = new bytes32[](nextLevelSize);
            for (uint256 i = 0; i < nextLevelSize; i++) {
                nextLevel[i] = _hashPair(currentLevel[i * 2], currentLevel[i * 2 + 1]);
            }
            currentLevel = nextLevel;
            currentIndex = currentIndex / 2;
        }

        return proof;
    }

    /**
     * @notice Calculate log2 of a power of 2
     */
    function _log2(uint256 x) internal pure returns (uint256) {
        uint256 result = 0;
        while (x > 1) {
            x >>= 1;
            result++;
        }
        return result;
    }

    /**
     * @notice Fuzz test: Batch below limit works correctly
     * @dev Property 15: Settlement Batch Size Limit
     * Feature: codebase-review-optimization, Property 15: Settlement Batch Size Limit
     * Validates: Requirements 4.4
     */
    function testFuzz_BatchBelowLimit(uint8 batchSizeSeed) public {
        // Ensure batch size is between 1 and 99
        uint256 batchSize = (uint256(batchSizeSeed) % 99) + 1;
        
        // Round up to next power of 2 for tree
        uint256 treeSize = 1;
        while (treeSize < batchSize) {
            treeSize *= 2;
        }
        if (treeSize < 2) treeSize = 2;

        // Build leaves
        bytes32[] memory leaves = new bytes32[](treeSize);
        for (uint256 i = 0; i < treeSize; i++) {
            leaves[i] = keccak256(abi.encodePacked(batchSizeSeed, i));
        }

        // Build tree
        bytes32[] memory currentLevel = leaves;
        while (currentLevel.length > 1) {
            uint256 nextLevelSize = currentLevel.length / 2;
            bytes32[] memory nextLevel = new bytes32[](nextLevelSize);
            for (uint256 i = 0; i < nextLevelSize; i++) {
                nextLevel[i] = _hashPair(currentLevel[i * 2], currentLevel[i * 2 + 1]);
            }
            currentLevel = nextLevel;
        }
        bytes32 root = currentLevel[0];

        vm.prank(executor);
        settlement.updateRoot(root);

        // Prepare batch
        bytes32[] memory commitments = new bytes32[](batchSize);
        bytes32[][] memory proofs = new bytes32[][](batchSize);
        uint256[] memory indices = new uint256[](batchSize);

        for (uint256 i = 0; i < batchSize; i++) {
            commitments[i] = leaves[i];
            proofs[i] = _buildProofForLeaf(leaves, i);
            indices[i] = i;
        }

        // Should succeed
        settlement.settleBatch(commitments, proofs, indices);
    }
}
