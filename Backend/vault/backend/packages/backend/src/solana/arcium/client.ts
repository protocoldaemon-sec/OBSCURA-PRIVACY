/**
 * Arcium Client
 * 
 * Unified client for Arcium integration combining:
 * - cSPL: Confidential token operations
 * - MXE: Multi-party computation
 * - Settlement: Confidential intent settlement
 */

import type { ArciumConfig, EncryptedValue, ConfidentialBid, ViewingKey } from './types.js';
import { CSPLClient, createCSPLClient } from './cspl.js';
import { MXEClient, createMXEClient, MPCComputationType } from './mxe.js';
import type { ShieldedIntent, SolverQuote, BatchCommitment } from '../../types.js';

/** Arcium settlement result */
export interface ArciumSettlementResult {
  /** Settlement transaction signature */
  txSignature: string;
  /** Batch ID */
  batchId: string;
  /** Proof of correct settlement */
  proof: Uint8Array;
  /** Compressed record (if using ZK compression) */
  compressedRecord?: {
    treeAddress: string;
    leafIndex: number;
  };
}

/** Confidential quote from solver */
export interface ConfidentialSolverQuote {
  /** Solver ID */
  solverId: string;
  /** Encrypted output amount */
  encryptedOutput: EncryptedValue;
  /** Encrypted fee */
  encryptedFee: EncryptedValue;
  /** Quote expiry */
  expiresAt: number;
  /** Commitment to quote */
  commitment: Uint8Array;
  /** Solver signature */
  signature: Uint8Array;
}

/**
 * Arcium Client - Main entry point for Arcium integration
 * 
 * Uses Arcium Public Testnet with cluster offsets 0-4 (v0.5.1)
 * Requires @arcium-hq/client SDK for production use
 */
export class ArciumClient {
  private config: ArciumConfig;
  private cspl: CSPLClient;
  private mxe: MXEClient;
  private connected: boolean = false;

  constructor(config: ArciumConfig) {
    this.config = config;
    this.cspl = createCSPLClient(config);
    this.mxe = createMXEClient(config);
  }

  /**
   * Initialize and connect to Arcium network
   * 
   * For production, use @arcium-hq/client SDK:
   * ```typescript
   * import { getClusterAccAddress } from "@arcium-hq/client";
   * const clusterAccount = getClusterAccAddress(clusterOffset);
   * ```
   */
  async connect(): Promise<void> {
    await this.mxe.connect();
    this.connected = true;
    console.log(`[Arcium] Connected to cluster offset ${this.config.clusterOffset} on ${this.config.solanaCluster}`);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get cSPL client for direct token operations
   */
  getCSPLClient(): CSPLClient {
    return this.cspl;
  }

  /**
   * Get MXE client for direct MPC operations
   */
  getMXEClient(): MXEClient {
    return this.mxe;
  }

  // ============ Confidential Intent Operations ============

  /**
   * Encrypt an intent for confidential processing
   */
  async encryptIntent(intent: {
    action: string;
    inputAmount: bigint;
    outputAmount: bigint;
    deadline: number;
  }): Promise<EncryptedValue> {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({
      action: intent.action,
      inputAmount: intent.inputAmount.toString(),
      outputAmount: intent.outputAmount.toString(),
      deadline: intent.deadline,
    }));

    return this.mxe.encrypt(data);
  }

  /**
   * Run confidential solver auction
   * 
   * Solvers submit encrypted quotes, best quote wins
   * without revealing individual amounts
   */
  async runSolverAuction(
    quotes: ConfidentialSolverQuote[]
  ): Promise<{ winnerId: string; proof: Uint8Array }> {
    this.ensureConnected();

    // Convert quotes to MXE format
    const quoteInputs = quotes.map(q => ({
      solverId: q.solverId,
      encryptedOutput: q.encryptedOutput,
    }));

    return this.mxe.compareQuotes(quoteInputs);
  }

  /**
   * Encrypt a solver quote for confidential auction
   */
  async encryptQuote(quote: SolverQuote): Promise<ConfidentialSolverQuote> {
    this.ensureConnected();

    const encryptedOutput = await this.mxe.encryptAmount(quote.outputAmount);
    const encryptedFee = await this.mxe.encryptAmount(quote.fee);

    // Generate commitment
    const commitment = await this.generateCommitment(
      quote.outputAmount,
      quote.fee
    );

    return {
      solverId: quote.solverId,
      encryptedOutput,
      encryptedFee,
      expiresAt: quote.expiresAt,
      commitment,
      signature: new Uint8Array(64), // Placeholder - actual signing needed
    };
  }

  /**
   * Optimize batch ordering using MPC
   * 
   * Computes optimal intent ordering without revealing
   * individual intent details
   */
  async optimizeBatch(
    intents: Array<{ id: string; shielded: ShieldedIntent }>
  ): Promise<{ ordering: string[]; gasSavings: bigint; proof: Uint8Array }> {
    this.ensureConnected();

    // Encrypt intent data for MPC
    const encryptedIntents = await Promise.all(
      intents.map(async intent => ({
        intentId: intent.id,
        encryptedData: await this.mxe.encrypt(intent.shielded.encryptedIntent),
      }))
    );

    return this.mxe.optimizeBatch(encryptedIntents);
  }

  // ============ Confidential Token Operations ============

  /**
   * Create confidential token account
   */
  async createConfidentialAccount(
    mint: string,
    owner: string
  ): Promise<{ account: string; instruction: Uint8Array }> {
    return this.cspl.initializeAccount(mint, owner);
  }

  /**
   * Deposit tokens to confidential account
   */
  async depositToConfidential(
    account: string,
    amount: bigint,
    sourceTokenAccount: string
  ): Promise<{ instruction: Uint8Array; encryptedAmount: EncryptedValue }> {
    return this.cspl.deposit(account, amount, sourceTokenAccount);
  }

  /**
   * Transfer tokens confidentially
   */
  async confidentialTransfer(
    source: string,
    destination: string,
    amount: bigint
  ): Promise<{ instruction: Uint8Array }> {
    // Get source account to access encrypted balance
    const sourceAccount = await this.cspl.getAccount(source);
    if (!sourceAccount) {
      throw new Error('Source account not found');
    }

    // Encrypt the transfer amount for both parties
    const encryptedAmount = await this.mxe.encryptAmount(amount);

    // Generate proofs
    const rangeProof = await this.cspl.generateRangeProof(
      source,
      amount,
      sourceAccount.encryptedBalance
    );

    // For equality proof, we need to re-encrypt for destination
    const destEncrypted = await this.mxe.encryptAmount(amount);
    const equalityProof = await this.cspl.generateEqualityProof(
      encryptedAmount,
      destEncrypted
    );

    // Build transfer
    const transfer = await this.cspl.transfer(
      source,
      destination,
      encryptedAmount,
      { rangeProof, equalityProof }
    );

    return {
      instruction: await this.cspl.buildTransferInstruction(transfer),
    };
  }

  /**
   * Create viewing key for selective disclosure
   */
  async createViewingKey(
    account: string,
    viewerPubKey: Uint8Array,
    permissions: ViewingKey['permissions'],
    expiresAt?: number
  ): Promise<ViewingKey> {
    return this.cspl.createViewingKey(account, viewerPubKey, permissions, expiresAt);
  }

  /**
   * Decrypt balance using viewing key
   */
  async decryptBalance(account: string, viewingKey: ViewingKey): Promise<bigint> {
    return this.cspl.decryptBalance(account, viewingKey);
  }

  // ============ Settlement Operations ============

  /**
   * Settle a batch using confidential computation
   * 
   * Uses MPC to verify batch validity without revealing
   * individual intent details
   */
  async settleConfidentialBatch(
    batch: BatchCommitment,
    encryptedIntents: EncryptedValue[]
  ): Promise<ArciumSettlementResult> {
    this.ensureConnected();

    // Verify batch using MPC
    const verificationResult = await this.mxe.compute({
      computationType: MPCComputationType.BATCH_OPTIMIZE,
      inputs: encryptedIntents.map((encrypted, i) => ({
        partyId: `intent-${i}`,
        data: encrypted,
        schema: 'settlement_intent',
      })),
      params: {
        batchRoot: Buffer.from(batch.batchRoot).toString('hex'),
        targetChain: batch.targetChain,
      },
    });

    if (verificationResult.status !== 'completed') {
      throw new Error(`Batch verification failed: ${verificationResult.status}`);
    }

    // In production, this would submit the actual settlement transaction
    const txSignature = `sim_${batch.batchId}_${Date.now()}`;

    return {
      txSignature,
      batchId: batch.batchId,
      proof: verificationResult.proof,
    };
  }

  // ============ Private Methods ============

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Not connected to Arcium network. Call connect() first.');
    }
  }

  private async generateCommitment(
    outputAmount: bigint,
    fee: bigint
  ): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${outputAmount}:${fee}:${Date.now()}`);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hash);
  }
}

/**
 * Create Arcium client from environment variables
 * 
 * Uses Arcium Public Testnet on Solana Devnet
 * Available cluster offsets: 0, 1, 2, 3, 4 (all on v0.5.1)
 */
export function createArciumClient(): ArciumClient | null {
  const clusterOffset = process.env.ARCIUM_CLUSTER_OFFSET;
  const rpcUrl = process.env.ARCIUM_RPC_URL || process.env.HELIUS_RPC_URL;

  if (!clusterOffset || !rpcUrl) {
    console.warn('[Arcium] ARCIUM_CLUSTER_OFFSET or ARCIUM_RPC_URL not set');
    return null;
  }

  return new ArciumClient({
    rpcUrl,
    clusterOffset: parseInt(clusterOffset, 10),
    appId: process.env.ARCIUM_APP_ID ?? 'obscura',
    solanaCluster: (process.env.SOLANA_CLUSTER as 'mainnet-beta' | 'devnet') ?? 'devnet',
    programId: process.env.ARCIUM_PROGRAM_ID,
    mempoolSize: (process.env.ARCIUM_MEMPOOL_SIZE as 'Tiny' | 'Small' | 'Medium' | 'Large') ?? 'Tiny',
  });
}

/**
 * Create Arcium client with explicit config
 */
export function createArciumClientWithConfig(config: ArciumConfig): ArciumClient {
  return new ArciumClient(config);
}
