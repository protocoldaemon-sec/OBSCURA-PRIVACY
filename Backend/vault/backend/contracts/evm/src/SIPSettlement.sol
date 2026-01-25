// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MerkleVerifier} from "./MerkleVerifier.sol";

/**
 * @title SIPSettlement
 * @notice Minimal settlement contract for SIP + WOTS system
 * @dev This contract ONLY handles:
 *      - Merkle root storage (batch commitments)
 *      - Replay protection (used commitments)
 *      - Settlement execution
 *      
 *      This contract does NOT handle:
 *      - WOTS signature verification (too expensive)
 *      - Privacy logic (handled by SIP layer)
 *      - Intent details (never stored on-chain)
 */
contract SIPSettlement {
    using MerkleVerifier for bytes32[];

    // ============ Constants ============

    /// @notice Maximum batch size for settleBatch
    uint256 public constant MAX_BATCH_SIZE = 100;

    /// @notice Maximum proof length (tree depth)
    uint256 public constant MAX_PROOF_LENGTH = 32;

    // ============ Events ============

    event RootUpdated(bytes32 indexed newRoot, uint256 indexed batchId, uint256 timestamp);
    event CommitmentSettled(bytes32 indexed commitment, uint256 indexed batchId, address executor);
    event BatchSettled(uint256 indexed batchId, uint256 count, address executor);
    event ExecutorUpdated(address indexed executor, bool authorized);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============ Errors ============

    error Unauthorized();
    error InvalidProof();
    error CommitmentAlreadyUsed();
    error InvalidRoot();
    error ZeroAddress();
    error BatchTooLarge();
    error ProofTooLong();
    error EmptyProof();
    error LengthMismatch();

    // ============ State ============

    /// @notice Contract owner
    address public owner;

    /// @notice Pending owner for two-step transfer
    address public pendingOwner;

    /// @notice Current active Merkle root (batch commitment)
    bytes32 public currentRoot;

    /// @notice Batch ID counter
    uint256 public currentBatchId;

    /// @notice Historical roots (batchId => root)
    mapping(uint256 => bytes32) public batchRoots;

    /// @notice Used commitments (commitment => true if used)
    mapping(bytes32 => bool) public usedCommitments;

    /// @notice Authorized executors
    mapping(address => bool) public authorizedExecutors;

    // ============ Modifiers ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyExecutor() {
        if (!authorizedExecutors[msg.sender] && msg.sender != owner) revert Unauthorized();
        _;
    }

    // ============ Constructor ============

    constructor() {
        owner = msg.sender;
        authorizedExecutors[msg.sender] = true;
    }

    // ============ Admin Functions ============

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
     * @notice Update executor authorization
     * @param executor Executor address
     * @param authorized Whether to authorize or revoke
     */
    function setExecutor(address executor, bool authorized) external onlyOwner {
        if (executor == address(0)) revert ZeroAddress();
        authorizedExecutors[executor] = authorized;
        emit ExecutorUpdated(executor, authorized);
    }

    // ============ Root Management ============

    /**
     * @notice Update the current Merkle root (new batch)
     * @param newRoot New Merkle root
     * @return batchId The ID of this batch
     */
    function updateRoot(bytes32 newRoot) external onlyExecutor returns (uint256 batchId) {
        if (newRoot == bytes32(0)) revert InvalidRoot();
        
        batchId = ++currentBatchId;
        currentRoot = newRoot;
        batchRoots[batchId] = newRoot;

        emit RootUpdated(newRoot, batchId, block.timestamp);
    }

    // ============ Settlement Functions ============

    /**
     * @notice Settle a single commitment
     * @param commitment Intent commitment hash
     * @param proof Merkle proof
     * @param leafIndex Leaf index in the tree
     */
    function settle(
        bytes32 commitment,
        bytes32[] calldata proof,
        uint256 leafIndex
    ) external {
        _validateProof(proof);
        _settle(commitment, proof, leafIndex, currentRoot, currentBatchId);
    }

    /**
     * @notice Settle against a specific batch root
     * @param commitment Intent commitment hash
     * @param proof Merkle proof
     * @param leafIndex Leaf index in the tree
     * @param batchId Batch ID to verify against
     */
    function settleWithBatch(
        bytes32 commitment,
        bytes32[] calldata proof,
        uint256 leafIndex,
        uint256 batchId
    ) external {
        _validateProof(proof);
        bytes32 root = batchRoots[batchId];
        if (root == bytes32(0)) revert InvalidRoot();
        _settle(commitment, proof, leafIndex, root, batchId);
    }

    /**
     * @notice Batch settle multiple commitments
     * @param commitments Array of commitment hashes
     * @param proofs Array of Merkle proofs
     * @param leafIndices Array of leaf indices
     */
    function settleBatch(
        bytes32[] calldata commitments,
        bytes32[][] calldata proofs,
        uint256[] calldata leafIndices
    ) external {
        uint256 length = commitments.length;
        if (proofs.length != length || leafIndices.length != length) revert LengthMismatch();
        if (length > MAX_BATCH_SIZE) revert BatchTooLarge();

        bytes32 root = currentRoot;
        uint256 batchId = currentBatchId;
        
        for (uint256 i = 0; i < length; ) {
            _validateProof(proofs[i]);
            _settle(commitments[i], proofs[i], leafIndices[i], root, batchId);
            unchecked {
                ++i;
            }
        }

        emit BatchSettled(batchId, length, msg.sender);
    }

    // ============ View Functions ============

    /**
     * @notice Check if a commitment has been used
     * @param commitment Commitment to check
     * @return True if already settled
     */
    function isCommitmentUsed(bytes32 commitment) external view returns (bool) {
        return usedCommitments[commitment];
    }

    /**
     * @notice Verify a proof without settling
     * @param commitment Commitment to verify
     * @param proof Merkle proof
     * @param leafIndex Leaf index
     * @return valid True if proof is valid against current root
     * @return used True if commitment was already used
     */
    function verifyCommitment(
        bytes32 commitment,
        bytes32[] calldata proof,
        uint256 leafIndex
    ) external view returns (bool valid, bool used) {
        used = usedCommitments[commitment];
        valid = proof.verify(currentRoot, commitment, leafIndex);
    }

    // ============ Internal Functions ============

    /**
     * @notice Validate proof length
     */
    function _validateProof(bytes32[] calldata proof) internal pure {
        if (proof.length == 0) revert EmptyProof();
        if (proof.length > MAX_PROOF_LENGTH) revert ProofTooLong();
    }

    /**
     * @notice Internal settlement logic
     */
    function _settle(
        bytes32 commitment,
        bytes32[] calldata proof,
        uint256 leafIndex,
        bytes32 root,
        uint256 batchId
    ) internal {
        // Check replay protection
        if (usedCommitments[commitment]) revert CommitmentAlreadyUsed();

        // Verify Merkle proof
        if (!proof.verify(root, commitment, leafIndex)) revert InvalidProof();

        // Mark as used (replay protection)
        usedCommitments[commitment] = true;

        // Emit event with batch ID passed as parameter (gas optimization)
        emit CommitmentSettled(commitment, batchId, msg.sender);
    }
}
