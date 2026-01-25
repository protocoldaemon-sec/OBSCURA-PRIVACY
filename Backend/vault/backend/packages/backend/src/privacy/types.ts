/**
 * Privacy Layer Types
 */

/** Privacy level for transactions */
export type PrivacyLevel = 'transparent' | 'shielded' | 'compliant';

/** Pedersen commitment */
export interface PedersenCommitment {
  /** Commitment point (compressed) */
  commitment: Uint8Array;
  /** Blinding factor (kept secret) */
  blindingFactor: Uint8Array;
  /** Original value (kept secret) */
  value: bigint;
}

/** Stealth address data */
export interface StealthAddressData {
  /** One-time stealth address */
  stealthAddress: string;
  /** Ephemeral public key (published on-chain) */
  ephemeralPubKey: Uint8Array;
  /** View tag for efficient scanning */
  viewTag: Uint8Array;
  /** Shared secret (for recipient) */
  sharedSecret?: Uint8Array;
}

/** Private transfer request */
export interface PrivateTransferRequest {
  /** Recipient's stealth meta-address or regular address */
  recipient: string;
  /** Amount in smallest unit */
  amount: bigint;
  /** Token mint (native for SOL/ETH) */
  token: string;
  /** Source chain */
  sourceChain: 'solana' | 'ethereum';
  /** Target chain (for cross-chain) */
  targetChain?: 'solana' | 'ethereum';
  /** Privacy level */
  privacyLevel: PrivacyLevel;
  /** Optional viewing key for compliant mode */
  viewingKey?: Uint8Array;
}

/** Private transfer result */
export interface PrivateTransferResult {
  success: boolean;
  /** Intent ID */
  intentId: string;
  /** Stealth address (if shielded) */
  stealthAddress?: string;
  /** Amount commitment (hides actual amount) */
  amountCommitment: string;
  /** Deposit transaction hash */
  depositTxHash?: string;
  /** Withdrawal transaction hash */
  withdrawalTxHash?: string;
  /** Batch ID (if batched) */
  batchId?: string;
  /** Error message */
  error?: string;
  /** Explorer URL */
  explorerUrl?: string;
  /** Whether intent was encrypted via Arcium MPC */
  arciumEncrypted?: boolean;
  /** Whether settlement was stored via ZK Compression */
  zkCompressed?: boolean;
}

/** Batch entry for mixing */
export interface BatchEntry {
  intentId: string;
  commitment: PedersenCommitment;
  stealthAddress: StealthAddressData;
  encryptedAmount: Uint8Array;
  timestamp: number;
}

/** Settlement batch */
export interface SettlementBatch {
  batchId: string;
  entries: BatchEntry[];
  merkleRoot: Uint8Array;
  createdAt: number;
  status: 'pending' | 'processing' | 'settled' | 'failed';
}
