// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {SIPVault} from "../src/SIPVault.sol";
import {SIPSettlement} from "../src/SIPSettlement.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";

/**
 * @title MockERC20
 * @notice Simple mock ERC20 for testing
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
 * @title SIPVaultTest
 * @notice Tests for the SIPVault contract
 */
contract SIPVaultTest is Test {
    SIPVault public vault;
    SIPSettlement public settlement;
    MockERC20 public token;
    
    address public owner;
    address public user;
    address public newOwner;

    function setUp() public {
        owner = address(this);
        user = makeAddr("user");
        newOwner = makeAddr("newOwner");

        settlement = new SIPSettlement();
        vault = new SIPVault(address(settlement));
        token = new MockERC20();

        // Fund user
        vm.deal(user, 100 ether);
        token.mint(user, 1000 ether);
    }

    function test_InitialState() public view {
        assertEq(vault.owner(), owner);
        assertEq(vault.settlementContract(), address(settlement));
        assertFalse(vault.paused());
    }

    function test_DepositNative() public {
        vm.prank(user);
        bytes32 commitment = vault.depositNative{value: 1 ether}();

        assertEq(vault.getBalance(address(0)), 1 ether);
        assertTrue(commitment != bytes32(0));
    }

    function test_DepositNative_ZeroAmount() public {
        vm.prank(user);
        vm.expectRevert(SIPVault.ZeroAmount.selector);
        vault.depositNative{value: 0}();
    }

    function test_DepositToken() public {
        vm.startPrank(user);
        token.approve(address(vault), 100 ether);
        bytes32 commitment = vault.depositToken(address(token), 100 ether);
        vm.stopPrank();

        assertEq(vault.getBalance(address(token)), 100 ether);
        assertTrue(commitment != bytes32(0));
    }

    function test_DepositToken_ZeroAmount() public {
        vm.startPrank(user);
        token.approve(address(vault), 100 ether);
        vm.expectRevert(SIPVault.ZeroAmount.selector);
        vault.depositToken(address(token), 0);
        vm.stopPrank();
    }

    function test_DirectTransferRejected() public {
        vm.prank(user);
        (bool success,) = address(vault).call{value: 1 ether}("");
        // The call returns false because receive() reverts
        assertFalse(success);
        // Balance should remain 0
        assertEq(vault.getBalance(address(0)), 0);
    }

    function test_TwoStepOwnershipTransfer() public {
        // Start transfer
        vault.transferOwnership(newOwner);
        assertEq(vault.pendingOwner(), newOwner);
        assertEq(vault.owner(), owner);

        // Accept transfer
        vm.prank(newOwner);
        vault.acceptOwnership();
        assertEq(vault.owner(), newOwner);
        assertEq(vault.pendingOwner(), address(0));
    }

    function test_TwoStepOwnershipTransfer_OnlyPendingCanAccept() public {
        vault.transferOwnership(newOwner);

        vm.prank(user);
        vm.expectRevert(SIPVault.Unauthorized.selector);
        vault.acceptOwnership();
    }

    function test_CancelOwnershipTransfer() public {
        vault.transferOwnership(newOwner);
        assertEq(vault.pendingOwner(), newOwner);

        vault.cancelOwnershipTransfer();
        assertEq(vault.pendingOwner(), address(0));
    }

    function test_Pause() public {
        vault.pause();
        assertTrue(vault.paused());

        vm.prank(user);
        vm.expectRevert(SIPVault.ContractPaused.selector);
        vault.depositNative{value: 1 ether}();
    }

    function test_Unpause() public {
        vault.pause();
        assertTrue(vault.paused());

        vault.unpause();
        assertFalse(vault.paused());

        // Should work now
        vm.prank(user);
        vault.depositNative{value: 1 ether}();
        assertEq(vault.getBalance(address(0)), 1 ether);
    }

    function test_Pause_OnlyOwner() public {
        vm.prank(user);
        vm.expectRevert(SIPVault.Unauthorized.selector);
        vault.pause();
    }

    function test_SetSettlementContract() public {
        address newSettlement = makeAddr("newSettlement");
        vault.setSettlementContract(newSettlement);
        assertEq(vault.settlementContract(), newSettlement);
    }

    function test_SetSettlementContract_ZeroAddress() public {
        vm.expectRevert(SIPVault.ZeroAddress.selector);
        vault.setSettlementContract(address(0));
    }

    function test_SetSettlementContract_OnlyOwner() public {
        vm.prank(user);
        vm.expectRevert(SIPVault.Unauthorized.selector);
        vault.setSettlementContract(makeAddr("newSettlement"));
    }

    function test_ExecuteAuthorizedWithdrawal() public {
        // Deposit first
        vm.prank(user);
        vault.depositNative{value: 10 ether}();

        // Compute commitment
        bytes32 commitment = vault.computeWithdrawalCommitment(address(0), user, 5 ether);

        // Execute withdrawal as owner (who is also settlement authorized)
        uint256 userBalanceBefore = user.balance;
        vault.executeAuthorizedWithdrawal(commitment, address(0), user, 5 ether);

        assertEq(vault.getBalance(address(0)), 5 ether);
        assertEq(user.balance, userBalanceBefore + 5 ether);
        assertTrue(vault.isCommitmentUsed(commitment));
    }

    function test_ExecuteAuthorizedWithdrawal_ReplayProtection() public {
        vm.prank(user);
        vault.depositNative{value: 10 ether}();

        bytes32 commitment = vault.computeWithdrawalCommitment(address(0), user, 5 ether);
        vault.executeAuthorizedWithdrawal(commitment, address(0), user, 5 ether);

        // Try again - should fail
        vm.expectRevert(SIPVault.CommitmentAlreadyUsed.selector);
        vault.executeAuthorizedWithdrawal(commitment, address(0), user, 5 ether);
    }

    function test_ExecuteAuthorizedWithdrawal_InsufficientBalance() public {
        vm.prank(user);
        vault.depositNative{value: 1 ether}();

        bytes32 commitment = vault.computeWithdrawalCommitment(address(0), user, 10 ether);

        vm.expectRevert(SIPVault.InsufficientBalance.selector);
        vault.executeAuthorizedWithdrawal(commitment, address(0), user, 10 ether);
    }

    function test_ExecuteAuthorizedWithdrawal_OnlySettlement() public {
        vm.prank(user);
        vault.depositNative{value: 10 ether}();

        bytes32 commitment = vault.computeWithdrawalCommitment(address(0), user, 5 ether);

        vm.prank(user);
        vm.expectRevert(SIPVault.Unauthorized.selector);
        vault.executeAuthorizedWithdrawal(commitment, address(0), user, 5 ether);
    }
}
