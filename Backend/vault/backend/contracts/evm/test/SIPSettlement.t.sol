// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {SIPSettlement} from "../src/SIPSettlement.sol";
import {MerkleVerifier} from "../src/MerkleVerifier.sol";

/**
 * @title SIPSettlementTest
 * @notice Tests for the SIPSettlement contract
 */
contract SIPSettlementTest is Test {
    SIPSettlement public settlement;
    address public owner;
    address public executor;
    address public user;
    address public newOwner;

    function setUp() public {
        owner = address(this);
        executor = makeAddr("executor");
        user = makeAddr("user");
        newOwner = makeAddr("newOwner");

        settlement = new SIPSettlement();
        settlement.setExecutor(executor, true);
    }

    function test_InitialState() public view {
        assertEq(settlement.owner(), owner);
        assertEq(settlement.currentBatchId(), 0);
        assertEq(settlement.currentRoot(), bytes32(0));
        assertTrue(settlement.authorizedExecutors(owner));
    }

    function test_UpdateRoot() public {
        bytes32 newRoot = keccak256("test root");
        
        vm.prank(executor);
        uint256 batchId = settlement.updateRoot(newRoot);

        assertEq(batchId, 1);
        assertEq(settlement.currentRoot(), newRoot);
        assertEq(settlement.batchRoots(1), newRoot);
        assertEq(settlement.currentBatchId(), 1);
    }

    function test_UpdateRoot_OnlyExecutor() public {
        bytes32 newRoot = keccak256("test root");
        
        vm.prank(user);
        vm.expectRevert(SIPSettlement.Unauthorized.selector);
        settlement.updateRoot(newRoot);
    }

    function test_UpdateRoot_InvalidZero() public {
        vm.prank(executor);
        vm.expectRevert(SIPSettlement.InvalidRoot.selector);
        settlement.updateRoot(bytes32(0));
    }

    function test_Settle_Simple() public {
        // Build a simple tree with 2 leaves
        bytes32 leaf1 = keccak256("commitment1");
        bytes32 leaf2 = keccak256("commitment2");
        
        // Compute parent hash (matching TypeScript implementation)
        bytes32 parent = _hashPair(leaf1, leaf2);
        
        // Set root
        vm.prank(executor);
        settlement.updateRoot(parent);

        // Build proof for leaf1 (index 0)
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaf2;

        // Settle
        settlement.settle(leaf1, proof, 0);

        // Check it's marked as used
        assertTrue(settlement.usedCommitments(leaf1));
    }

    function test_Settle_ReplayProtection() public {
        bytes32 leaf1 = keccak256("commitment1");
        bytes32 leaf2 = keccak256("commitment2");
        bytes32 parent = _hashPair(leaf1, leaf2);
        
        vm.prank(executor);
        settlement.updateRoot(parent);

        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaf2;

        // First settle succeeds
        settlement.settle(leaf1, proof, 0);

        // Second settle fails
        vm.expectRevert(SIPSettlement.CommitmentAlreadyUsed.selector);
        settlement.settle(leaf1, proof, 0);
    }

    function test_Settle_InvalidProof() public {
        bytes32 leaf1 = keccak256("commitment1");
        bytes32 leaf2 = keccak256("commitment2");
        bytes32 parent = _hashPair(leaf1, leaf2);
        
        vm.prank(executor);
        settlement.updateRoot(parent);

        // Wrong proof
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = keccak256("wrong");

        vm.expectRevert(SIPSettlement.InvalidProof.selector);
        settlement.settle(leaf1, proof, 0);
    }

    function test_Settle_EmptyProof() public {
        bytes32 leaf1 = keccak256("commitment1");
        
        vm.prank(executor);
        settlement.updateRoot(leaf1);

        bytes32[] memory proof = new bytes32[](0);

        vm.expectRevert(SIPSettlement.EmptyProof.selector);
        settlement.settle(leaf1, proof, 0);
    }

    function test_VerifyCommitment() public {
        bytes32 leaf1 = keccak256("commitment1");
        bytes32 leaf2 = keccak256("commitment2");
        bytes32 parent = _hashPair(leaf1, leaf2);
        
        vm.prank(executor);
        settlement.updateRoot(parent);

        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaf2;

        (bool valid, bool used) = settlement.verifyCommitment(leaf1, proof, 0);
        assertTrue(valid);
        assertFalse(used);

        // Settle and check again
        settlement.settle(leaf1, proof, 0);
        (valid, used) = settlement.verifyCommitment(leaf1, proof, 0);
        assertTrue(valid);
        assertTrue(used);
    }

    function test_BatchSettle() public {
        // Build tree with 4 leaves
        bytes32 leaf1 = keccak256("c1");
        bytes32 leaf2 = keccak256("c2");
        bytes32 leaf3 = keccak256("c3");
        bytes32 leaf4 = keccak256("c4");

        bytes32 left = _hashPair(leaf1, leaf2);
        bytes32 right = _hashPair(leaf3, leaf4);
        bytes32 root = _hashPair(left, right);

        vm.prank(executor);
        settlement.updateRoot(root);

        // Prepare batch
        bytes32[] memory commitments = new bytes32[](2);
        commitments[0] = leaf1;
        commitments[1] = leaf3;

        bytes32[][] memory proofs = new bytes32[][](2);
        proofs[0] = new bytes32[](2);
        proofs[0][0] = leaf2;
        proofs[0][1] = right;

        proofs[1] = new bytes32[](2);
        proofs[1][0] = leaf4;
        proofs[1][1] = left;

        uint256[] memory indices = new uint256[](2);
        indices[0] = 0;
        indices[1] = 2;

        // Batch settle
        settlement.settleBatch(commitments, proofs, indices);

        assertTrue(settlement.usedCommitments(leaf1));
        assertTrue(settlement.usedCommitments(leaf3));
        assertFalse(settlement.usedCommitments(leaf2));
        assertFalse(settlement.usedCommitments(leaf4));
    }

    function test_BatchSettle_TooLarge() public {
        bytes32[] memory commitments = new bytes32[](101);
        bytes32[][] memory proofs = new bytes32[][](101);
        uint256[] memory indices = new uint256[](101);

        vm.expectRevert(SIPSettlement.BatchTooLarge.selector);
        settlement.settleBatch(commitments, proofs, indices);
    }

    function test_BatchSettle_LengthMismatch() public {
        bytes32[] memory commitments = new bytes32[](2);
        bytes32[][] memory proofs = new bytes32[][](1);
        uint256[] memory indices = new uint256[](2);

        vm.expectRevert(SIPSettlement.LengthMismatch.selector);
        settlement.settleBatch(commitments, proofs, indices);
    }

    function test_TwoStepOwnershipTransfer() public {
        // Start transfer
        settlement.transferOwnership(newOwner);
        assertEq(settlement.pendingOwner(), newOwner);
        assertEq(settlement.owner(), owner);

        // Accept transfer
        vm.prank(newOwner);
        settlement.acceptOwnership();
        assertEq(settlement.owner(), newOwner);
        assertEq(settlement.pendingOwner(), address(0));
    }

    function test_TwoStepOwnershipTransfer_OnlyPendingCanAccept() public {
        settlement.transferOwnership(newOwner);

        vm.prank(user);
        vm.expectRevert(SIPSettlement.Unauthorized.selector);
        settlement.acceptOwnership();
    }

    function test_CancelOwnershipTransfer() public {
        settlement.transferOwnership(newOwner);
        assertEq(settlement.pendingOwner(), newOwner);

        settlement.cancelOwnershipTransfer();
        assertEq(settlement.pendingOwner(), address(0));
    }

    function test_TransferOwnership_ZeroAddress() public {
        vm.expectRevert(SIPSettlement.ZeroAddress.selector);
        settlement.transferOwnership(address(0));
    }

    // Helper to match TypeScript Merkle implementation
    function _hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(bytes1(0x01), a, b));
    }
}
