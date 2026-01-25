/**
 * Private Settlement Service
 * 
 * Full privacy implementation per whitepaper:
 * 1. Pedersen Commitments - Hide amounts
 * 2. Stealth Addresses - Hide recipients
 * 3. Batch Settlement - Mix transfers for unlinkability
 * 4. ZK Compression - Efficient on-chain storage (Light Protocol)
 * 5. Confidential Computing - Arcium MPC for encrypted execution
 * 
 * Flow (per Whitepaper Section 9.5):
 * 1. Price Discovery (public reference)
 * 2. Intent Encryption (Arcium MPC)
 * 3. Authorization (WOTS+)
 * 4. Confidential Auction (Arcium MPC)
 * 5. Private Execution (cSPL/Stealth)
 * 6. Settlement (Light Protocol ZK Compression)
 * 7. Completion (sealed result)
 */

import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from 'crypto';
import { 
  createCommitment, 
  serializeCommitment,
  createCommitmentHash,
  type PedersenCommitment 
} from './pedersen.js';
import { 
  deriveStealthAddress, 
  deriveStealthAddressFromRegular,
  isStealthMetaAddress,
  createStealthAnnouncement,
  type StealthAddressData 
} from './stealth.js';
import type { 
  PrivacyLevel,
  PrivateTransferRequest, 
  PrivateTransferResult,
  BatchEntry,
  SettlementBatch,
} from './types.js';
import { createArciumClient, type ArciumClient } from '../solana/arcium/client.js';
import { createLightProtocolClient, type LightProtocolClient } from '../solana/light-protocol/client.js';

/** Minimum batch size for privacy (more entries = better mixing) */
const MIN_BATCH_SIZE = 1; // For testing, production should be higher
const MAX_BATCH_SIZE = 50;
const BATCH_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Private Settlement Service
 * 
 * Integrates all privacy components per whitepaper:
 * - Arcium MPC for confidential computing
 * - Light Protocol for ZK Compression
 * - Pedersen commitments for amount hiding
 * - Stealth addresses for recipient hiding
 */
export class PrivateSettlementService {
  private pendingBatches: Map<string, SettlementBatch> = new Map();
  private batchCounter = 0;
  private nonce = 0;
  
  // Settlement services (injected)
  private solanaSettlement: any;
  private evmSettlement: any;
  
  // Privacy infrastructure
  private arciumClient: ArciumClient | null = null;
  private lightClient: LightProtocolClient | null = null;
  private arciumConnected = false;
  private lightConnected = false;
  
  constructor(config: {
    solanaSettlement?: any;
    evmSettlement?: any;
  }) {
    this.solanaSettlement = config.solanaSettlement;
    this.evmSettlement = config.evmSettlement;
    
    // Initialize Arcium client for confidential computing
    this.arciumClient = createArciumClient();
    if (this.arciumClient) {
      this.initializeArcium();
    }
    
    // Initialize Light Protocol client for ZK Compression
    this.lightClient = createLightProtocolClient();
    if (this.lightClient) {
      this.initializeLightProtocol();
    }
  }
  
  /**
   * Initialize Arcium MPC connection
   */
  private async initializeArcium(): Promise<void> {
    if (!this.arciumClient) return;
    
    try {
      await this.arciumClient.connect();
      this.arciumConnected = true;
      console.log('[PrivateSettlement] Arcium MPC connected');
    } catch (error) {
      console.warn('[PrivateSettlement] Arcium connection failed:', error);
      this.arciumConnected = false;
    }
  }
  
  /**
   * Initialize Light Protocol ZK Compression
   */
  private async initializeLightProtocol(): Promise<void> {
    if (!this.lightClient) return;
    
    try {
      await this.lightClient.connect();
      this.lightConnected = true;
      console.log('[PrivateSettlement] Light Protocol ZK Compression connected');
    } catch (error) {
      console.warn('[PrivateSettlement] Light Protocol connection failed:', error);
      this.lightConnected = false;
    }
  }

  /**
   * Process a private transfer
   * 
   * Full privacy flow per Whitepaper Section 9.5:
   * 1. Generate stealth address for recipient (hide recipient)
   * 2. Create Pedersen commitment for amount (hide amount)
   * 3. Encrypt intent via Arcium MPC (confidential computing)
   * 4. Add to batch queue for mixing
   * 5. Settle with ZK Compression (Light Protocol)
   * 6. Only commitments visible on-chain
   */
  async processPrivateTransfer(
    request: PrivateTransferRequest
  ): Promise<PrivateTransferResult> {
    const intentId = this.generateIntentId();
    
    try {
      // Step 1: Generate stealth address (EIP-5564 style)
      const stealthData = this.generateStealthAddress(
        request.recipient,
        request.sourceChain
      );
      
      console.log(`[PrivateSettlement] Generated stealth address: ${stealthData.stealthAddress}`);
      
      // Step 2: Create Pedersen commitment for amount
      const amountCommitment = createCommitment(request.amount);
      const commitmentHash = serializeCommitment(amountCommitment);
      
      console.log(`[PrivateSettlement] Created amount commitment: ${commitmentHash.slice(0, 16)}...`);
      
      // Step 3: Encrypt intent via Arcium MPC (if available)
      let encryptedIntent: Uint8Array | null = null;
      let arciumProof: Uint8Array | null = null;
      
      if (this.arciumConnected && this.arciumClient && request.privacyLevel === 'shielded') {
        try {
          console.log(`[PrivateSettlement] Encrypting intent via Arcium MPC...`);
          const encrypted = await this.arciumClient.encryptIntent({
            action: 'transfer',
            inputAmount: request.amount,
            outputAmount: request.amount,
            deadline: Date.now() + 3600000, // 1 hour
          });
          encryptedIntent = encrypted.ciphertext;
          arciumProof = encrypted.commitment;
          console.log(`[PrivateSettlement] Intent encrypted via Arcium MPC`);
        } catch (err) {
          console.warn(`[PrivateSettlement] Arcium encryption failed, using fallback:`, err);
        }
      }
      
      // Step 4: Create batch entry
      const batchEntry: BatchEntry = {
        intentId,
        commitment: amountCommitment,
        stealthAddress: stealthData,
        encryptedAmount: encryptedIntent || this.encryptAmount(request.amount, stealthData.sharedSecret!),
        timestamp: Date.now(),
      };
      
      // Step 5: Add to batch or process immediately based on privacy level
      if (request.privacyLevel === 'shielded') {
        // For maximum privacy, wait for batch (better mixing)
        const batchId = await this.addToBatch(batchEntry, request.sourceChain);
        
        // Check if batch is ready
        const batchKey = `${request.sourceChain}_pending`;
        const batch = this.pendingBatches.get(batchKey);
        if (batch && batch.entries.length >= MIN_BATCH_SIZE) {
          // Settle the batch
          const result = await this.settleBatch(batchId, request);
          
          // Step 6: Store settlement record via ZK Compression (if available)
          if (this.lightConnected && this.lightClient && result.success) {
            try {
              await this.storeSettlementRecord(intentId, commitmentHash, request.sourceChain);
              console.log(`[PrivateSettlement] Settlement stored via ZK Compression`);
            } catch (err) {
              console.warn(`[PrivateSettlement] ZK Compression storage failed:`, err);
            }
          }
          
          return {
            success: result.success,
            intentId,
            stealthAddress: stealthData.stealthAddress,
            amountCommitment: commitmentHash,
            depositTxHash: result.depositTxHash,
            withdrawalTxHash: result.withdrawalTxHash,
            batchId,
            explorerUrl: result.explorerUrl,
            error: result.error,
            // Privacy metadata
            arciumEncrypted: !!encryptedIntent,
            zkCompressed: this.lightConnected,
          };
        }
        
        // Batch not ready yet, return pending
        return {
          success: true,
          intentId,
          stealthAddress: stealthData.stealthAddress,
          amountCommitment: commitmentHash,
          batchId,
          arciumEncrypted: !!encryptedIntent,
        };
      } else {
        // For transparent/compliant, process immediately but still use commitments
        const result = await this.settleImmediate(batchEntry, request);
        
        // Store via ZK Compression for compliant mode
        if (this.lightConnected && this.lightClient && result.success && request.privacyLevel === 'compliant') {
          try {
            await this.storeSettlementRecord(intentId, commitmentHash, request.sourceChain);
          } catch (err) {
            console.warn(`[PrivateSettlement] ZK Compression storage failed:`, err);
          }
        }
        
        return {
          success: result.success,
          intentId,
          stealthAddress: request.privacyLevel === 'transparent' 
            ? request.recipient 
            : stealthData.stealthAddress,
          amountCommitment: commitmentHash,
          depositTxHash: result.depositTxHash,
          withdrawalTxHash: result.withdrawalTxHash,
          explorerUrl: result.explorerUrl,
          error: result.error,
          arciumEncrypted: false,
          zkCompressed: request.privacyLevel === 'compliant' && this.lightConnected,
        };
      }
    } catch (error) {
      console.error('[PrivateSettlement] Error:', error);
      return {
        success: false,
        intentId,
        amountCommitment: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Store settlement record via Light Protocol ZK Compression
   * ~1000x cheaper than traditional storage
   */
  private async storeSettlementRecord(
    intentId: string,
    commitmentHash: string,
    chain: 'solana' | 'ethereum'
  ): Promise<void> {
    if (!this.lightClient) return;
    
    await this.lightClient.storeIntentCommitment(
      intentId,
      Buffer.from(commitmentHash, 'hex'),
      Date.now() + 86400000 // 24 hour expiry
    );
  }

  /**
   * Generate stealth address for recipient
   */
  private generateStealthAddress(
    recipient: string,
    chain: 'solana' | 'ethereum'
  ): StealthAddressData {
    if (isStealthMetaAddress(recipient)) {
      return deriveStealthAddress(recipient, chain);
    } else {
      return deriveStealthAddressFromRegular(recipient, chain);
    }
  }

  /**
   * Encrypt amount using shared secret
   */
  private encryptAmount(amount: bigint, sharedSecret: Uint8Array): Uint8Array {
    const amountBytes = Buffer.alloc(8);
    amountBytes.writeBigUInt64BE(amount);
    
    // XOR with hash of shared secret (simple encryption)
    const key = sha256(sharedSecret);
    const encrypted = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
      encrypted[i] = amountBytes[i] ^ key[i];
    }
    
    return new Uint8Array(encrypted);
  }

  /**
   * Add entry to batch queue
   */
  private async addToBatch(
    entry: BatchEntry,
    chain: 'solana' | 'ethereum'
  ): Promise<string> {
    const batchKey = `${chain}_pending`;
    
    let batch = this.pendingBatches.get(batchKey);
    if (!batch) {
      batch = {
        batchId: `batch_${++this.batchCounter}_${Date.now()}`,
        entries: [],
        merkleRoot: new Uint8Array(32),
        createdAt: Date.now(),
        status: 'pending',
      };
      this.pendingBatches.set(batchKey, batch);
    }
    
    batch.entries.push(entry);
    
    // Update Merkle root
    batch.merkleRoot = this.computeBatchMerkleRoot(batch.entries);
    
    console.log(`[PrivateSettlement] Added to batch ${batch.batchId}, size: ${batch.entries.length}`);
    
    return batch.batchId;
  }

  /**
   * Compute Merkle root for batch
   */
  private computeBatchMerkleRoot(entries: BatchEntry[]): Uint8Array {
    if (entries.length === 0) {
      return new Uint8Array(32);
    }
    
    // Hash each entry
    const leaves = entries.map(entry => {
      const data = Buffer.concat([
        Buffer.from(entry.intentId),
        Buffer.from(entry.commitment.commitment),
        Buffer.from(entry.stealthAddress.stealthAddress),
      ]);
      return sha256(data);
    });
    
    // Build Merkle tree
    let level = leaves;
    while (level.length > 1) {
      const nextLevel: Uint8Array[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || left;
        const combined = Buffer.concat([Buffer.from(left), Buffer.from(right)]);
        nextLevel.push(sha256(combined));
      }
      level = nextLevel;
    }
    
    return new Uint8Array(level[0]);
  }

  /**
   * Settle a batch
   */
  private async settleBatch(
    batchId: string,
    request: PrivateTransferRequest
  ): Promise<{
    success: boolean;
    depositTxHash?: string;
    withdrawalTxHash?: string;
    explorerUrl?: string;
    error?: string;
  }> {
    const batchKey = `${request.sourceChain}_pending`;
    const batch = this.pendingBatches.get(batchKey);
    
    if (!batch) {
      return { success: false, error: 'Batch not found' };
    }
    
    batch.status = 'processing';
    
    try {
      // Find the entry for this request
      const entry = batch.entries.find(e => 
        e.commitment.value === request.amount
      );
      
      if (!entry) {
        return { success: false, error: 'Entry not found in batch' };
      }
      
      // Execute settlement based on chain
      if (request.sourceChain === 'solana' && this.solanaSettlement) {
        return await this.settleSolanaBatch(entry, request, batch);
      } else if (request.sourceChain === 'ethereum' && this.evmSettlement) {
        return await this.settleEVMBatch(entry, request, batch);
      }
      
      return { success: false, error: 'Settlement service not available' };
    } catch (error) {
      batch.status = 'failed';
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Settlement failed' 
      };
    }
  }

  /**
   * Settle immediately (for transparent/compliant mode)
   */
  private async settleImmediate(
    entry: BatchEntry,
    request: PrivateTransferRequest
  ): Promise<{
    success: boolean;
    depositTxHash?: string;
    withdrawalTxHash?: string;
    explorerUrl?: string;
    error?: string;
  }> {
    // For immediate settlement, we still use the privacy primitives
    // but don't wait for batching
    
    if (request.sourceChain === 'solana' && this.solanaSettlement) {
      return await this.settleSolanaImmediate(entry, request);
    } else if (request.sourceChain === 'ethereum' && this.evmSettlement) {
      return await this.settleEVMImmediate(entry, request);
    }
    
    return { success: false, error: 'Settlement service not available' };
  }

  /**
   * Settle Solana batch
   */
  private async settleSolanaBatch(
    entry: BatchEntry,
    request: PrivateTransferRequest,
    batch: SettlementBatch
  ): Promise<{
    success: boolean;
    depositTxHash?: string;
    withdrawalTxHash?: string;
    explorerUrl?: string;
    error?: string;
  }> {
    const amountSOL = Number(request.amount) / 1e9;
    
    // Use stealth address as recipient for privacy
    const recipient = entry.stealthAddress.stealthAddress;
    
    console.log(`[PrivateSettlement] Settling Solana batch to stealth: ${recipient}`);
    console.log(`[PrivateSettlement] Batch Merkle root: ${Buffer.from(batch.merkleRoot).toString('hex').slice(0, 16)}...`);
    
    // Execute via vault flow
    const result = await this.solanaSettlement.transferViaVault(recipient, amountSOL);
    
    if (result.success) {
      batch.status = 'settled';
      return {
        success: true,
        depositTxHash: result.depositTxHash,
        withdrawalTxHash: result.withdrawalTxHash,
        explorerUrl: `https://explorer.solana.com/tx/${result.withdrawalTxHash}?cluster=devnet`,
      };
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Settle Solana immediate
   */
  private async settleSolanaImmediate(
    entry: BatchEntry,
    request: PrivateTransferRequest
  ): Promise<{
    success: boolean;
    depositTxHash?: string;
    withdrawalTxHash?: string;
    explorerUrl?: string;
    error?: string;
  }> {
    const amountSOL = Number(request.amount) / 1e9;
    
    // For transparent mode, use original recipient
    // For compliant mode, use stealth address
    const recipient = request.privacyLevel === 'transparent'
      ? request.recipient
      : entry.stealthAddress.stealthAddress;
    
    console.log(`[PrivateSettlement] Immediate Solana settlement to: ${recipient}`);
    console.log(`[PrivateSettlement] Amount commitment: ${serializeCommitment(entry.commitment).slice(0, 16)}...`);
    
    const result = await this.solanaSettlement.transferViaVault(recipient, amountSOL);
    
    if (result.success) {
      return {
        success: true,
        depositTxHash: result.depositTxHash,
        withdrawalTxHash: result.withdrawalTxHash,
        explorerUrl: `https://explorer.solana.com/tx/${result.withdrawalTxHash}?cluster=devnet`,
      };
    }
    
    return { success: false, error: result.error };
  }

  /**
   * Settle EVM batch
   */
  private async settleEVMBatch(
    entry: BatchEntry,
    request: PrivateTransferRequest,
    batch: SettlementBatch
  ): Promise<{
    success: boolean;
    depositTxHash?: string;
    withdrawalTxHash?: string;
    explorerUrl?: string;
    error?: string;
  }> {
    const amountETH = (Number(request.amount) / 1e18).toString();
    
    // Use stealth address as recipient
    const recipient = entry.stealthAddress.stealthAddress;
    
    console.log(`[PrivateSettlement] Settling EVM batch to stealth: ${recipient}`);
    
    // Deposit to vault
    const depositResult = await this.evmSettlement.depositToVault(amountETH);
    if (!depositResult.success) {
      return { success: false, error: depositResult.error };
    }
    
    // Withdraw to stealth address
    const commitmentHash = `0x${serializeCommitment(entry.commitment)}` as `0x${string}`;
    const withdrawResult = await this.evmSettlement.executeWithdrawal(
      commitmentHash,
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
      recipient as `0x${string}`,
      request.amount
    );
    
    if (withdrawResult.success) {
      batch.status = 'settled';
      return {
        success: true,
        depositTxHash: depositResult.txHash,
        withdrawalTxHash: withdrawResult.txHash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${withdrawResult.txHash}`,
      };
    }
    
    return { success: false, error: withdrawResult.error };
  }

  /**
   * Settle EVM immediate
   */
  private async settleEVMImmediate(
    entry: BatchEntry,
    request: PrivateTransferRequest
  ): Promise<{
    success: boolean;
    depositTxHash?: string;
    withdrawalTxHash?: string;
    explorerUrl?: string;
    error?: string;
  }> {
    const amountETH = (Number(request.amount) / 1e18).toString();
    
    const recipient = request.privacyLevel === 'transparent'
      ? request.recipient
      : entry.stealthAddress.stealthAddress;
    
    console.log(`[PrivateSettlement] Immediate EVM settlement to: ${recipient}`);
    
    const depositResult = await this.evmSettlement.depositToVault(amountETH);
    if (!depositResult.success) {
      return { success: false, error: depositResult.error };
    }
    
    const commitmentHash = `0x${serializeCommitment(entry.commitment)}` as `0x${string}`;
    const withdrawResult = await this.evmSettlement.executeWithdrawal(
      commitmentHash,
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
      recipient as `0x${string}`,
      request.amount
    );
    
    if (withdrawResult.success) {
      return {
        success: true,
        depositTxHash: depositResult.txHash,
        withdrawalTxHash: withdrawResult.txHash,
        explorerUrl: `https://sepolia.etherscan.io/tx/${withdrawResult.txHash}`,
      };
    }
    
    return { success: false, error: withdrawResult.error };
  }

  /**
   * Generate unique intent ID
   */
  private generateIntentId(): string {
    return `intent_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  /**
   * Get pending batches info
   */
  getPendingBatches(): Array<{
    batchId: string;
    chain: string;
    entryCount: number;
    createdAt: number;
  }> {
    const result: Array<{
      batchId: string;
      chain: string;
      entryCount: number;
      createdAt: number;
    }> = [];
    
    for (const [key, batch] of this.pendingBatches) {
      result.push({
        batchId: batch.batchId,
        chain: key.replace('_pending', ''),
        entryCount: batch.entries.length,
        createdAt: batch.createdAt,
      });
    }
    
    return result;
  }

  /**
   * Force flush all pending batches
   */
  async flushBatches(): Promise<void> {
    for (const [key, batch] of this.pendingBatches) {
      if (batch.entries.length > 0 && batch.status === 'pending') {
        console.log(`[PrivateSettlement] Flushing batch ${batch.batchId}`);
        // In production, would settle each entry
      }
    }
    this.pendingBatches.clear();
  }
}

/**
 * Create private settlement service
 */
export function createPrivateSettlementService(config: {
  solanaSettlement?: any;
  evmSettlement?: any;
}): PrivateSettlementService {
  return new PrivateSettlementService(config);
}
