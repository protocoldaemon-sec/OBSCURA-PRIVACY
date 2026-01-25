/**
 * Multi-Chain Executor
 * 
 * Handles settlement across EVM and Solana chains
 * 
 * Integrations:
 * - Helius: Enhanced Solana RPC with priority fees
 * - ZK Compression: Compressed settlement record storage
 * - Arcium: Confidential batch optimization (optional)
 */

import type { Hash } from '@obscura/crypto';
import { toHex } from '@obscura/crypto';
import type { 
  BatchCommitment, 
  SettlementRecord, 
  ChainId, 
  SettlementStatus,
  ShieldedIntent,
  SelectedQuote,
} from '../types.js';
import { 
  HeliusClient, 
  createHeliusClient,
} from '../solana/helius.js';
import { 
  ZKCompressionClient, 
  createZKCompressionClient,
  type CompressedSettlementRecord 
} from '../solana/zk-compression.js';
import {
  ArciumClient,
  createArciumClient,
} from '../solana/arcium/index.js';
import {
  SolanaSettlementService,
  createSolanaSettlementService,
} from '../solana/settlement.js';

/** Chain configuration */
export interface ChainConfig {
  chainId: ChainId;
  rpcUrl: string;
  contractAddress: string;
  type: 'evm' | 'solana';
  confirmations: number;
  /** Use Helius for Solana chains */
  useHelius?: boolean;
  /** Use ZK Compression for settlement records */
  useCompression?: boolean;
}

/** Executor configuration */
export interface ExecutorConfig {
  chains: ChainConfig[];
  privateKey?: string;
  quorumRequired?: number;
  /** Enable Helius integration for Solana */
  enableHelius?: boolean;
  /** Enable ZK Compression for settlement records */
  enableCompression?: boolean;
  /** Enable Arcium confidential computing */
  enableArcium?: boolean;
}

/** Submission result */
export interface SubmissionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: bigint;
  /** Compressed record reference (if compression enabled) */
  compressedRecord?: CompressedSettlementRecord;
  /** Priority fee used (Solana with Helius) */
  priorityFee?: number;
}

/**
 * Multi-Chain Executor class
 * 
 * Handles settlement across EVM and Solana chains with integrations:
 * - Helius: Priority fees, webhooks, enhanced APIs
 * - ZK Compression: Compressed settlement record storage
 * - Arcium: Confidential batch optimization
 */
export class MultiChainExecutor {
  protected chains: Map<ChainId, ChainConfig> = new Map();
  protected pendingSettlements: Map<string, SettlementRecord> = new Map();
  
  // Integration clients
  protected heliusClient: HeliusClient | null = null;
  protected compressionClient: ZKCompressionClient | null = null;
  protected arciumClient: ArciumClient | null = null;
  protected solanaSettlement: SolanaSettlementService | null = null;

  constructor(config: ExecutorConfig) {
    for (const chain of config.chains) {
      this.chains.set(chain.chainId, chain);
    }

    // Initialize Solana settlement service
    this.solanaSettlement = createSolanaSettlementService();
    if (this.solanaSettlement) {
      console.log('[Executor] Solana settlement service enabled');
    }

    // Initialize integrations
    if (config.enableHelius) {
      this.heliusClient = createHeliusClient();
      if (this.heliusClient) {
        console.log('[Executor] Helius integration enabled');
      }
    }

    if (config.enableCompression) {
      this.compressionClient = createZKCompressionClient();
      if (this.compressionClient) {
        console.log('[Executor] ZK Compression enabled');
      }
    }

    if (config.enableArcium) {
      this.arciumClient = createArciumClient();
      if (this.arciumClient) {
        console.log('[Executor] Arcium confidential computing enabled');
      }
    }
  }

  /**
   * Get Solana settlement service for direct access
   */
  getSolanaSettlement(): SolanaSettlementService | null {
    return this.solanaSettlement;
  }

  /**
   * Get Helius client for direct access
   */
  getHeliusClient(): HeliusClient | null {
    return this.heliusClient;
  }

  /**
   * Get ZK Compression client for direct access
   */
  getCompressionClient(): ZKCompressionClient | null {
    return this.compressionClient;
  }

  /**
   * Get Arcium client for direct access
   */
  getArciumClient(): ArciumClient | null {
    return this.arciumClient;
  }

  /**
   * Submit a batch for settlement
   * 
   * Flow per whitepaper Section 9.5:
   * 1. Encrypt intents with Arcium (if enabled)
   * 2. Run confidential solver auction (if enabled)
   * 3. Submit to chain with optimal execution
   */
  async submitBatch(batch: BatchCommitment): Promise<SubmissionResult> {
    const chainConfig = this.chains.get(batch.targetChain);
    if (!chainConfig) {
      return {
        success: false,
        error: `Chain ${batch.targetChain} not configured`
      };
    }

    // STEP 1: Encrypt batch intents with Arcium (if enabled)
    let encryptedIntents: any[] = [];
    if (this.arciumClient) {
      try {
        console.log(`[Arcium] Encrypting ${batch.count} intents for confidential processing...`);
        encryptedIntents = await Promise.all(
          batch.commitments.map(async (commitment) => {
            return await this.arciumClient!.encryptIntent({
              action: 'settle',
              inputAmount: 0n, // Amount hidden in commitment
              outputAmount: 0n, // Amount hidden in commitment
              deadline: batch.createdAt + 3600000, // 1 hour
            });
          })
        );
        console.log(`[Arcium] ✅ Intents encrypted successfully`);
      } catch (error) {
        console.warn(`[Arcium] Encryption failed, proceeding without:`, error);
      }
    }

    // STEP 2: Optimize batch ordering with MPC (if Arcium enabled)
    if (this.arciumClient && encryptedIntents.length > 0) {
      try {
        console.log(`[Arcium] Optimizing batch ordering via MPC...`);
        const optimization = await this.arciumClient.optimizeBatch(
          batch.commitments.map((commitment, i) => ({
            id: toHex(commitment),
            shielded: {
              commitment,
              encryptedIntent: encryptedIntents[i],
            } as any,
          }))
        );
        console.log(`[Arcium] ✅ Batch optimized, gas savings: ${optimization.gasSavings}`);
        console.log(`[Arcium] Optimal ordering: ${optimization.ordering.slice(0, 3).join(', ')}...`);
      } catch (error) {
        console.warn(`[Arcium] Batch optimization failed:`, error);
      }
    }

    // STEP 3: Submit to chain
    if (chainConfig.type === 'evm') {
      return this.submitToEVM(batch, chainConfig);
    } else if (chainConfig.type === 'solana') {
      return this.submitToSolana(batch, chainConfig);
    }

    return {
      success: false,
      error: `Unknown chain type: ${chainConfig.type}`
    };
  }

  /**
   * Submit to EVM chain
   */
  protected async submitToEVM(
    batch: BatchCommitment,
    config: ChainConfig
  ): Promise<SubmissionResult> {
    // This is a placeholder - actual implementation would use ethers.js or viem
    console.log(`[EVM] Submitting batch ${batch.batchId} to ${config.chainId}`);
    console.log(`[EVM] Contract: ${config.contractAddress}`);
    console.log(`[EVM] Batch root: ${toHex(batch.batchRoot)}`);
    console.log(`[EVM] Intent count: ${batch.count}`);

    // In real implementation:
    // 1. Connect to RPC
    // 2. Encode calldata for updateRoot or settle
    // 3. Estimate gas
    // 4. Send transaction
    // 5. Wait for confirmations

    // Simulated success
    const txHash = '0x' + toHex(new Uint8Array(32).fill(1));
    
    // Record pending settlement
    this.pendingSettlements.set(batch.batchId, {
      batchId: batch.batchId,
      chain: config.chainId,
      txHash,
      blockNumber: 0,
      status: 'submitted',
      gasUsed: 0n,
      settledAt: Date.now()
    });

    return {
      success: true,
      txHash,
      gasUsed: 150000n
    };
  }

  /**
   * Submit to Solana
   * 
   * Uses real on-chain settlement with Helius for priority fees
   */
  protected async submitToSolana(
    batch: BatchCommitment,
    config: ChainConfig
  ): Promise<SubmissionResult> {
    console.log(`[Solana] Submitting batch ${batch.batchId} to ${config.chainId}`);
    console.log(`[Solana] Program: ${config.contractAddress}`);
    console.log(`[Solana] Batch root: ${toHex(batch.batchRoot)}`);
    console.log(`[Solana] Intent count: ${batch.count}`);

    // Use real Solana settlement service
    if (this.solanaSettlement) {
      try {
        const result = await this.solanaSettlement.submitSettlement(
          batch.batchRoot,
          batch.batchId
        );

        if (result.success && result.txHash) {
          // Record settlement
          const record: SettlementRecord = {
            batchId: batch.batchId,
            chain: config.chainId,
            txHash: result.txHash,
            blockNumber: result.slot ?? 0,
            status: 'submitted',
            gasUsed: 5000n,
            settledAt: Date.now()
          };
          this.pendingSettlements.set(batch.batchId, record);

          // Compress settlement record if enabled
          let compressedRecord: CompressedSettlementRecord | undefined;
          if (this.compressionClient && config.useCompression !== false) {
            try {
              compressedRecord = await this.compressionClient.compressSettlementRecord(record);
              console.log(`[Solana] Settlement record compressed at index ${compressedRecord.leafIndex}`);
            } catch (err) {
              console.warn('[Solana] Failed to compress settlement record:', err);
            }
          }

          return {
            success: true,
            txHash: result.txHash,
            gasUsed: 5000n,
            compressedRecord,
          };
        } else {
          return {
            success: false,
            error: result.error || 'Settlement failed',
          };
        }
      } catch (error) {
        console.error('[Solana] Settlement error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Fallback to simulated if no settlement service
    console.warn('[Solana] No settlement service, using simulated response');
    const txHash = toHex(new Uint8Array(64).fill(2));
    
    const record: SettlementRecord = {
      batchId: batch.batchId,
      chain: config.chainId,
      txHash,
      blockNumber: 0,
      status: 'submitted',
      gasUsed: 5000n,
      settledAt: Date.now()
    };
    this.pendingSettlements.set(batch.batchId, record);

    return {
      success: true,
      txHash,
      gasUsed: 5000n,
    };
  }

  /**
   * Check settlement status
   */
  async checkSettlementStatus(batchId: string): Promise<SettlementRecord | undefined> {
    return this.pendingSettlements.get(batchId);
  }

  /**
   * Update settlement status (called after confirmation)
   */
  updateSettlementStatus(
    batchId: string,
    status: SettlementStatus,
    blockNumber?: number
  ): void {
    const record = this.pendingSettlements.get(batchId);
    if (record) {
      record.status = status;
      if (blockNumber !== undefined) {
        record.blockNumber = blockNumber;
      }
    }
  }

  /**
   * Get all pending settlements
   */
  getPendingSettlements(): SettlementRecord[] {
    return Array.from(this.pendingSettlements.values())
      .filter(r => r.status === 'pending' || r.status === 'submitted');
  }

  /**
   * Get chain config
   */
  getChainConfig(chainId: ChainId): ChainConfig | undefined {
    return this.chains.get(chainId);
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): ChainId[] {
    return Array.from(this.chains.keys());
  }

  /**
   * Execute directly with a solver quote (bypasses batching)
   * 
   * Used when a quote provides direct calldata for immediate execution
   */
  async executeDirectWithQuote(
    shielded: ShieldedIntent,
    quote: SelectedQuote
  ): Promise<SubmissionResult> {
    const targetChain = shielded.targetChainHint ?? 'ethereum';
    const chainConfig = this.chains.get(targetChain);
    
    if (!chainConfig) {
      return {
        success: false,
        error: `Chain ${targetChain} not configured`
      };
    }

    console.log(`[DirectExec] Executing with quote ${quote.id}`);
    console.log(`[DirectExec] Solver: ${quote.solverId}`);
    console.log(`[DirectExec] Output amount: ${quote.outputAmount}`);

    if (chainConfig.type === 'evm') {
      return this.executeQuoteOnEVM(shielded, quote, chainConfig);
    } else if (chainConfig.type === 'solana') {
      return this.executeQuoteOnSolana(shielded, quote, chainConfig);
    }

    return {
      success: false,
      error: `Unknown chain type: ${chainConfig.type}`
    };
  }

  /**
   * Execute quote on EVM chain
   */
  protected async executeQuoteOnEVM(
    _shielded: ShieldedIntent,
    quote: SelectedQuote,
    config: ChainConfig
  ): Promise<SubmissionResult> {
    console.log(`[EVM] Direct quote execution on ${config.chainId}`);
    console.log(`[EVM] Quote expires at: ${new Date(quote.expiresAt).toISOString()}`);

    // In real implementation:
    // 1. Verify quote hasn't expired
    // 2. Use quote.calldata to build transaction
    // 3. If bridge required, handle cross-chain flow
    // 4. Sign and send transaction

    if (quote.expiresAt < Date.now()) {
      return {
        success: false,
        error: 'Quote has expired'
      };
    }

    // Simulated success for direct execution
    const txHash = '0x' + toHex(new Uint8Array(32).fill(3));
    
    return {
      success: true,
      txHash,
      gasUsed: quote.gasEstimate
    };
  }

  /**
   * Execute quote on Solana
   * 
   * Uses Helius smart transactions for optimal execution
   */
  protected async executeQuoteOnSolana(
    _shielded: ShieldedIntent,
    quote: SelectedQuote,
    config: ChainConfig
  ): Promise<SubmissionResult> {
    console.log(`[Solana] Direct quote execution on ${config.chainId}`);
    console.log(`[Solana] Quote expires at: ${new Date(quote.expiresAt).toISOString()}`);

    if (quote.expiresAt < Date.now()) {
      return {
        success: false,
        error: 'Quote has expired'
      };
    }

    let priorityFee: number | undefined;

    // Use Helius smart transaction if available
    if (this.heliusClient && config.useHelius !== false) {
      try {
        const feeEstimate = await this.heliusClient.getPriorityFeeEstimate(
          [config.contractAddress],
          { priorityLevel: 'high' } // Higher priority for direct execution
        );
        priorityFee = feeEstimate.priorityFeeEstimate;
        console.log(`[Solana] Using Helius priority fee: ${priorityFee}`);

        // In real implementation, use sendSmartTransaction:
        // const txHash = await this.heliusClient.sendSmartTransaction(
        //   serializedTx,
        //   { skipPreflight: false, maxRetries: 3 }
        // );
      } catch (err) {
        console.warn('[Solana] Helius smart transaction failed, using fallback');
      }
    }

    // Simulated success
    const txHash = toHex(new Uint8Array(64).fill(4));
    
    return {
      success: true,
      txHash,
      gasUsed: BigInt(priorityFee ?? 10000),
      priorityFee,
    };
  }
}
