// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {SIPSettlement} from "../src/SIPSettlement.sol";
import {MerkleVerifier} from "../src/MerkleVerifier.sol";

/**
 * @title GasBenchmark
 * @notice Gas benchmarks for SIPSettlement contract operations
 * @dev Validates gas requirements from Requirements 6.1, 6.2, 6.3
 * 
 * Feature: codebase-review-optimization
 * Requirements tested:
 * - 6.1: Single settlement < 120,000 gas
 * - 6.2: Batch settlement (10 commitments) < 200,000 gas
 * - 6.3: Root update < 90,000 gas
 */
contract GasBenchmark is Test {
    SIPSettlement public settlement;
    address public owner;
    address public executor;

    // Gas limits from requirements
    uint256 constant SINGLE_SETTLEMENT_GAS_LIMIT = 120_000;
    uint256 constant BATCH_SETTLEMENT_GAS_LIMIT = 200_000;
    uint256 constant ROOT_UPDATE_GAS_LIMIT = 90_000;

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
     * @notice Build a simple 2-leaf Merkle tree
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
     * @notice Build a power-of-2 tree and return root
     */
    function _buildTree(bytes32[] memory leaves) internal pure returns (bytes32) {
        require(leaves.length > 0, "Empty leaves");
        
        bytes32[] memory currentLevel = leaves;
        while (currentLevel.length > 1) {
            uint256 nextLevelSize = currentLevel.length / 2;
            bytes32[] memory nextLevel = new bytes32[](nextLevelSize);
            for (uint256 i = 0; i < nextLevelSize; i++) {
                nextLevel[i] = _hashPair(currentLevel[i * 2], currentLevel[i * 2 + 1]);
            }
            currentLevel = nextLevel;
        }
        return currentLevel[0];
    }

    /**
     * @notice Build proof for a leaf in a power-of-2 tree
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
            uint256 siblingIndex = currentIndex ^ 1;
            proof[level] = currentLevel[siblingIndex];

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


    // ============ Requirement 6.1: Single Settlement Gas Benchmark ============
    // WHEN settling a single commitment, THE SIP_Settlement SHALL use less than 120,000 gas

    /**
     * @notice Benchmark gas for single settlement
     * @dev Requirement 6.1: Single settlement < 120,000 gas
     */
    function test_GasBenchmark_SingleSettlement() public {
        // Build a 16-leaf tree (realistic depth of 4)
        bytes32[] memory leaves = new bytes32[](16);
        for (uint256 i = 0; i < 16; i++) {
            leaves[i] = keccak256(abi.encodePacked("commitment", i));
        }
        
        bytes32 root = _buildTree(leaves);
        bytes32[] memory proof = _buildProofForLeaf(leaves, 0);

        vm.prank(executor);
        settlement.updateRoot(root);

        // Measure gas for single settlement
        uint256 gasBefore = gasleft();
        settlement.settle(leaves[0], proof, 0);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Single settlement gas used:", gasUsed);
        console.log("Gas limit:", SINGLE_SETTLEMENT_GAS_LIMIT);

        assertLt(gasUsed, SINGLE_SETTLEMENT_GAS_LIMIT, "Single settlement exceeds gas limit");
    }

    /**
     * @notice Benchmark gas for single settlement with deeper tree
     * @dev Tests with 32-leaf tree (depth 5) for more realistic scenario
     */
    function test_GasBenchmark_SingleSettlement_DeepTree() public {
        // Build a 32-leaf tree (depth 5)
        bytes32[] memory leaves = new bytes32[](32);
        for (uint256 i = 0; i < 32; i++) {
            leaves[i] = keccak256(abi.encodePacked("deep_commitment", i));
        }
        
        bytes32 root = _buildTree(leaves);
        bytes32[] memory proof = _buildProofForLeaf(leaves, 15);

        vm.prank(executor);
        settlement.updateRoot(root);

        uint256 gasBefore = gasleft();
        settlement.settle(leaves[15], proof, 15);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Single settlement (deep tree) gas used:", gasUsed);
        
        assertLt(gasUsed, SINGLE_SETTLEMENT_GAS_LIMIT, "Single settlement (deep tree) exceeds gas limit");
    }


    // ============ Requirement 6.2: Batch Settlement Gas Benchmark ============
    // WHEN settling a batch of 10 commitments, THE SIP_Settlement SHALL use less than 200,000 gas total

    /**
     * @notice Benchmark gas for batch settlement of 10 commitments
     * @dev Requirement 6.2: Batch settlement (10) < 200,000 gas
     */
    function test_GasBenchmark_BatchSettlement_10() public {
        // Build a 16-leaf tree (enough for 10 commitments)
        bytes32[] memory leaves = new bytes32[](16);
        for (uint256 i = 0; i < 16; i++) {
            leaves[i] = keccak256(abi.encodePacked("batch_commitment", i));
        }
        
        bytes32 root = _buildTree(leaves);

        vm.prank(executor);
        settlement.updateRoot(root);

        // Prepare batch of 10 commitments
        uint256 batchSize = 10;
        bytes32[] memory commitments = new bytes32[](batchSize);
        bytes32[][] memory proofs = new bytes32[][](batchSize);
        uint256[] memory indices = new uint256[](batchSize);

        for (uint256 i = 0; i < batchSize; i++) {
            commitments[i] = leaves[i];
            proofs[i] = _buildProofForLeaf(leaves, i);
            indices[i] = i;
        }

        // Measure gas for batch settlement
        uint256 gasBefore = gasleft();
        settlement.settleBatch(commitments, proofs, indices);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Batch settlement (10) gas used:", gasUsed);
        console.log("Gas limit:", BATCH_SETTLEMENT_GAS_LIMIT);
        console.log("Gas per commitment:", gasUsed / batchSize);

        assertLt(gasUsed, BATCH_SETTLEMENT_GAS_LIMIT, "Batch settlement exceeds gas limit");
    }

    /**
     * @notice Benchmark gas for batch settlement with varying sizes
     * @dev Tests batch sizes 5, 10, 15 to understand scaling
     */
    function test_GasBenchmark_BatchSettlement_Scaling() public {
        // Build a 32-leaf tree
        bytes32[] memory leaves = new bytes32[](32);
        for (uint256 i = 0; i < 32; i++) {
            leaves[i] = keccak256(abi.encodePacked("scaling_commitment", i));
        }
        
        bytes32 root = _buildTree(leaves);

        vm.prank(executor);
        settlement.updateRoot(root);

        // Test batch size 5
        {
            bytes32[] memory commitments = new bytes32[](5);
            bytes32[][] memory proofs = new bytes32[][](5);
            uint256[] memory indices = new uint256[](5);

            for (uint256 i = 0; i < 5; i++) {
                commitments[i] = leaves[i];
                proofs[i] = _buildProofForLeaf(leaves, i);
                indices[i] = i;
            }

            uint256 gasBefore = gasleft();
            settlement.settleBatch(commitments, proofs, indices);
            uint256 gasUsed = gasBefore - gasleft();

            console.log("Batch settlement (5) gas used:", gasUsed);
            console.log("Gas per commitment (5):", gasUsed / 5);
        }

        // Test batch size 10 (using leaves 5-14)
        {
            bytes32[] memory commitments = new bytes32[](10);
            bytes32[][] memory proofs = new bytes32[][](10);
            uint256[] memory indices = new uint256[](10);

            for (uint256 i = 0; i < 10; i++) {
                commitments[i] = leaves[i + 5];
                proofs[i] = _buildProofForLeaf(leaves, i + 5);
                indices[i] = i + 5;
            }

            uint256 gasBefore = gasleft();
            settlement.settleBatch(commitments, proofs, indices);
            uint256 gasUsed = gasBefore - gasleft();

            console.log("Batch settlement (10) gas used:", gasUsed);
            console.log("Gas per commitment (10):", gasUsed / 10);
        }
    }


    // ============ Requirement 6.3: Root Update Gas Benchmark ============
    // WHEN updating the root, THE SIP_Settlement SHALL use less than 90,000 gas

    /**
     * @notice Benchmark gas for root update
     * @dev Requirement 6.3: Root update < 90,000 gas
     */
    function test_GasBenchmark_RootUpdate() public {
        bytes32 newRoot = keccak256("new_root");

        vm.prank(executor);
        
        // Measure gas for root update
        uint256 gasBefore = gasleft();
        settlement.updateRoot(newRoot);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("Root update gas used:", gasUsed);
        console.log("Gas limit:", ROOT_UPDATE_GAS_LIMIT);

        assertLt(gasUsed, ROOT_UPDATE_GAS_LIMIT, "Root update exceeds gas limit");
    }

    /**
     * @notice Benchmark gas for multiple consecutive root updates
     * @dev Tests that gas remains consistent across updates
     */
    function test_GasBenchmark_RootUpdate_Multiple() public {
        vm.startPrank(executor);

        // First update (cold storage)
        bytes32 root1 = keccak256("root1");
        uint256 gasBefore1 = gasleft();
        settlement.updateRoot(root1);
        uint256 gasUsed1 = gasBefore1 - gasleft();
        console.log("Root update #1 gas used:", gasUsed1);

        // Second update (warm storage)
        bytes32 root2 = keccak256("root2");
        uint256 gasBefore2 = gasleft();
        settlement.updateRoot(root2);
        uint256 gasUsed2 = gasBefore2 - gasleft();
        console.log("Root update #2 gas used:", gasUsed2);

        // Third update
        bytes32 root3 = keccak256("root3");
        uint256 gasBefore3 = gasleft();
        settlement.updateRoot(root3);
        uint256 gasUsed3 = gasBefore3 - gasleft();
        console.log("Root update #3 gas used:", gasUsed3);

        vm.stopPrank();

        // All updates should be under the limit
        assertLt(gasUsed1, ROOT_UPDATE_GAS_LIMIT, "Root update #1 exceeds gas limit");
        assertLt(gasUsed2, ROOT_UPDATE_GAS_LIMIT, "Root update #2 exceeds gas limit");
        assertLt(gasUsed3, ROOT_UPDATE_GAS_LIMIT, "Root update #3 exceeds gas limit");
    }

    // ============ Summary Benchmark ============

    /**
     * @notice Run all benchmarks and print summary
     * @dev Useful for quick gas analysis
     */
    function test_GasBenchmark_Summary() public {
        console.log("=== Gas Benchmark Summary ===");
        console.log("");

        // Setup tree
        bytes32[] memory leaves = new bytes32[](16);
        for (uint256 i = 0; i < 16; i++) {
            leaves[i] = keccak256(abi.encodePacked("summary_commitment", i));
        }
        bytes32 root = _buildTree(leaves);

        // 1. Root Update
        vm.prank(executor);
        uint256 gasBefore = gasleft();
        settlement.updateRoot(root);
        uint256 rootUpdateGas = gasBefore - gasleft();
        console.log("Root Update Gas:", rootUpdateGas, "/ Limit:", ROOT_UPDATE_GAS_LIMIT);

        // 2. Single Settlement
        bytes32[] memory proof = _buildProofForLeaf(leaves, 0);
        gasBefore = gasleft();
        settlement.settle(leaves[0], proof, 0);
        uint256 singleSettleGas = gasBefore - gasleft();
        console.log("Single Settlement Gas:", singleSettleGas, "/ Limit:", SINGLE_SETTLEMENT_GAS_LIMIT);

        // 3. Batch Settlement (10)
        bytes32[] memory commitments = new bytes32[](10);
        bytes32[][] memory proofs = new bytes32[][](10);
        uint256[] memory indices = new uint256[](10);
        for (uint256 i = 1; i <= 10; i++) {
            commitments[i - 1] = leaves[i];
            proofs[i - 1] = _buildProofForLeaf(leaves, i);
            indices[i - 1] = i;
        }
        gasBefore = gasleft();
        settlement.settleBatch(commitments, proofs, indices);
        uint256 batchSettleGas = gasBefore - gasleft();
        console.log("Batch Settlement (10) Gas:", batchSettleGas, "/ Limit:", BATCH_SETTLEMENT_GAS_LIMIT);

        console.log("");
        console.log("=== Results ===");
        console.log("Root Update:", rootUpdateGas < ROOT_UPDATE_GAS_LIMIT ? "PASS" : "FAIL");
        console.log("Single Settlement:", singleSettleGas < SINGLE_SETTLEMENT_GAS_LIMIT ? "PASS" : "FAIL");
        console.log("Batch Settlement:", batchSettleGas < BATCH_SETTLEMENT_GAS_LIMIT ? "PASS" : "FAIL");

        // Assert all pass
        assertLt(rootUpdateGas, ROOT_UPDATE_GAS_LIMIT);
        assertLt(singleSettleGas, SINGLE_SETTLEMENT_GAS_LIMIT);
        assertLt(batchSettleGas, BATCH_SETTLEMENT_GAS_LIMIT);
    }
}
