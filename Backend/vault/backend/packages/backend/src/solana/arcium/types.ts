/**
 * Arcium Type Definitions
 * 
 * Types for cSPL tokens, MXE computations, MPC operations, and sealing
 * 
 * Arcium uses Enc<Owner, T> generic type where:
 * - Owner: 'Shared' (user+MXE shared secret) or 'Mxe' (MXE-only)
 * - T: underlying data type (u64, bool, etc.)
 * 
 * Encryption uses Rescue cipher with x25519 ECDH key exchange
 */

/** Encryption owner type - who can decrypt */
export type EncryptionOwner = 'Shared' | 'Mxe';

/** Arcium network configuration */
export interface ArciumConfig {
  /** Solana RPC endpoint (use Helius for reliability) */
  rpcUrl: string;
  /** Cluster offset (123, 456, or 789 for devnet v0.5.1) */
  clusterOffset: number;
  /** Application namespace */
  appId: string;
  /** Solana cluster */
  solanaCluster: 'mainnet-beta' | 'devnet' | 'localnet';
  /** Arcium program ID */
  programId?: string;
  /** Mempool size: Tiny, Small, Medium, Large */
  mempoolSize?: 'Tiny' | 'Small' | 'Medium' | 'Large';
}

/**
 * Encrypted value using Arcium's Rescue cipher
 * 
 * Encryption flow:
 * 1. x25519 ECDH key exchange between client and cluster
 * 2. Derive Rescue key from shared secret
 * 3. Encrypt using Rescue in CTR mode
 */
export interface EncryptedValue {
  /** Ciphertext bytes (Rescue cipher output) */
  ciphertext: Uint8Array;
  /** Encryption nonce (16 random bytes, incremented for outputs) */
  nonce: Uint8Array;
  /** Ephemeral public key for x25519 ECDH */
  ephemeralPubKey: Uint8Array;
  /** Commitment to the plaintext (for verification) */
  commitment: Uint8Array;
  /** Owner type: who can decrypt */
  owner?: EncryptionOwner;
}

/**
 * Sealed (re-encrypted) value for selective disclosure
 * 
 * Sealing allows re-encrypting data to a specific recipient's public key
 * without revealing the plaintext to anyone else.
 * 
 * Use case: Alice computes on her encrypted data, result is sealed
 * for Bob (loan officer) who only learns the result, not Alice's data.
 */
export interface SealedValue {
  /** Re-encrypted ciphertext for recipient */
  ciphertext: Uint8Array;
  /** Nonce used for sealing */
  nonce: Uint8Array;
  /** Recipient's public key (who can decrypt) */
  recipientPubKey: Uint8Array;
  /** Proof that sealing was done correctly */
  sealingProof?: Uint8Array;
  /** Original computation ID (for audit trail) */
  computationId?: string;
}

/**
 * Arcis encrypted type representation
 * 
 * Maps to Rust: Enc<Owner, T>
 * - to_arcis(): decrypt to secret shares for MPC
 * - from_arcis(): encrypt result for owner
 */
export interface ArcisEncrypted<T = unknown> {
  /** Encrypted data */
  encrypted: EncryptedValue;
  /** Owner who can decrypt */
  owner: EncryptionOwner;
  /** Type hint for the underlying data */
  typeHint: string;
  /** Plaintext value (only available after decryption) */
  plaintext?: T;
}

/** cSPL Token Account with encrypted balance */
export interface ConfidentialTokenAccount {
  /** Account public key */
  address: string;
  /** Token mint */
  mint: string;
  /** Owner public key */
  owner: string;
  /** Encrypted balance */
  encryptedBalance: EncryptedValue;
  /** Pending encrypted balance (for incoming transfers) */
  pendingBalance?: EncryptedValue;
  /** Account state */
  state: 'initialized' | 'frozen';
  /** Decryption key handle (for authorized parties) */
  decryptionKeyHandle?: string;
}

/** cSPL Transfer instruction data */
export interface ConfidentialTransfer {
  /** Source account */
  source: string;
  /** Destination account */
  destination: string;
  /** Encrypted amount */
  encryptedAmount: EncryptedValue;
  /** Range proof (proves amount is valid without revealing it) */
  rangeProof: Uint8Array;
  /** Equality proof (proves encrypted amounts match) */
  equalityProof: Uint8Array;
  /** Fee payer */
  feePayer: string;
}

/** MXE (Multi-Party Execution Environment) cluster info */
export interface MXECluster {
  /** Cluster ID */
  id: string;
  /** Cluster name */
  name: string;
  /** Number of nodes in the cluster */
  nodeCount: number;
  /** Threshold for MPC (t-of-n) */
  threshold: number;
  /** Cluster public key for encryption */
  publicKey: Uint8Array;
  /** Supported computation types */
  supportedComputations: string[];
  /** Cluster status */
  status: 'active' | 'degraded' | 'offline';
}

/** MPC computation request */
export interface MPCComputationRequest {
  /** Computation type identifier */
  computationType: string;
  /** Encrypted inputs from each party */
  inputs: EncryptedInput[];
  /** Computation parameters */
  params?: Record<string, unknown>;
  /** Callback URL for async results */
  callbackUrl?: string;
  /** Timeout in milliseconds */
  timeout?: number;
}

/** Encrypted input for MPC */
export interface EncryptedInput {
  /** Party identifier */
  partyId: string;
  /** Encrypted data */
  data: EncryptedValue;
  /** Input schema/type hint */
  schema?: string;
}

/** MPC computation result */
export interface MPCComputationResult {
  /** Computation ID */
  computationId: string;
  /** Result status */
  status: 'pending' | 'computing' | 'completed' | 'failed';
  /** Encrypted result (for authorized parties) */
  encryptedResult?: EncryptedValue;
  /** Public result (if computation produces public output) */
  publicResult?: unknown;
  /** Zero-knowledge proof of correct computation */
  proof: Uint8Array;
  /** Computation metadata */
  metadata: {
    startTime: number;
    endTime?: number;
    nodesParticipated: number;
    gasUsed?: bigint;
  };
}

/** Confidential swap parameters */
export interface ConfidentialSwapParams {
  /** Input token mint */
  inputMint: string;
  /** Output token mint */
  outputMint: string;
  /** Encrypted input amount */
  encryptedInputAmount: EncryptedValue;
  /** Minimum output (encrypted) */
  encryptedMinOutput: EncryptedValue;
  /** Slippage tolerance in basis points */
  slippageBps: number;
  /** Deadline timestamp */
  deadline: number;
}

/** Confidential auction bid */
export interface ConfidentialBid {
  /** Bidder identifier */
  bidderId: string;
  /** Encrypted bid amount */
  encryptedAmount: EncryptedValue;
  /** Commitment to bid */
  commitment: Uint8Array;
  /** Signature proving ownership */
  signature: Uint8Array;
}

/** Auction result */
export interface AuctionResult {
  /** Winning bidder ID */
  winnerId: string;
  /** Winning amount (revealed after auction) */
  winningAmount?: bigint;
  /** Proof of fair auction */
  fairnessProof: Uint8Array;
  /** All bid commitments (for verification) */
  bidCommitments: Uint8Array[];
}

/** Viewing key for selective disclosure */
export interface ViewingKey {
  /** Key identifier */
  keyId: string;
  /** Encrypted viewing key */
  encryptedKey: Uint8Array;
  /** Authorized viewer public key */
  viewerPubKey: Uint8Array;
  /** Permissions */
  permissions: ('balance' | 'transfers' | 'history')[];
  /** Expiry timestamp */
  expiresAt?: number;
}


// ============ Sealing / Re-encryption Types ============

/**
 * Sealing request for re-encrypting data to a recipient
 * 
 * Example use case (from Arcium docs):
 * ```rust
 * #[instruction]
 * pub fn verify_loan_eligibility(
 *   alice_balance: Enc<Shared, u64>,      // Alice's encrypted balance
 *   min_balance: Enc<Mxe, u64>,           // Threshold (MXE-only)
 *   loan_officer: Shared                   // Recipient for result
 * ) -> Enc<Shared, bool> {
 *   let is_eligible = alice_balance >= min_balance;
 *   loan_officer.from_arcis(is_eligible)  // Seal result for loan officer
 * }
 * ```
 */
export interface SealingRequest {
  /** Computation that produces the value to seal */
  computationId: string;
  /** Output index from computation (if multiple outputs) */
  outputIndex?: number;
  /** Recipient's x25519 public key */
  recipientPubKey: Uint8Array;
  /** Optional: specific permissions for the sealed data */
  permissions?: SealingPermissions;
}

/** Permissions for sealed data */
export interface SealingPermissions {
  /** Can recipient re-seal to others? */
  canReseal: boolean;
  /** Expiry timestamp */
  expiresAt?: number;
  /** Allowed operations on sealed data */
  allowedOps?: ('read' | 'compare' | 'aggregate')[];
}

/**
 * Confidential intent verification result
 * 
 * For Obscura: verify intent eligibility without revealing amounts
 */
export interface ConfidentialIntentVerification {
  /** Intent ID */
  intentId: string;
  /** Is intent valid? (sealed for verifier) */
  isValid: SealedValue;
  /** Meets minimum amount? (sealed for verifier) */
  meetsMinimum?: SealedValue;
  /** Proof of correct verification */
  verificationProof: Uint8Array;
  /** Timestamp */
  verifiedAt: number;
}

/**
 * Confidential batch optimization result
 * 
 * Optimize intent ordering without revealing individual amounts
 */
export interface ConfidentialBatchOptimization {
  /** Batch ID */
  batchId: string;
  /** Optimal ordering (public - just indices) */
  ordering: number[];
  /** Total gas savings (can be revealed) */
  gasSavings: bigint;
  /** Individual savings per intent (sealed for each intent owner) */
  individualSavings?: Map<string, SealedValue>;
  /** Proof of correct optimization */
  optimizationProof: Uint8Array;
}

/**
 * Compliance disclosure for COMPLIANT privacy level
 * 
 * Seal transaction details for authorized auditors only
 */
export interface ComplianceDisclosure {
  /** Intent commitment */
  intentCommitment: Uint8Array;
  /** Sealed sender info (for auditor) */
  sealedSender: SealedValue;
  /** Sealed recipient info (for auditor) */
  sealedRecipient: SealedValue;
  /** Sealed amount (for auditor) */
  sealedAmount: SealedValue;
  /** Auditor's public key */
  auditorPubKey: Uint8Array;
  /** Disclosure timestamp */
  disclosedAt: number;
  /** Regulatory jurisdiction */
  jurisdiction?: string;
}


// ============ Input/Output Types for Confidential Instructions ============

/**
 * Input passed by value - entire encrypted data submitted on-chain
 * 
 * Use for: smaller data that fits in a transaction
 * 
 * Rust equivalent: `order_ctxt: Enc<Shared, Order>`
 */
export interface EncByValue<T = unknown> {
  /** How the input is passed */
  passBy: 'value';
  /** Owner type */
  owner: EncryptionOwner;
  /** Encrypted ciphertext (32 bytes per field) */
  ciphertext: Uint8Array;
  /** Client's x25519 public key */
  clientPubKey: Uint8Array;
  /** Encryption nonce (u128) */
  nonce: bigint;
  /** Type hint for deserialization */
  typeHint?: string;
  /** Plaintext (only available client-side before encryption) */
  _plaintext?: T;
}

/**
 * Input passed by reference - only account pubkey submitted, MPC nodes fetch data
 * 
 * Use for: large data structures (order books, state) that don't fit in a transaction
 * 
 * Rust equivalent: `ob_ctxt: Enc<Mxe, &OrderBook>`
 */
export interface EncByReference {
  /** How the input is passed */
  passBy: 'reference';
  /** Owner type (typically 'Mxe' for by-reference) */
  owner: EncryptionOwner;
  /** Account public key containing the encrypted data */
  accountPubKey: string;
  /** Expected data type/schema */
  schema: string;
  /** Account data offset (if data starts at specific position) */
  dataOffset?: number;
  /** Expected data length */
  dataLength?: number;
}

/** Union type for encrypted inputs */
export type EncInput<T = unknown> = EncByValue<T> | EncByReference;

/**
 * Computation output that fits in callback transaction
 * 
 * Outputs that fit in a single transaction are sent directly in the callback.
 */
export interface CallbackOutput {
  /** Output index */
  index: number;
  /** Owner who can decrypt */
  owner: EncryptionOwner;
  /** Encrypted output data */
  ciphertext: Uint8Array;
  /** Nonce for decryption */
  nonce: bigint;
  /** Whether this was revealed (made public) */
  revealed?: boolean;
  /** Revealed value (if revealed) */
  revealedValue?: unknown;
}

/**
 * Computation output sent to callback server
 * 
 * Outputs too large for the callback transaction are sent to the callback server.
 * Client is responsible for fetching and updating on-chain state.
 */
export interface CallbackServerOutput {
  /** Output index */
  index: number;
  /** Callback server endpoint */
  callbackUrl: string;
  /** Output identifier for retrieval */
  outputId: string;
  /** Owner who can decrypt */
  owner: EncryptionOwner;
  /** Expected size in bytes */
  expectedSize: number;
  /** Expiry timestamp for retrieval */
  expiresAt: number;
}

/**
 * Full computation output combining callback tx and server outputs
 */
export interface ComputationOutputs {
  /** Computation ID */
  computationId: string;
  /** Outputs included in callback transaction */
  callbackOutputs: CallbackOutput[];
  /** Outputs sent to callback server (for large data) */
  serverOutputs: CallbackServerOutput[];
  /** Finalization transaction signature */
  finalizeTxSignature: string;
  /** Timestamp */
  completedAt: number;
}

// ============ Obscura-specific Confidential Instruction Types ============

/**
 * Encrypted order for confidential order book
 * 
 * Maps to Rust:
 * ```rust
 * struct Order {
 *   size: u64,
 *   bid: bool,
 *   owner: u128,
 * }
 * ```
 */
export interface EncryptedOrder {
  /** Order size (encrypted u64) */
  encryptedSize: Uint8Array;
  /** Is bid order (encrypted bool) */
  encryptedBid: Uint8Array;
  /** Owner identifier (encrypted u128) */
  encryptedOwner: Uint8Array;
}

/**
 * Arcium encrypted intent for confidential processing
 * 
 * Used in Obscura for private intent settlement via MPC
 */
export interface ArciumEncryptedIntent {
  /** Intent action type */
  action: 'swap' | 'transfer' | 'bridge';
  /** Encrypted input amount (u64) */
  encryptedInputAmount: Uint8Array;
  /** Encrypted output amount (u64) */
  encryptedOutputAmount: Uint8Array;
  /** Encrypted sender (32 bytes) */
  encryptedSender: Uint8Array;
  /** Encrypted recipient (32 bytes) */
  encryptedRecipient: Uint8Array;
  /** Deadline (public - needed for on-chain validation) */
  deadline: number;
  /** Nonce for all encrypted fields */
  nonce: bigint;
  /** Client public key */
  clientPubKey: Uint8Array;
}

/**
 * Solver quote for confidential auction
 */
export interface EncryptedSolverQuote {
  /** Solver identifier */
  solverId: string;
  /** Encrypted output amount they can provide (u64) */
  encryptedOutputAmount: Uint8Array;
  /** Encrypted fee (u64) */
  encryptedFee: Uint8Array;
  /** Quote expiry (public) */
  expiresAt: number;
  /** Nonce */
  nonce: bigint;
  /** Solver's public key for result sealing */
  solverPubKey: Uint8Array;
}

/**
 * Result of confidential solver auction
 * 
 * Winner index is revealed, but individual quote amounts remain private
 */
export interface SolverAuctionResult {
  /** Index of winning solver (revealed) */
  winnerIndex: number;
  /** Winning solver ID */
  winnerId: string;
  /** Sealed winning amount (only winner can decrypt) */
  sealedWinningAmount?: SealedValue;
  /** Proof of fair auction */
  auctionProof: Uint8Array;
  /** All solver commitments (for verification) */
  quoteCommitments: Uint8Array[];
}

/**
 * Batch of intents for confidential optimization
 */
export interface ConfidentialIntentBatch {
  /** Batch ID */
  batchId: string;
  /** Encrypted intents (by reference to reduce tx size) */
  intentRefs: EncByReference[];
  /** Target chain for settlement */
  targetChain: 'ethereum' | 'solana' | 'arbitrum' | 'base';
  /** Optimization goal */
  optimizationGoal: 'gas' | 'speed' | 'privacy';
  /** Maximum batch size */
  maxSize: number;
}
