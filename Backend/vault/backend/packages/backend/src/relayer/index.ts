/**
 * Obscura Relayer Service
 * 
 * Provides true privacy by executing withdrawals on behalf of users.
 * The relayer pays gas fees and executes transactions, so the original
 * depositor's address never appears on-chain during withdrawal.
 * 
 * Privacy Model:
 * 1. User deposits to vault → gets commitment + nullifier (off-chain)
 * 2. User sends withdrawal request to relayer (encrypted)
 * 3. Relayer executes withdrawal → on-chain shows: Relayer → Vault → Recipient
 * 4. Original depositor is completely hidden
 */

import { createHash, randomBytes } from 'crypto';

// ============ Types ============

export interface DepositNote {
  commitment: string;      // Public commitment (stored on-chain)
  nullifier: string;       // Secret nullifier (only user knows)
  nullifierHash: string;   // Hash of nullifier (used for replay protection)
  secret: string;          // Random secret (only user knows)
  amount: string;          // Amount deposited (in smallest unit)
  token: string;           // Token address (0x0 for native)
  chainId: string;         // Chain identifier (solana-devnet, sepolia, etc.)
  timestamp: number;       // Deposit timestamp
  txHash?: string;         // Deposit transaction hash
}

export interface WithdrawalRequest {
  commitment: string;      // The deposit commitment
  nullifierHash: string;   // Hash of nullifier (proves ownership)
  recipient: string;       // Where to send funds
  amount: string;          // Amount to withdraw
  token: string;           // Token address
  chainId: string;         // Target chain
  relayerFee: string;      // Fee for relayer (in same token)
  deadline: number;        // Request expiry timestamp
  signature?: string;      // Optional signature for verification
}

export interface RelayerConfig {
  feePercent: number;      // Fee percentage (e.g., 0.3 = 0.3%)
  minFeeLamports: bigint;  // Minimum fee in lamports (Solana)
  minFeeWei: bigint;       // Minimum fee in wei (EVM)
  maxPendingRequests: number;
  requestTimeoutMs: number;
}

export interface RelayerStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalVolume: bigint;
  pendingRequests: number;
  usedNullifiers: number;
}

// ============ Commitment Generation ============

/**
 * Generate deposit note with commitment and secrets
 * This is done CLIENT-SIDE - secrets never leave the user's device
 */
export function generateDepositNote(
  amount: string,
  chainId: string,
  token: string = 'native'
): DepositNote {
  // Generate random secret and nullifier (32 bytes each)
  const secret = randomBytes(32).toString('hex');
  const nullifier = randomBytes(32).toString('hex');
  
  // Compute nullifier hash (this goes on-chain for replay protection)
  const nullifierHash = createHash('sha256')
    .update(Buffer.from(nullifier, 'hex'))
    .digest('hex');
  
  // Compute commitment = hash(secret || nullifier || amount || token || chainId)
  const commitment = createHash('sha256')
    .update(Buffer.from(secret, 'hex'))
    .update(Buffer.from(nullifier, 'hex'))
    .update(amount)
    .update(token.toLowerCase())
    .update(chainId)
    .digest('hex');
  
  return {
    commitment: `0x${commitment}`,
    nullifier,
    nullifierHash: `0x${nullifierHash}`,
    secret,
    amount,
    token: token.toLowerCase(),
    chainId,
    timestamp: Date.now(),
  };
}

/**
 * Reconstruct commitment from secrets (for verification)
 */
export function reconstructCommitment(
  secret: string,
  nullifier: string,
  amount: string,
  token: string,
  chainId: string
): string {
  const commitment = createHash('sha256')
    .update(Buffer.from(secret, 'hex'))
    .update(Buffer.from(nullifier, 'hex'))
    .update(amount)
    .update(token.toLowerCase())
    .update(chainId)
    .digest('hex');
  
  return `0x${commitment}`;
}

/**
 * Compute nullifier hash from nullifier
 */
export function computeNullifierHash(nullifier: string): string {
  const hash = createHash('sha256')
    .update(Buffer.from(nullifier, 'hex'))
    .digest('hex');
  return `0x${hash}`;
}

/**
 * Verify a withdrawal request matches the deposit note
 */
export function verifyWithdrawalRequest(
  request: WithdrawalRequest,
  secret: string,
  nullifier: string
): { valid: boolean; error?: string } {
  // Verify nullifier hash
  const computedNullifierHash = computeNullifierHash(nullifier);
  if (computedNullifierHash !== request.nullifierHash) {
    return { valid: false, error: 'Nullifier hash mismatch' };
  }
  
  // Verify commitment
  const computedCommitment = reconstructCommitment(
    secret,
    nullifier,
    request.amount,
    request.token,
    request.chainId
  );
  
  if (computedCommitment !== request.commitment) {
    return { valid: false, error: 'Commitment mismatch' };
  }
  
  // Check deadline
  if (request.deadline < Date.now()) {
    return { valid: false, error: 'Request expired' };
  }
  
  return { valid: true };
}

// ============ Relayer Service ============

export class RelayerService {
  private config: RelayerConfig;
  private usedNullifiers: Map<string, { chainId: string; timestamp: number }> = new Map();
  private pendingRequests: Map<string, WithdrawalRequest> = new Map();
  private stats: RelayerStats = {
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalVolume: BigInt(0),
    pendingRequests: 0,
    usedNullifiers: 0,
  };
  
  constructor(config: Partial<RelayerConfig> = {}) {
    this.config = {
      feePercent: config.feePercent ?? 0.3,
      minFeeLamports: config.minFeeLamports ?? BigInt(5000), // 0.000005 SOL
      minFeeWei: config.minFeeWei ?? BigInt(100000000000000), // 0.0001 ETH
      maxPendingRequests: config.maxPendingRequests ?? 100,
      requestTimeoutMs: config.requestTimeoutMs ?? 300000, // 5 minutes
    };
  }
  
  /**
   * Calculate relayer fee for a withdrawal
   */
  calculateFee(amount: bigint, chainId: string): bigint {
    const percentFee = (amount * BigInt(Math.floor(this.config.feePercent * 1000))) / BigInt(100000);
    
    const minFee = chainId.includes('solana') 
      ? this.config.minFeeLamports 
      : this.config.minFeeWei;
    
    return percentFee > minFee ? percentFee : minFee;
  }
  
  /**
   * Check if nullifier has been used on a specific chain
   */
  isNullifierUsed(nullifierHash: string, chainId: string): boolean {
    const key = `${chainId}:${nullifierHash.toLowerCase()}`;
    return this.usedNullifiers.has(key);
  }
  
  /**
   * Mark nullifier as used
   */
  markNullifierUsed(nullifierHash: string, chainId: string): void {
    const key = `${chainId}:${nullifierHash.toLowerCase()}`;
    this.usedNullifiers.set(key, { chainId, timestamp: Date.now() });
    this.stats.usedNullifiers++;
  }
  
  /**
   * Submit withdrawal request to relayer queue
   */
  async submitWithdrawalRequest(request: WithdrawalRequest): Promise<{
    success: boolean;
    requestId?: string;
    error?: string;
    estimatedFee?: string;
  }> {
    // Validate request
    if (!request.commitment || !request.nullifierHash || !request.recipient) {
      return { success: false, error: 'Missing required fields' };
    }
    
    // Check nullifier not used
    if (this.isNullifierUsed(request.nullifierHash, request.chainId)) {
      return { success: false, error: 'Nullifier already used - possible double-spend attempt' };
    }
    
    // Check pending requests limit
    if (this.pendingRequests.size >= this.config.maxPendingRequests) {
      return { success: false, error: 'Relayer queue full, try again later' };
    }
    
    // Check deadline
    if (request.deadline < Date.now()) {
      return { success: false, error: 'Request already expired' };
    }
    
    // Calculate fee
    const amount = BigInt(request.amount);
    const fee = this.calculateFee(amount, request.chainId);
    
    // Generate request ID
    const requestId = createHash('sha256')
      .update(request.commitment)
      .update(request.nullifierHash)
      .update(Date.now().toString())
      .update(randomBytes(8))
      .digest('hex')
      .slice(0, 16);
    
    // Store pending request
    this.pendingRequests.set(requestId, request);
    this.stats.pendingRequests = this.pendingRequests.size;
    
    // Set timeout to auto-remove expired requests
    setTimeout(() => {
      if (this.pendingRequests.has(requestId)) {
        this.pendingRequests.delete(requestId);
        this.stats.pendingRequests = this.pendingRequests.size;
      }
    }, this.config.requestTimeoutMs);
    
    return {
      success: true,
      requestId,
      estimatedFee: fee.toString(),
    };
  }
  
  /**
   * Get pending request by ID
   */
  getPendingRequest(requestId: string): WithdrawalRequest | undefined {
    return this.pendingRequests.get(requestId);
  }
  
  /**
   * Complete a withdrawal request (after on-chain execution)
   */
  completeRequest(requestId: string, txHash: string): void {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      this.markNullifierUsed(request.nullifierHash, request.chainId);
      this.pendingRequests.delete(requestId);
      this.stats.totalWithdrawals++;
      this.stats.totalVolume += BigInt(request.amount);
      this.stats.pendingRequests = this.pendingRequests.size;
    }
  }
  
  /**
   * Cancel a pending request
   */
  cancelRequest(requestId: string): boolean {
    const deleted = this.pendingRequests.delete(requestId);
    if (deleted) {
      this.stats.pendingRequests = this.pendingRequests.size;
    }
    return deleted;
  }
  
  /**
   * Get all pending requests for a chain
   */
  getPendingRequestsByChain(chainId: string): Map<string, WithdrawalRequest> {
    const filtered = new Map<string, WithdrawalRequest>();
    for (const [id, request] of this.pendingRequests) {
      if (request.chainId === chainId) {
        filtered.set(id, request);
      }
    }
    return filtered;
  }
  
  /**
   * Get relayer statistics
   */
  getStats(): RelayerStats {
    return { ...this.stats };
  }
  
  /**
   * Record a deposit (for stats tracking)
   */
  recordDeposit(amount: bigint): void {
    this.stats.totalDeposits++;
    this.stats.totalVolume += amount;
  }
}

// ============ Singleton Instance ============

let relayerInstance: RelayerService | null = null;

export function getRelayerService(config?: Partial<RelayerConfig>): RelayerService {
  if (!relayerInstance) {
    relayerInstance = new RelayerService(config);
  }
  return relayerInstance;
}

export function resetRelayerService(): void {
  relayerInstance = null;
}
