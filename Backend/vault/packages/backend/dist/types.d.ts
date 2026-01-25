/**
 * Backend service types
 */
import type { Hash, WOTSSignedIntent, MerkleProof } from '@obscura/crypto';
/** Supported blockchain networks */
export type ChainId = 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | 'solana' | 'solana-devnet' | 'near' | 'near-testnet';
/** Intent action types */
export type IntentAction = 'transfer' | 'swap' | 'bridge' | 'deposit' | 'withdraw';
/** Privacy level for intents */
export type PrivacyMode = 'transparent' | 'shielded' | 'compliant';
/** Raw intent before privacy wrapping */
export interface RawIntent {
    /** Unique intent ID */
    id: string;
    /** Action type */
    action: IntentAction;
    /** Source chain */
    sourceChain: ChainId;
    /** Target chain (same as source for non-bridge) */
    targetChain: ChainId;
    /** Asset address (native = 0x0) */
    asset: string;
    /** Amount in wei/lamports */
    amount: bigint;
    /** Recipient address or stealth key */
    recipient: string;
    /** Sender's public key hash (from WOTS pool) */
    senderPoolRoot: Hash;
    /** Deadline timestamp */
    deadline: number;
    /** Optional data payload */
    data?: Uint8Array;
}
/** Shielded intent (privacy-wrapped) */
export interface ShieldedIntent {
    /** Encrypted intent blob */
    encryptedIntent: Uint8Array;
    /** Ephemeral public key for ECDH */
    ephemeralPubKey: Uint8Array;
    /** Intent commitment (hash) */
    commitment: Hash;
    /** Target chain hint (can be revealed for routing) */
    targetChainHint?: ChainId;
}
/** Intent with WOTS authorization attached */
export interface AuthorizedIntent {
    /** The shielded intent */
    shielded: ShieldedIntent;
    /** Decrypted raw intent (only available to authorized parties) */
    raw?: RawIntent;
    /** WOTS signed authorization */
    wotsAuth: WOTSSignedIntent;
    /** Timestamp of authorization */
    authorizedAt: number;
}
/** Verification result for an authorized intent */
export interface AuthVerificationResult {
    /** Whether the authorization is valid */
    valid: boolean;
    /** Error message if invalid */
    error?: string;
    /** Key index used */
    keyIndex?: number;
    /** Whether key was previously seen (potential reuse) */
    keyPreviouslySeen?: boolean;
}
/** Batch commitment for settlement */
export interface BatchCommitment {
    /** Batch ID */
    batchId: string;
    /** Merkle root of all intent commitments */
    batchRoot: Hash;
    /** Individual intent commitments in order */
    commitments: Hash[];
    /** Proofs for each commitment */
    proofs: MerkleProof[];
    /** Target chain for this batch */
    targetChain: ChainId;
    /** Timestamp of batch creation */
    createdAt: number;
    /** Number of intents in batch */
    count: number;
}
/** Settlement status */
export type SettlementStatus = 'pending' | 'submitted' | 'confirmed' | 'finalized' | 'failed';
/** Settlement record */
export interface SettlementRecord {
    /** Batch ID */
    batchId: string;
    /** Chain where settled */
    chain: ChainId;
    /** Transaction hash */
    txHash: string;
    /** Block number */
    blockNumber: number;
    /** Status */
    status: SettlementStatus;
    /** Gas used (EVM) or compute units (Solana) */
    gasUsed: bigint;
    /** Timestamp */
    settledAt: number;
}
/** Relayer/Executor info */
export interface RelayerInfo {
    /** Relayer ID */
    id: string;
    /** Relayer address (for rewards) */
    address: string;
    /** Supported chains */
    chains: ChainId[];
    /** Stake amount (if applicable) */
    stake?: bigint;
    /** Reputation score */
    reputation: number;
}
/** Solver quote for intent execution */
export interface SolverQuote {
    /** Quote ID */
    id: string;
    /** Solver identifier */
    solverId: string;
    /** Input amount */
    inputAmount: bigint;
    /** Output amount (after fees) */
    outputAmount: bigint;
    /** Solver fee */
    fee: bigint;
    /** Gas estimate */
    gasEstimate: bigint;
    /** Quote expiry timestamp */
    expiresAt: number;
    /** Estimated execution time (seconds) */
    estimatedTime: number;
    /** Solver reputation score */
    solverReputation: number;
}
/** Quote request for multi-solver auction */
export interface QuoteRequest {
    /** Source chain */
    sourceChain: ChainId;
    /** Target chain */
    targetChain: ChainId;
    /** Input asset */
    inputAsset: string;
    /** Output asset */
    outputAsset: string;
    /** Input amount */
    amount: bigint;
    /** Recipient (optional for quotes) */
    recipient?: string;
    /** Slippage tolerance (basis points) */
    slippageBps?: number;
}
/** Selected quote with execution details */
export interface SelectedQuote extends SolverQuote {
    /** Execution calldata (if direct) */
    calldata?: Uint8Array;
    /** Requires bridge? */
    requiresBridge: boolean;
    /** Bridge protocol (if needed) */
    bridgeProtocol?: string;
}
/** Audit trail entry for COMPLIANT mode */
export interface AuditEntry {
    /** Intent commitment hash */
    intentCommitment: Hash;
    /** Encrypted audit data */
    encryptedData: Uint8Array;
    /** Auditor public key that can decrypt */
    auditorPubKey: Uint8Array;
    /** Timestamp */
    timestamp: number;
    /** Chain where settled */
    chain: ChainId;
}
/** Viewing key derivation info */
export interface ViewingKeyInfo {
    /** Derivation path */
    path: string;
    /** Purpose (e.g., "audit/2025", "tax/q1") */
    purpose: string;
    /** Expiry timestamp (optional) */
    expiresAt?: number;
    /** Revoked? */
    revoked: boolean;
}
/** Basic intent for SIP client */
export interface Intent {
    /** Unique intent ID */
    id: string;
    /** Sender address (stealth) */
    sender: string;
    /** Input token address */
    tokenIn: string;
    /** Output token address */
    tokenOut: string;
    /** Input amount */
    amountIn: bigint;
    /** Minimum output amount */
    minAmountOut: bigint;
    /** Deadline timestamp */
    deadline: number;
    /** Chain ID (numeric) */
    chainId: number;
}
/** Intent submission result */
export interface IntentSubmission {
    /** Intent ID */
    intentId: string;
    /** Submission status */
    status: 'pending' | 'submitted' | 'confirmed' | 'failed';
    /** Transaction hash if submitted */
    txHash?: string;
    /** Submission timestamp */
    timestamp: number;
    /** Error message if failed */
    error?: string;
}
//# sourceMappingURL=types.d.ts.map