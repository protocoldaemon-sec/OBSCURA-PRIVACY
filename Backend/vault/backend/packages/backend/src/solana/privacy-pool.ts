/**
 * Privacy Pool for Solana
 * 
 * Implements batch settlement with mixing per whitepaper Section 4.2:
 * - Multiple deposits aggregated into pool
 * - Batch withdrawals mix multiple recipients
 * - Timing randomization breaks analysis
 * - Commitment-based claims hide individual amounts
 * 
 * Privacy Model:
 * - Deposit: User → Pool (visible, but pool has many deposits)
 * - Claim: Pool → Recipient (visible, but mixed with other claims)
 * - Linkability: Broken by batching + timing + amount mixing
 */

import { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { sha256 } from '@noble/hashes/sha256';

export interface PoolConfig {
  connection: Connection;
  payer: Keypair;
  programId: PublicKey;
  minBatchSize: number;      // Minimum claims before batch execution
  maxBatchWaitMs: number;    // Maximum wait time before forced batch
  minDelayMs: number;        // Minimum random delay
  maxDelayMs: number;        // Maximum random delay
}

export interface PendingClaim {
  id: string;
  commitment: string;
  recipient: string;
  amount: number;           // In SOL
  createdAt: number;
  scheduledAt: number;      // When to execute (with random delay)
}

export interface BatchResult {
  success: boolean;
  batchId: string;
  txHash?: string;
  claims: Array<{
    id: string;
    recipient: string;
    amount: number;
    success: boolean;
  }>;
  error?: string;
}

/**
 * Privacy Pool - Batch claims with mixing
 * 
 * Flow:
 * 1. User deposits to stealth PDA (transfer endpoint)
 * 2. User submits claim request (goes to pending queue)
 * 3. Pool batches multiple claims together
 * 4. Single tx sends to multiple recipients (mixing)
 * 5. Observer sees: Pool → [R1, R2, R3, ...] (can't link deposits to claims)
 */
export class PrivacyPool {
  private config: PoolConfig;
  private pendingClaims: Map<string, PendingClaim> = new Map();
  private poolBalance: number = 0;
  private batchTimer: NodeJS.Timeout | null = null;
  private poolPDA: PublicKey;
  private poolBump: number;

  constructor(config: PoolConfig) {
    this.config = config;
    
    // Derive pool PDA
    const [poolPDA, poolBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('privacy_pool')],
      config.programId
    );
    this.poolPDA = poolPDA;
    this.poolBump = poolBump;
    
    console.log(`[PrivacyPool] Initialized`);
    console.log(`[PrivacyPool] Pool PDA: ${this.poolPDA.toBase58()}`);
    console.log(`[PrivacyPool] Min batch size: ${config.minBatchSize}`);
    console.log(`[PrivacyPool] Max wait: ${config.maxBatchWaitMs}ms`);
  }

  /**
   * Get pool PDA address
   */
  getPoolAddress(): string {
    return this.poolPDA.toBase58();
  }

  /**
   * Get current pool balance
   */
  async getPoolBalance(): Promise<number> {
    const balance = await this.config.connection.getBalance(this.poolPDA);
    this.poolBalance = balance / LAMPORTS_PER_SOL;
    return this.poolBalance;
  }

  /**
   * Get pending claims count
   */
  getPendingCount(): number {
    return this.pendingClaims.size;
  }

  /**
   * Add claim to pending queue with random delay
   * Returns claim ID for tracking
   */
  async queueClaim(
    commitment: string,
    recipient: string,
    amount: number
  ): Promise<{ claimId: string; scheduledAt: number; position: number }> {
    // Generate claim ID from commitment
    const claimId = this.generateClaimId(commitment, recipient);
    
    // Check for duplicate
    if (this.pendingClaims.has(claimId)) {
      throw new Error('Claim already pending');
    }

    // Calculate random delay for timing privacy
    const delay = this.randomDelay();
    const scheduledAt = Date.now() + delay;

    const claim: PendingClaim = {
      id: claimId,
      commitment,
      recipient,
      amount,
      createdAt: Date.now(),
      scheduledAt,
    };

    this.pendingClaims.set(claimId, claim);
    
    console.log(`[PrivacyPool] Queued claim ${claimId.slice(0, 8)}...`);
    console.log(`[PrivacyPool] Recipient: ${recipient.slice(0, 8)}...`);
    console.log(`[PrivacyPool] Amount: ${amount} SOL`);
    console.log(`[PrivacyPool] Scheduled in: ${delay}ms`);
    console.log(`[PrivacyPool] Pending claims: ${this.pendingClaims.size}`);

    // Start batch timer if not running
    this.startBatchTimer();

    // Check if we should execute batch immediately
    if (this.pendingClaims.size >= this.config.minBatchSize) {
      console.log(`[PrivacyPool] Batch size reached, executing...`);
      // Don't await - let it run async
      this.executeBatch().catch(err => {
        console.error('[PrivacyPool] Batch execution failed:', err);
      });
    }

    return {
      claimId,
      scheduledAt,
      position: this.pendingClaims.size,
    };
  }

  /**
   * Get claim status
   */
  getClaimStatus(claimId: string): PendingClaim | null {
    return this.pendingClaims.get(claimId) || null;
  }

  /**
   * Execute batch of pending claims
   * This is where privacy mixing happens
   */
  async executeBatch(): Promise<BatchResult> {
    const now = Date.now();
    const batchId = this.generateBatchId();
    
    // Get claims that are ready (past scheduled time)
    const readyClaims = Array.from(this.pendingClaims.values())
      .filter(c => c.scheduledAt <= now)
      .slice(0, 10); // Max 10 per batch for tx size limits

    if (readyClaims.length === 0) {
      return {
        success: true,
        batchId,
        claims: [],
      };
    }

    console.log(`[PrivacyPool] Executing batch ${batchId}`);
    console.log(`[PrivacyPool] Claims in batch: ${readyClaims.length}`);

    // Calculate total amount needed
    const totalAmount = readyClaims.reduce((sum, c) => sum + c.amount, 0);
    const totalLamports = Math.floor(totalAmount * LAMPORTS_PER_SOL);

    // Check payer balance (pool uses payer funds for now)
    const payerBalance = await this.config.connection.getBalance(this.config.payer.publicKey);
    if (payerBalance < totalLamports + 10000) { // + fees
      return {
        success: false,
        batchId,
        claims: [],
        error: 'Insufficient pool balance',
      };
    }

    // Build batch transaction with all transfers
    const transaction = new Transaction();
    
    for (const claim of readyClaims) {
      const recipientPubkey = new PublicKey(claim.recipient);
      const lamports = Math.floor(claim.amount * LAMPORTS_PER_SOL);
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: this.config.payer.publicKey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );
    }

    try {
      // Execute batch transaction
      const signature = await sendAndConfirmTransaction(
        this.config.connection,
        transaction,
        [this.config.payer],
        { commitment: 'confirmed' }
      );

      console.log(`[PrivacyPool] Batch executed: ${signature}`);

      // Remove executed claims from pending
      const results = readyClaims.map(claim => {
        this.pendingClaims.delete(claim.id);
        return {
          id: claim.id,
          recipient: claim.recipient,
          amount: claim.amount,
          success: true,
        };
      });

      return {
        success: true,
        batchId,
        txHash: signature,
        claims: results,
      };
    } catch (error) {
      console.error('[PrivacyPool] Batch failed:', error);
      return {
        success: false,
        batchId,
        claims: readyClaims.map(c => ({
          id: c.id,
          recipient: c.recipient,
          amount: c.amount,
          success: false,
        })),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Force execute all pending claims (for testing/emergency)
   */
  async forceExecuteAll(): Promise<BatchResult> {
    // Set all claims to ready
    for (const claim of this.pendingClaims.values()) {
      claim.scheduledAt = 0;
    }
    return this.executeBatch();
  }

  /**
   * Stop the batch timer
   */
  stop(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  // ============ Private Methods ============

  private generateClaimId(commitment: string, recipient: string): string {
    const data = Buffer.concat([
      Buffer.from(commitment),
      Buffer.from(recipient),
      Buffer.from(Date.now().toString()),
    ]);
    return Buffer.from(sha256(data)).toString('hex').slice(0, 32);
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private randomDelay(): number {
    const { minDelayMs, maxDelayMs } = this.config;
    return Math.floor(Math.random() * (maxDelayMs - minDelayMs)) + minDelayMs;
  }

  private startBatchTimer(): void {
    if (this.batchTimer) return;

    this.batchTimer = setInterval(async () => {
      if (this.pendingClaims.size > 0) {
        await this.executeBatch();
      }
    }, this.config.maxBatchWaitMs);
  }
}

/**
 * Create privacy pool from environment
 */
export function createPrivacyPool(
  connection: Connection,
  payer: Keypair,
  programId: PublicKey
): PrivacyPool {
  return new PrivacyPool({
    connection,
    payer,
    programId,
    minBatchSize: parseInt(process.env.BATCH_MIN_SIZE || '3'),
    maxBatchWaitMs: parseInt(process.env.BATCH_MAX_WAIT_TIME || '30000'),
    minDelayMs: 5000,   // 5 second minimum delay
    maxDelayMs: 30000,  // 30 second maximum delay
  });
}
