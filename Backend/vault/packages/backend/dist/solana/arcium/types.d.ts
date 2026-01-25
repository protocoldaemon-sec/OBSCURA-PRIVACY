/**
 * Arcium Type Definitions
 *
 * Types for cSPL tokens, MXE computations, and MPC operations
 */
/** Arcium network configuration */
export interface ArciumConfig {
    /** Arcium RPC endpoint */
    rpcUrl: string;
    /** MXE cluster endpoint */
    mxeEndpoint: string;
    /** Cluster ID for MPC computations */
    clusterId: string;
    /** Application namespace */
    appId: string;
    /** Solana cluster */
    solanaCluster: 'mainnet-beta' | 'devnet' | 'localnet';
}
/** Encrypted value using Arcium's encryption scheme */
export interface EncryptedValue {
    /** Ciphertext bytes */
    ciphertext: Uint8Array;
    /** Encryption nonce */
    nonce: Uint8Array;
    /** Ephemeral public key for ECDH */
    ephemeralPubKey: Uint8Array;
    /** Commitment to the plaintext (for verification) */
    commitment: Uint8Array;
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
//# sourceMappingURL=types.d.ts.map