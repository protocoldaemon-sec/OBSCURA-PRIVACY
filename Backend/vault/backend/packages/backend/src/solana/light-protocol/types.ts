/**
 * Light Protocol Type Definitions
 * 
 * Types for ZK Compression, compressed accounts, and Photon indexer
 */

/** Light Protocol configuration */
export interface LightProtocolConfig {
  /** Solana RPC endpoint */
  rpcUrl: string;
  /** Photon indexer endpoint */
  photonUrl: string;
  /** Prover endpoint for ZK proofs */
  proverUrl?: string;
  /** Solana cluster */
  cluster: 'mainnet-beta' | 'devnet' | 'localnet';
}

/** Compressed account data */
export interface CompressedAccount {
  /** Account hash (unique identifier) */
  hash: Uint8Array;
  /** Owner program */
  owner: string;
  /** Lamports balance */
  lamports: bigint;
  /** Account data */
  data: Uint8Array;
  /** Data hash */
  dataHash: Uint8Array;
  /** Address (if assigned) */
  address?: string;
}

/** Compressed account with proof */
export interface CompressedAccountWithProof {
  /** The compressed account */
  account: CompressedAccount;
  /** Merkle proof for the account */
  proof: MerkleProofInfo;
  /** Root index in the state tree */
  rootIndex: number;
  /** Leaf index in the tree */
  leafIndex: number;
}

/** Merkle proof information */
export interface MerkleProofInfo {
  /** Proof path (sibling hashes) */
  proof: Uint8Array[];
  /** Root hash */
  root: Uint8Array;
  /** Leaf hash */
  leaf: Uint8Array;
  /** Leaf index */
  leafIndex: number;
}

/** State tree information */
export interface StateTree {
  /** Tree public key */
  pubkey: string;
  /** Tree type */
  treeType: 'state' | 'address';
  /** Current root */
  root: Uint8Array;
  /** Sequence number */
  seq: bigint;
  /** Tree height */
  height: number;
  /** Number of leaves */
  leafCount: bigint;
  /** Canopy depth */
  canopyDepth: number;
}

/** Nullifier for preventing double-spends */
export interface Nullifier {
  /** Nullifier hash */
  hash: Uint8Array;
  /** Associated account hash */
  accountHash: Uint8Array;
  /** Slot when nullified */
  slot: bigint;
  /** Sequence number */
  seq: bigint;
}

/** Compressed token account */
export interface CompressedTokenAccount {
  /** Account hash */
  hash: Uint8Array;
  /** Token mint */
  mint: string;
  /** Owner public key */
  owner: string;
  /** Token amount */
  amount: bigint;
  /** Delegate (optional) */
  delegate?: string;
  /** Delegated amount */
  delegatedAmount?: bigint;
  /** Is frozen */
  isFrozen: boolean;
  /** Close authority (optional) */
  closeAuthority?: string;
}

/** Compressed token transfer parameters */
export interface CompressedTokenTransferParams {
  /** Source accounts with proofs */
  sourceAccounts: CompressedAccountWithProof[];
  /** Destination owner */
  destinationOwner: string;
  /** Transfer amount */
  amount: bigint;
  /** Token mint */
  mint: string;
}

/** New address parameters for compressed PDA */
export interface NewAddressParams {
  /** Seeds for PDA derivation */
  seeds: Uint8Array[];
  /** Program ID for PDA */
  programId: string;
  /** Address queue pubkey */
  addressQueuePubkey: string;
  /** Address Merkle tree pubkey */
  addressMerkleTreePubkey: string;
}

/** Validity proof for state transition */
export interface ValidityProof {
  /** Compressed proof bytes */
  compressedProof: Uint8Array;
  /** Root indices used */
  rootIndices: number[];
  /** Leaf indices used */
  leafIndices: number[];
  /** New state roots */
  newStateRoots: Uint8Array[];
}

/** Transaction parameters for compressed operations */
export interface CompressedTransactionParams {
  /** Input compressed accounts */
  inputAccounts: CompressedAccountWithProof[];
  /** Output compressed accounts */
  outputAccounts: CompressedAccount[];
  /** New addresses to create */
  newAddresses?: NewAddressParams[];
  /** Validity proof */
  proof: ValidityProof;
  /** Recent state root */
  recentStateRoot: Uint8Array;
}

/** Photon indexer query parameters */
export interface PhotonQueryParams {
  /** Owner filter */
  owner?: string;
  /** Mint filter (for tokens) */
  mint?: string;
  /** Cursor for pagination */
  cursor?: string;
  /** Limit results */
  limit?: number;
}

/** Photon indexer response */
export interface PhotonResponse<T> {
  /** Result items */
  items: T[];
  /** Next cursor for pagination */
  cursor?: string;
  /** Total count (if available) */
  total?: number;
}

/** Compressed account creation result */
export interface CreateCompressedAccountResult {
  /** Account hash */
  hash: Uint8Array;
  /** Tree address */
  treeAddress: string;
  /** Leaf index */
  leafIndex: number;
  /** Transaction signature */
  signature: string;
}

/** Settlement record for compressed storage */
export interface CompressedSettlementData {
  /** Batch ID */
  batchId: string;
  /** Batch root hash */
  batchRoot: Uint8Array;
  /** Settlement chain */
  chain: string;
  /** Transaction hash */
  txHash: string;
  /** Settlement timestamp */
  timestamp: number;
  /** Intent count */
  intentCount: number;
  /** Status */
  status: 'pending' | 'confirmed' | 'finalized';
}

/** Intent commitment for compressed storage */
export interface CompressedIntentCommitment {
  /** Intent ID */
  intentId: string;
  /** Commitment hash */
  commitment: Uint8Array;
  /** Batch ID (if batched) */
  batchId?: string;
  /** Created timestamp */
  createdAt: number;
  /** Expiry timestamp */
  expiresAt: number;
  /** Status */
  status: 'pending' | 'settled' | 'expired' | 'cancelled';
}

/** Audit record for compliant mode */
export interface CompressedAuditRecord {
  /** Record ID */
  recordId: string;
  /** Intent commitment */
  intentCommitment: Uint8Array;
  /** Encrypted audit data */
  encryptedData: Uint8Array;
  /** Auditor public key */
  auditorPubKey: Uint8Array;
  /** Timestamp */
  timestamp: number;
  /** Chain */
  chain: string;
}
