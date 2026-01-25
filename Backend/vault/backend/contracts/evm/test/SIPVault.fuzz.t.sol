// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {SIPVault} from "../src/SIPVault.sol";
import {SIPSettlement} from "../src/SIPSettlement.sol";
import {MerkleVerifier} from "../src/MerkleVerifier.sol";

/**
 * @title MockERC20
 * @notice Simple mock ERC20 for fuzz testing
 */
contract MockERC20 {
    string public name = "Mock Token";
    string public symbol = "MOCK";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/**
 * @title SIPVaultFuzzTest
 * @notice Fuzz tests for the SIPVault contract
 * @dev Property-based tests using Foundry's fuzzing capabilities
 * 
 * Feature: codebase-review-optimization
 * Properties tested:
 * - Property 16: Vault Balance Tracking
 * - Property 17: Vault Insufficient Balance Rejection
 * - Property 18: Vault Replay Protection
 * - Property 19: Vault Pause Enforcement
 */
contract SIPVaultFuzzTest is Test {
    SIPVault public vault;
    SIPSettlement public settlement;
    MockERC20 public token;

    address public owner;
    address public user;

    // ============ Setup ============

    function setUp() public {
        owner = address(this);
        user = makeAddr("user");

        settlement = new SIPSettlement();
        vault = new SIPVault(address(settlement));
        token = new MockERC20();

        // Fund user with ETH and tokens
        vm.deal(user, 1000 ether);
        token.mint(user, 1000000 ether);
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

    // ============ Property 16: Vault Balance Tracking ============
    // **Validates: Requirements 5.1**
    // FOR ALL deposits, THE SIP_Vault SHALL correctly track token balances

    /**
     * @notice Fuzz test: Native ETH deposit balance tracking
     * @dev Property 16: Vault Balance Tracking
     * Feature: codebase-review-optimization, Property 16: Vault Balance Tracking
     * Validates: Requirements 5.1
     */
    function testFuzz_BalanceTracking_NativeDeposit(uint256 amount) public {
        // Bound amount to reasonable range (non-zero, within user balance)
        amount = bound(amount, 1, 100 ether);

        uint256 balanceBefore = vault.getBalance(address(0));

        vm.prank(user);
        vault.depositNative{value: amount}();

        uint256 balanceAfter = vault.getBalance(address(0));
        assertEq(balanceAfter, balanceBefore + amount, "Balance should increase by deposit amount");
    }

    /**
     * @notice Fuzz test: ERC20 token deposit balance tracking
     * @dev Property 16: Vault Balance Tracking
     * Feature: codebase-review-optimization, Property 16: Vault Balance Tracking
     * Validates: Requirements 5.1
     */
    function testFuzz_BalanceTracking_TokenDeposit(uint256 amount) public {
        // Bound amount to reasonable range
        amount = bound(amount, 1, 100000 ether);

        uint256 balanceBefore = vault.getBalance(address(token));

        vm.startPrank(user);
        token.approve(address(vault), amount);
        vault.depositToken(address(token), amount);
        vm.stopPrank();

        uint256 balanceAfter = vault.getBalance(address(token));
        assertEq(balanceAfter, balanceBefore + amount, "Token balance should increase by deposit amount");
    }

    /**
     * @notice Fuzz test: Multiple deposits accumulate correctly
     * @dev Property 16: Vault Balance Tracking
     * Feature: codebase-review-optimization, Property 16: Vault Balance Tracking
     * Validates: Requirements 5.1
     */
    function testFuzz_BalanceTracking_MultipleDeposits(uint256 amount1, uint256 amount2) public {
        // Bound amounts
        amount1 = bound(amount1, 1, 50 ether);
        amount2 = bound(amount2, 1, 50 ether);

        vm.startPrank(user);
        vault.depositNative{value: amount1}();
        vault.depositNative{value: amount2}();
        vm.stopPrank();

        assertEq(vault.getBalance(address(0)), amount1 + amount2, "Balance should be sum of deposits");
    }


    // ============ Property 17: Vault Insufficient Balance Rejection ============
    // **Validates: Requirements 5.2**
    // FOR ALL withdrawal attempts exceeding balance, THE SIP_Vault SHALL revert with InsufficientBalance

    /**
     * @notice Fuzz test: Withdrawal exceeding balance is rejected
     * @dev Property 17: Vault Insufficient Balance Rejection
     * Feature: codebase-review-optimization, Property 17: Vault Insufficient Balance Rejection
     * Validates: Requirements 5.2
     */
    function testFuzz_InsufficientBalanceRejection_Native(uint256 depositAmount, uint256 withdrawAmount) public {
        // Bound deposit to reasonable range
        depositAmount = bound(depositAmount, 1, 50 ether);
        // Ensure withdrawal exceeds deposit
        withdrawAmount = bound(withdrawAmount, depositAmount + 1, 100 ether);

        // Deposit first
        vm.prank(user);
        vault.depositNative{value: depositAmount}();

        // Compute withdrawal commitment
        bytes32 commitment = vault.computeWithdrawalCommitment(address(0), user, withdrawAmount);

        // Try to withdraw more than deposited - should fail
        vm.expectRevert(SIPVault.InsufficientBalance.selector);
        vault.executeAuthorizedWithdrawal(commitment, address(0), user, withdrawAmount);
    }

    /**
     * @notice Fuzz test: Token withdrawal exceeding balance is rejected
     * @dev Property 17: Vault Insufficient Balance Rejection
     * Feature: codebase-review-optimization, Property 17: Vault Insufficient Balance Rejection
     * Validates: Requirements 5.2
     */
    function testFuzz_InsufficientBalanceRejection_Token(uint256 depositAmount, uint256 withdrawAmount) public {
        // Bound deposit to reasonable range
        depositAmount = bound(depositAmount, 1, 50000 ether);
        // Ensure withdrawal exceeds deposit
        withdrawAmount = bound(withdrawAmount, depositAmount + 1, 100000 ether);

        // Deposit first
        vm.startPrank(user);
        token.approve(address(vault), depositAmount);
        vault.depositToken(address(token), depositAmount);
        vm.stopPrank();

        // Compute withdrawal commitment
        bytes32 commitment = vault.computeWithdrawalCommitment(address(token), user, withdrawAmount);

        // Try to withdraw more than deposited - should fail
        vm.expectRevert(SIPVault.InsufficientBalance.selector);
        vault.executeAuthorizedWithdrawal(commitment, address(token), user, withdrawAmount);
    }

    /**
     * @notice Fuzz test: Withdrawal from empty vault is rejected
     * @dev Property 17: Vault Insufficient Balance Rejection
     * Feature: codebase-review-optimization, Property 17: Vault Insufficient Balance Rejection
     * Validates: Requirements 5.2
     */
    function testFuzz_InsufficientBalanceRejection_EmptyVault(uint256 withdrawAmount) public {
        // Any non-zero withdrawal from empty vault should fail
        withdrawAmount = bound(withdrawAmount, 1, 100 ether);

        bytes32 commitment = vault.computeWithdrawalCommitment(address(0), user, withdrawAmount);

        vm.expectRevert(SIPVault.InsufficientBalance.selector);
        vault.executeAuthorizedWithdrawal(commitment, address(0), user, withdrawAmount);
    }


    // ============ Property 18: Vault Replay Protection ============
    // **Validates: Requirements 5.3**
    // FOR ALL used commitments, THE SIP_Vault SHALL reject subsequent withdrawal attempts

    /**
     * @notice Fuzz test: Replay protection prevents double withdrawal
     * @dev Property 18: Vault Replay Protection
     * Feature: codebase-review-optimization, Property 18: Vault Replay Protection
     * Validates: Requirements 5.3
     */
    function testFuzz_ReplayProtection_Native(uint256 depositAmount, uint256 withdrawAmount) public {
        // Bound amounts
        depositAmount = bound(depositAmount, 2 ether, 100 ether);
        withdrawAmount = bound(withdrawAmount, 1, depositAmount / 2);

        // Deposit
        vm.prank(user);
        vault.depositNative{value: depositAmount}();

        // Compute commitment
        bytes32 commitment = vault.computeWithdrawalCommitment(address(0), user, withdrawAmount);

        // First withdrawal should succeed
        vault.executeAuthorizedWithdrawal(commitment, address(0), user, withdrawAmount);
        assertTrue(vault.isCommitmentUsed(commitment), "Commitment should be marked as used");

        // Second withdrawal with same commitment should fail
        vm.expectRevert(SIPVault.CommitmentAlreadyUsed.selector);
        vault.executeAuthorizedWithdrawal(commitment, address(0), user, withdrawAmount);
    }

    /**
     * @notice Fuzz test: Replay protection for token withdrawals
     * @dev Property 18: Vault Replay Protection
     * Feature: codebase-review-optimization, Property 18: Vault Replay Protection
     * Validates: Requirements 5.3
     */
    function testFuzz_ReplayProtection_Token(uint256 depositAmount, uint256 withdrawAmount) public {
        // Bound amounts
        depositAmount = bound(depositAmount, 2 ether, 100000 ether);
        withdrawAmount = bound(withdrawAmount, 1, depositAmount / 2);

        // Deposit
        vm.startPrank(user);
        token.approve(address(vault), depositAmount);
        vault.depositToken(address(token), depositAmount);
        vm.stopPrank();

        // Compute commitment
        bytes32 commitment = vault.computeWithdrawalCommitment(address(token), user, withdrawAmount);

        // First withdrawal should succeed
        vault.executeAuthorizedWithdrawal(commitment, address(token), user, withdrawAmount);
        assertTrue(vault.isCommitmentUsed(commitment), "Commitment should be marked as used");

        // Second withdrawal with same commitment should fail
        vm.expectRevert(SIPVault.CommitmentAlreadyUsed.selector);
        vault.executeAuthorizedWithdrawal(commitment, address(token), user, withdrawAmount);
    }

    /**
     * @notice Fuzz test: Replay protection with Merkle proof withdrawal
     * @dev Property 18: Vault Replay Protection
     * Feature: codebase-review-optimization, Property 18: Vault Replay Protection
     * Validates: Requirements 5.3
     */
    function testFuzz_ReplayProtection_WithProof(uint256 depositAmount, uint256 withdrawAmount, bytes32 otherLeaf) public {
        // Bound amounts
        depositAmount = bound(depositAmount, 2 ether, 100 ether);
        withdrawAmount = bound(withdrawAmount, 1, depositAmount / 2);
        vm.assume(otherLeaf != bytes32(0));

        // Deposit
        vm.prank(user);
        vault.depositNative{value: depositAmount}();

        // Compute commitment
        bytes32 commitment = vault.computeWithdrawalCommitment(address(0), user, withdrawAmount);
        vm.assume(commitment != otherLeaf);

        // Build Merkle tree
        (bytes32 root, bytes32[] memory proof) = _buildTwoLeafTree(commitment, otherLeaf);

        // Set root on settlement
        settlement.setExecutor(address(this), true);
        settlement.updateRoot(root);

        // First withdrawal with proof should succeed
        vault.executeWithdrawal(commitment, address(0), user, withdrawAmount, proof, 0, root);
        assertTrue(vault.isCommitmentUsed(commitment), "Commitment should be marked as used");

        // Second withdrawal with same commitment should fail
        vm.expectRevert(SIPVault.CommitmentAlreadyUsed.selector);
        vault.executeWithdrawal(commitment, address(0), user, withdrawAmount, proof, 0, root);
    }


    // ============ Property 19: Vault Pause Enforcement ============
    // **Validates: Requirements 5.4**
    // WHEN paused, THE SIP_Vault SHALL reject all deposits and withdrawals

    /**
     * @notice Fuzz test: Native deposit rejected when paused
     * @dev Property 19: Vault Pause Enforcement
     * Feature: codebase-review-optimization, Property 19: Vault Pause Enforcement
     * Validates: Requirements 5.4
     */
    function testFuzz_PauseEnforcement_NativeDeposit(uint256 amount) public {
        amount = bound(amount, 1, 100 ether);

        // Pause the vault
        vault.pause();
        assertTrue(vault.paused(), "Vault should be paused");

        // Deposit should fail
        vm.prank(user);
        vm.expectRevert(SIPVault.ContractPaused.selector);
        vault.depositNative{value: amount}();
    }

    /**
     * @notice Fuzz test: Token deposit rejected when paused
     * @dev Property 19: Vault Pause Enforcement
     * Feature: codebase-review-optimization, Property 19: Vault Pause Enforcement
     * Validates: Requirements 5.4
     */
    function testFuzz_PauseEnforcement_TokenDeposit(uint256 amount) public {
        amount = bound(amount, 1, 100000 ether);

        // Approve first (before pause)
        vm.prank(user);
        token.approve(address(vault), amount);

        // Pause the vault
        vault.pause();

        // Deposit should fail
        vm.prank(user);
        vm.expectRevert(SIPVault.ContractPaused.selector);
        vault.depositToken(address(token), amount);
    }

    /**
     * @notice Fuzz test: Authorized withdrawal rejected when paused
     * @dev Property 19: Vault Pause Enforcement
     * Feature: codebase-review-optimization, Property 19: Vault Pause Enforcement
     * Validates: Requirements 5.4
     */
    function testFuzz_PauseEnforcement_AuthorizedWithdrawal(uint256 depositAmount, uint256 withdrawAmount) public {
        // Bound amounts
        depositAmount = bound(depositAmount, 2 ether, 100 ether);
        withdrawAmount = bound(withdrawAmount, 1, depositAmount);

        // Deposit first (before pause)
        vm.prank(user);
        vault.depositNative{value: depositAmount}();

        // Compute commitment
        bytes32 commitment = vault.computeWithdrawalCommitment(address(0), user, withdrawAmount);

        // Pause the vault
        vault.pause();

        // Withdrawal should fail
        vm.expectRevert(SIPVault.ContractPaused.selector);
        vault.executeAuthorizedWithdrawal(commitment, address(0), user, withdrawAmount);
    }

    /**
     * @notice Fuzz test: Proof-based withdrawal rejected when paused
     * @dev Property 19: Vault Pause Enforcement
     * Feature: codebase-review-optimization, Property 19: Vault Pause Enforcement
     * Validates: Requirements 5.4
     */
    function testFuzz_PauseEnforcement_ProofWithdrawal(uint256 depositAmount, uint256 withdrawAmount, bytes32 otherLeaf) public {
        // Bound amounts
        depositAmount = bound(depositAmount, 2 ether, 100 ether);
        withdrawAmount = bound(withdrawAmount, 1, depositAmount);
        vm.assume(otherLeaf != bytes32(0));

        // Deposit first
        vm.prank(user);
        vault.depositNative{value: depositAmount}();

        // Compute commitment
        bytes32 commitment = vault.computeWithdrawalCommitment(address(0), user, withdrawAmount);
        vm.assume(commitment != otherLeaf);

        // Build Merkle tree
        (bytes32 root, bytes32[] memory proof) = _buildTwoLeafTree(commitment, otherLeaf);

        // Set root on settlement
        settlement.setExecutor(address(this), true);
        settlement.updateRoot(root);

        // Pause the vault
        vault.pause();

        // Withdrawal should fail
        vm.expectRevert(SIPVault.ContractPaused.selector);
        vault.executeWithdrawal(commitment, address(0), user, withdrawAmount, proof, 0, root);
    }

    /**
     * @notice Fuzz test: Operations resume after unpause
     * @dev Property 19: Vault Pause Enforcement
     * Feature: codebase-review-optimization, Property 19: Vault Pause Enforcement
     * Validates: Requirements 5.4
     */
    function testFuzz_PauseEnforcement_ResumeAfterUnpause(uint256 amount) public {
        amount = bound(amount, 1, 100 ether);

        // Pause then unpause
        vault.pause();
        vault.unpause();
        assertFalse(vault.paused(), "Vault should be unpaused");

        // Deposit should work now
        vm.prank(user);
        vault.depositNative{value: amount}();

        assertEq(vault.getBalance(address(0)), amount, "Deposit should succeed after unpause");
    }
}
