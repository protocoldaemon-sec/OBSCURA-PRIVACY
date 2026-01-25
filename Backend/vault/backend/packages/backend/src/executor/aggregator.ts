/**
 * Aggregator Service
 * 
 * Main orchestrator that combines:
 * - SIP privacy layer with SDK integration
 * - PQ authorization (WOTS signatures)
 * - Batch building
 * - Multi-chain execution
 * - Solver quote integration
 */

import { SIP, type Quote } from '@sip-protocol/sdk';
import { PQAuthService } from '../auth/service.js';
import { BatchBuilder } from './batch.js';
import { MultiChainExecutor, type ExecutorConfig } from './multi-chain.js';
import type { 
  ShieldedIntent, 
  AuthorizedIntent, 
  BatchCommitment,
  SettlementRecord,
  ChainId,
  RelayerInfo,
  QuoteRequest,
  SolverQuote,
  SelectedQuote,
} from '../types.js';
import type { WOTSSignedIntent, Hash } from '@obscura/crypto';
import { toHex } from '@obscura/crypto';

/** Aggregator configuration */
export interface AggregatorConfig {
  /** Executor configuration */
  executor: ExecutorConfig;
  /** Batch configuration */
  batch?: {
    maxBatchSize?: number;
    maxWaitTime?: number;
    minBatchSize?: number;
  };
  /** Enable automatic batch submission */
  autoSubmit?: boolean;
  /** Batch check interval (ms) */
  batchInterval?: number;
  /** SDK network (mainnet or testnet) */
  network?: 'mainnet' | 'testnet';
  /** Enable solver quote fetching */
  enableQuotes?: boolean;
  /** Quote timeout (ms) */
  quoteTimeout?: number;
}

/** Intent submission result */
export interface IntentSubmissionResult {
  success: boolean;
  intentId?: string;
  error?: string;
  batchId?: string;
  position?: number;
  /** Best quote if available */
  quote?: SolverQuote;
}

/**
 * Aggregator class
 * 
 * The main service that:
 * 1. Receives shielded intents with WOTS authorization
 * 2. Validates authorization off-chain
 * 3. Fetches solver quotes for best execution
 * 4. Batches valid intents
 * 5. Submits to settlement contracts
 */
export class Aggregator {
  private authService: PQAuthService;
  private batchBuilder: BatchBuilder;
  private executor: MultiChainExecutor;
  private config: AggregatorConfig;
  private intervalId?: ReturnType<typeof setInterval>;
  private sdk: SIP;

  /** Authorized intents waiting for batch */
  private pendingIntents: Map<string, AuthorizedIntent> = new Map();

  /** Completed batches */
  private completedBatches: Map<string, BatchCommitment> = new Map();

  /** Cached quotes by intent ID */
  private quoteCache: Map<string, SolverQuote[]> = new Map();

  constructor(config: AggregatorConfig, authService?: PQAuthService) {
    this.config = config;
    this.authService = authService ?? new PQAuthService();
    this.batchBuilder = new BatchBuilder(config.batch);
    this.executor = new MultiChainExecutor(config.executor);

    // Initialize SDK for quote fetching
    this.sdk = new SIP({ network: config.network ?? 'mainnet' });

    // Set up batch ready callback
    this.batchBuilder.onReady(batch => this.handleBatchReady(batch));

    // Start auto-submit if enabled
    if (config.autoSubmit) {
      this.startAutoSubmit();
    }
  }

  /**
   * Submit a shielded intent with WOTS authorization
   * 
   * Flow per whitepaper Section 9.5:
   * 1. Authorize with WOTS+ (post-quantum)
   * 2. Encrypt with Arcium MPC (if enabled)
   * 3. Add to batch builder
   */
  async submitIntent(
    shielded: ShieldedIntent,
    wotsAuth: WOTSSignedIntent
  ): Promise<IntentSubmissionResult> {
    // STEP 1: Authorize the intent (WOTS+)
    const { authorized, result } = this.authService.authorizeIntent(shielded, wotsAuth);

    if (!result.valid) {
      return {
        success: false,
        error: result.error
      };
    }

    // Generate intent ID
    const intentId = toHex(shielded.commitment);

    // STEP 2: Encrypt with Arcium (if enabled and connected)
    if (this.config.enableQuotes) {
      const arciumClient = this.executor.getArciumClient();
      if (arciumClient) {
        try {
          console.log(`[Aggregator] Encrypting intent ${intentId.slice(0, 8)}... with Arcium`);
          
          // Encrypt intent data for confidential processing
          const encryptedIntent = await arciumClient.encryptIntent({
            action: 'settle',
            inputAmount: 0n, // Amount hidden in commitment
            outputAmount: 0n, // Amount hidden in commitment
            deadline: Date.now() + 3600000, // 1 hour
          });

          // Store encrypted version in authorized intent
          (authorized as any).arciumEncrypted = encryptedIntent;
          
          console.log(`[Aggregator] ✅ Intent encrypted with Arcium MPC`);
        } catch (error) {
          console.warn(`[Aggregator] Arcium encryption failed, proceeding without:`, error);
        }
      }
    }

    // STEP 3: Store authorized intent
    this.pendingIntents.set(intentId, authorized);

    // STEP 4: Add to batch builder
    this.batchBuilder.addIntent(authorized);

    return {
      success: true,
      intentId,
      position: this.batchBuilder.getTotalPending()
    };
  }

  /**
   * Force build and submit all pending batches
   */
  async flushBatches(): Promise<SettlementRecord[]> {
    const batches = this.batchBuilder.buildAllBatches();
    const records: SettlementRecord[] = [];

    for (const batch of batches) {
      const record = await this.submitBatch(batch);
      if (record) {
        records.push(record);
      }
    }

    return records;
  }

  /**
   * Submit a batch to settlement
   */
  private async submitBatch(batch: BatchCommitment): Promise<SettlementRecord | undefined> {
    const result = await this.executor.submitBatch(batch);

    if (result.success && result.txHash) {
      this.completedBatches.set(batch.batchId, batch);

      return {
        batchId: batch.batchId,
        chain: batch.targetChain,
        txHash: result.txHash,
        blockNumber: 0,
        status: 'submitted',
        gasUsed: result.gasUsed ?? 0n,
        settledAt: Date.now()
      };
    }

    console.error(`Failed to submit batch ${batch.batchId}: ${result.error}`);
    return undefined;
  }

  /**
   * Handle batch ready callback
   */
  private async handleBatchReady(batch: BatchCommitment): Promise<void> {
    console.log(`Batch ready: ${batch.batchId} with ${batch.count} intents for ${batch.targetChain}`);

    if (this.config.autoSubmit) {
      await this.submitBatch(batch);
    }
  }

  /**
   * Start automatic batch submission
   */
  private startAutoSubmit(): void {
    const interval = this.config.batchInterval ?? 30000; // 30 seconds default
    
    this.intervalId = setInterval(() => {
      const expired = this.batchBuilder.checkExpiredBatches();
      for (const batch of expired) {
        this.submitBatch(batch);
      }
    }, interval);
  }

  /**
   * Stop automatic batch submission
   */
  stopAutoSubmit(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Register a WOTS key pool
   */
  registerPool(
    merkleRoot: Hash,
    params: import('@obscura/crypto').WOTSParams,
    totalKeys: number,
    owner?: string
  ): void {
    this.authService.registerPool(merkleRoot, params, totalKeys, owner);
  }

  // ============ Solver Quote Integration ============

  /**
   * Fetch quotes from solver network
   * 
   * Uses @sip-protocol/sdk to query NEAR Intents solver network
   * for the best execution prices
   */
  async getQuotes(request: QuoteRequest): Promise<SolverQuote[]> {
    if (!this.config.enableQuotes) {
      return [];
    }

    try {
      // Build SDK intent for quote request
      const intent = await this.sdk
        .intent()
        .input(request.sourceChain, request.inputAsset, request.amount)
        .output(request.targetChain, request.outputAsset)
        .build();

      // Fetch quotes from solver network
      const sdkQuotes = await this.sdk.getQuotes(intent);

      // Convert to our format
      return sdkQuotes.map((q: Quote, i: number) => this.convertQuote(q, i));
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
      return [];
    }
  }

  /**
   * Get best quote for a request
   */
  async getBestQuote(request: QuoteRequest): Promise<SolverQuote | null> {
    const quotes = await this.getQuotes(request);
    if (quotes.length === 0) return null;

    // Sort by output amount (descending) - best value first
    quotes.sort((a, b) => Number(b.outputAmount - a.outputAmount));
    return quotes[0];
  }

  /**
   * Execute with a specific quote
   */
  async executeWithQuote(
    shielded: ShieldedIntent,
    wotsAuth: WOTSSignedIntent,
    quote: SelectedQuote
  ): Promise<IntentSubmissionResult> {
    // First authorize the intent
    const submitResult = await this.submitIntent(shielded, wotsAuth);
    if (!submitResult.success) {
      return submitResult;
    }

    // If quote requires direct execution (bypass batching)
    if (quote.calldata) {
      // Direct solver execution
      try {
        const result = await this.executor.executeDirectWithQuote(
          shielded,
          quote
        );
        return {
          ...submitResult,
          quote,
        };
      } catch (error) {
        return {
          success: false,
          error: `Quote execution failed: ${error}`,
        };
      }
    }

    // Otherwise, proceed with normal batching
    return {
      ...submitResult,
      quote,
    };
  }

  /**
   * Convert SDK quote to our format
   */
  private convertQuote(sdkQuote: Quote, index: number): SolverQuote {
    return {
      id: sdkQuote.quoteId ?? `quote-${Date.now()}-${index}`,
      solverId: sdkQuote.solverId ?? 'unknown',
      inputAmount: BigInt(0), // SDK Quote doesn't have inputAmount
      outputAmount: BigInt(sdkQuote.outputAmount ?? 0),
      fee: BigInt(sdkQuote.fee ?? 0),
      gasEstimate: BigInt(0), // SDK Quote doesn't have gasEstimate
      expiresAt: sdkQuote.expiry ?? Date.now() + 60000,
      estimatedTime: sdkQuote.estimatedTime ?? 60,
      solverReputation: 0, // SDK Quote doesn't have reputation
    };
  }

  /**
   * Get intent status
   */
  getIntentStatus(intentId: string): {
    status: 'pending' | 'batched' | 'submitted' | 'confirmed' | 'unknown';
    batchId?: string;
    txHash?: string;
  } {
    // Check pending
    if (this.pendingIntents.has(intentId)) {
      return { status: 'pending' };
    }

    // Check completed batches
    for (const [batchId, batch] of this.completedBatches) {
      const commitment = batch.commitments.find(c => toHex(c) === intentId);
      if (commitment) {
        // checkSettlementStatus is async but we need sync result here
        // In production, this would be cached
        return {
          status: 'batched',
          batchId
        };
      }
    }

    return { status: 'unknown' };
  }

  /**
   * Get all pending batches
   */
  getPendingBatches(): BatchCommitment[] {
    return this.batchBuilder.getAllPendingBatches();
  }

  /**
   * Get batch by ID
   */
  getBatch(batchId: string): BatchCommitment | undefined {
    return this.completedBatches.get(batchId) ?? 
           this.batchBuilder.getBatchById(batchId);
  }

  /**
   * Get aggregator statistics
   */
  getStats(): {
    pendingIntents: number;
    pendingBatches: Map<ChainId, number>;
    completedBatches: number;
    supportedChains: ChainId[];
  } {
    return {
      pendingIntents: this.pendingIntents.size,
      pendingBatches: this.batchBuilder.getPendingCounts(),
      completedBatches: this.completedBatches.size,
      supportedChains: this.executor.getSupportedChains()
    };
  }

  /**
   * Get auth service for direct access
   */
  getAuthService(): PQAuthService {
    return this.authService;
  }

  /**
   * Get executor for direct access
   */
  getExecutor(): MultiChainExecutor {
    return this.executor;
  }

  /**
   * Shutdown aggregator
   */
  shutdown(): void {
    this.stopAutoSubmit();
  }
}
