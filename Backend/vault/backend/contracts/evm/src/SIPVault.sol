// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MerkleVerifier} from "./MerkleVerifier.sol";
import {IERC20} from "./interfaces/IERC20.sol";

/**
 * @title SIPVault
 * @notice Asset custody with commitment-based access control
 * @dev Holds assets and releases them based on verified commitments
 *      from the SIPSettlement contract.
 *      
 *      Key security properties:
 *      - Assets can only be released with valid Merkle proof
 *      - Commitments can only be used once (replay protection)
 *      - Settlement contract is the only authority for releases
 */
contract SIPVault {
    using MerkleVerifier for bytes32[];

    // ============ Events ============

    event Deposited(
        address indexed depositor,
        address indexed token,
        uint256 amount,
        bytes32 indexed depositCommitment
    );

    event Withdrawn(
        bytes32 indexed commitment,
        address indexed token,
        address indexed recipient,
        uint256 amount
    );

    event SettlementContractUpdated(address indexed oldContract, address indexed newContract);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    // ============ Errors ============

    error Unauthorized();
    error InvalidProof();
    error CommitmentAlreadyUsed();
    error InsufficientBalance();
    error TransferFailed();
    error ZeroAmount();
    error ZeroAddress();
    error ContractPaused();
    error DirectTransferNotAllowed();

    // ============ State ============

    /// @notice Contract owner
    address public owner;

    /// @notice Pending owner for two-step transfer
    address public pendingOwner;

    /// @notice Settlement contract that can authorize withdrawals
    address public settlementContract;

    /// @notice Pause state for emergency
    bool public paused;

    /// @notice Nonce for unique withdrawal commitments
    uint256 public withdrawalNonce;

    /// @notice Token balances (token => balance)
    mapping(address => uint256) public tokenBalances;

    /// @notice Used withdrawal commitments
    mapping(bytes32 => bool) public usedCommitments;

    /// @notice Native ETH address constant
    address public constant NATIVE_TOKEN = address(0);

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlySettlement() {
        if (msg.sender != settlementContract && msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    // ============ Constructor ============

    constructor(address _settlementContract) {
        if (_settlementContract == address(0)) revert ZeroAddress();
        owner = msg.sender;
        settlementContract = _settlementContract;
        withdrawalNonce = 0;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update settlement contract
     * @param newSettlementContract New settlement contract address
     */
    function setSettlementContract(address newSettlementContract) external onlyOwner {
        if (newSettlementContract == address(0)) revert ZeroAddress();
        emit SettlementContractUpdated(settlementContract, newSettlementContract);
        settlementContract = newSettlementContract;
    }

    /**
     * @notice Start ownership transfer (two-step pattern)
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /**
     * @notice Accept ownership transfer
     */
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert Unauthorized();
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    /**
     * @notice Cancel pending ownership transfer
     */
    function cancelOwnershipTransfer() external onlyOwner {
        pendingOwner = address(0);
    }

    /**
     * @notice Pause the contract (emergency)
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ============ Deposit Functions ============

    /**
     * @notice Deposit native ETH
     * @return commitment Deposit commitment (for tracking)
     */
    function depositNative() external payable whenNotPaused returns (bytes32 commitment) {
        if (msg.value == 0) revert ZeroAmount();

        tokenBalances[NATIVE_TOKEN] += msg.value;
        commitment = _computeDepositCommitment(NATIVE_TOKEN, msg.value, msg.sender);

        emit Deposited(msg.sender, NATIVE_TOKEN, msg.value, commitment);
    }

    /**
     * @notice Deposit ERC20 tokens
     * @param token Token address
     * @param amount Amount to deposit
     * @return commitment Deposit commitment
     */
    function depositToken(address token, uint256 amount) external whenNotPaused returns (bytes32 commitment) {
        if (amount == 0) revert ZeroAmount();
        if (token == address(0)) revert ZeroAddress();

        // Get balance before transfer
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        
        // Transfer tokens from sender
        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();
        
        // Calculate actual amount received (handles fee-on-transfer tokens)
        uint256 actualAmount = IERC20(token).balanceOf(address(this)) - balanceBefore;

        // Update state after external call (deposit is safe - user is depositing)
        tokenBalances[token] += actualAmount;
        commitment = _computeDepositCommitment(token, actualAmount, msg.sender);

        emit Deposited(msg.sender, token, actualAmount, commitment);
    }

    // ============ Withdrawal Functions ============

    /**
     * @notice Execute withdrawal with verified commitment
     * @param commitment Withdrawal commitment
     * @param token Token to withdraw (address(0) for native)
     * @param recipient Recipient address
     * @param amount Amount to withdraw
     * @param proof Merkle proof from settlement
     * @param leafIndex Leaf index
     * @param root Merkle root to verify against
     */
    function executeWithdrawal(
        bytes32 commitment,
        address token,
        address recipient,
        uint256 amount,
        bytes32[] calldata proof,
        uint256 leafIndex,
        bytes32 root
    ) external onlySettlement whenNotPaused {
        // Check replay protection
        if (usedCommitments[commitment]) revert CommitmentAlreadyUsed();

        // Verify commitment matches withdrawal params
        bytes32 expectedCommitment = _computeWithdrawalCommitment(token, recipient, amount);
        if (commitment != expectedCommitment) revert InvalidProof();

        // Verify Merkle proof
        if (!proof.verify(root, commitment, leafIndex)) revert InvalidProof();

        // Check balance
        if (tokenBalances[token] < amount) revert InsufficientBalance();

        // Mark as used (before external call - CEI pattern)
        usedCommitments[commitment] = true;

        // Update balance (before external call - CEI pattern)
        tokenBalances[token] -= amount;

        // Emit event before external call
        emit Withdrawn(commitment, token, recipient, amount);

        // Transfer last (CEI pattern - external call after state changes)
        _safeTransfer(token, recipient, amount);
    }

    /**
     * @notice Execute withdrawal without proof (settlement contract authorized)
     * @dev Used when settlement contract has already verified the commitment
     */
    function executeAuthorizedWithdrawal(
        bytes32 commitment,
        address token,
        address recipient,
        uint256 amount
    ) external onlySettlement whenNotPaused {
        // Check replay protection
        if (usedCommitments[commitment]) revert CommitmentAlreadyUsed();

        // Check balance
        if (tokenBalances[token] < amount) revert InsufficientBalance();

        // Mark as used (before external call - CEI pattern)
        usedCommitments[commitment] = true;

        // Update balance (before external call - CEI pattern)
        tokenBalances[token] -= amount;

        // Emit event before external call
        emit Withdrawn(commitment, token, recipient, amount);

        // Transfer last (CEI pattern - external call after state changes)
        _safeTransfer(token, recipient, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get vault balance for a token
     */
    function getBalance(address token) external view returns (uint256) {
        return tokenBalances[token];
    }

    /**
     * @notice Check if a commitment has been used
     */
    function isCommitmentUsed(bytes32 commitment) external view returns (bool) {
        return usedCommitments[commitment];
    }

    /**
     * @notice Compute withdrawal commitment (with nonce for uniqueness)
     */
    function computeWithdrawalCommitment(
        address token,
        address recipient,
        uint256 amount
    ) external view returns (bytes32) {
        return _computeWithdrawalCommitment(token, recipient, amount);
    }

    /**
     * @notice Get current withdrawal nonce
     */
    function getWithdrawalNonce() external view returns (uint256) {
        return withdrawalNonce;
    }

    // ============ Internal Functions ============

    function _computeDepositCommitment(
        address token,
        uint256 amount,
        address depositor
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            "SIP_DEPOSIT",
            token,
            amount,
            depositor,
            block.timestamp,
            block.number
        ));
    }

    function _computeWithdrawalCommitment(
        address token,
        address recipient,
        uint256 amount
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            "SIP_WITHDRAWAL",
            token,
            recipient,
            amount,
            withdrawalNonce
        ));
    }

    /**
     * @notice Safe transfer for both native and ERC20
     */
    function _safeTransfer(address token, address recipient, uint256 amount) internal {
        if (token == NATIVE_TOKEN) {
            (bool success, ) = recipient.call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            bool success = IERC20(token).transfer(recipient, amount);
            if (!success) revert TransferFailed();
        }
    }

    // ============ Receive ============

    /**
     * @notice Reject direct ETH transfers - use depositNative() instead
     * @dev This prevents untracked deposits with zero commitment
     */
    receive() external payable {
        revert DirectTransferNotAllowed();
    }
}
