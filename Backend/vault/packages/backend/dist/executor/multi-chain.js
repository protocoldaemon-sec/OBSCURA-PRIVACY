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
import { toHex } from '@obscura/crypto';
import { createHeliusClient, } from '../solana/helius.js';
import { createZKCompressionClient } from '../solana/zk-compression.js';
import { createArciumClient, } from '../solana/arcium/index.js';
/**
 * Multi-Chain Executor class
 *
 * Handles settlement across EVM and Solana chains with integrations:
 * - Helius: Priority fees, webhooks, enhanced APIs
 * - ZK Compression: Compressed settlement record storage
 * - Arcium: Confidential batch optimization
 */
export class MultiChainExecutor {
    chains = new Map();
    pendingSettlements = new Map();
    // Integration clients
    heliusClient = null;
    compressionClient = null;
    arciumClient = null;
    constructor(config) {
        for (const chain of config.chains) {
            this.chains.set(chain.chainId, chain);
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
     * Get Helius client for direct access
     */
    getHeliusClient() {
        return this.heliusClient;
    }
    /**
     * Get ZK Compression client for direct access
     */
    getCompressionClient() {
        return this.compressionClient;
    }
    /**
     * Get Arcium client for direct access
     */
    getArciumClient() {
        return this.arciumClient;
    }
    /**
     * Submit a batch for settlement
     */
    async submitBatch(batch) {
        const chainConfig = this.chains.get(batch.targetChain);
        if (!chainConfig) {
            return {
                success: false,
                error: `Chain ${batch.targetChain} not configured`
            };
        }
        if (chainConfig.type === 'evm') {
            return this.submitToEVM(batch, chainConfig);
        }
        else if (chainConfig.type === 'solana') {
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
    async submitToEVM(batch, config) {
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
     * Uses Helius for priority fees and ZK Compression for record storage
     */
    async submitToSolana(batch, config) {
        console.log(`[Solana] Submitting batch ${batch.batchId} to ${config.chainId}`);
        console.log(`[Solana] Program: ${config.contractAddress}`);
        console.log(`[Solana] Batch root: ${toHex(batch.batchRoot)}`);
        console.log(`[Solana] Intent count: ${batch.count}`);
        let priorityFee;
        let rpcUrl = config.rpcUrl;
        // Use Helius for enhanced RPC if available
        if (this.heliusClient && config.useHelius !== false) {
            rpcUrl = this.heliusClient.getRpcUrl();
            // Get priority fee estimate
            try {
                const feeEstimate = await this.heliusClient.getPriorityFeeEstimate([config.contractAddress], { priorityLevel: 'medium' });
                priorityFee = feeEstimate.priorityFeeEstimate;
                console.log(`[Solana] Using Helius priority fee: ${priorityFee}`);
            }
            catch (err) {
                console.warn('[Solana] Failed to get priority fee, using default');
            }
        }
        // In real implementation:
        // 1. Create connection with Helius RPC
        // 2. Build transaction with instructions
        // 3. Add priority fee instruction if available
        // 4. Sign and send (use sendSmartTransaction with Helius)
        // 5. Confirm
        // Simulated success
        const txHash = toHex(new Uint8Array(64).fill(2));
        // Record pending settlement
        const record = {
            batchId: batch.batchId,
            chain: config.chainId,
            txHash,
            blockNumber: 0,
            status: 'submitted',
            gasUsed: BigInt(priorityFee ?? 5000),
            settledAt: Date.now()
        };
        this.pendingSettlements.set(batch.batchId, record);
        // Compress settlement record if enabled
        let compressedRecord;
        if (this.compressionClient && config.useCompression !== false) {
            try {
                compressedRecord = await this.compressionClient.compressSettlementRecord(record);
                console.log(`[Solana] Settlement record compressed at index ${compressedRecord.leafIndex}`);
            }
            catch (err) {
                console.warn('[Solana] Failed to compress settlement record:', err);
            }
        }
        return {
            success: true,
            txHash,
            gasUsed: BigInt(priorityFee ?? 5000),
            priorityFee,
            compressedRecord,
        };
    }
    /**
     * Check settlement status
     */
    async checkSettlementStatus(batchId) {
        return this.pendingSettlements.get(batchId);
    }
    /**
     * Update settlement status (called after confirmation)
     */
    updateSettlementStatus(batchId, status, blockNumber) {
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
    getPendingSettlements() {
        return Array.from(this.pendingSettlements.values())
            .filter(r => r.status === 'pending' || r.status === 'submitted');
    }
    /**
     * Get chain config
     */
    getChainConfig(chainId) {
        return this.chains.get(chainId);
    }
    /**
     * Get supported chains
     */
    getSupportedChains() {
        return Array.from(this.chains.keys());
    }
    /**
     * Execute directly with a solver quote (bypasses batching)
     *
     * Used when a quote provides direct calldata for immediate execution
     */
    async executeDirectWithQuote(shielded, quote) {
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
        }
        else if (chainConfig.type === 'solana') {
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
    async executeQuoteOnEVM(_shielded, quote, config) {
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
    async executeQuoteOnSolana(_shielded, quote, config) {
        console.log(`[Solana] Direct quote execution on ${config.chainId}`);
        console.log(`[Solana] Quote expires at: ${new Date(quote.expiresAt).toISOString()}`);
        if (quote.expiresAt < Date.now()) {
            return {
                success: false,
                error: 'Quote has expired'
            };
        }
        let priorityFee;
        // Use Helius smart transaction if available
        if (this.heliusClient && config.useHelius !== false) {
            try {
                const feeEstimate = await this.heliusClient.getPriorityFeeEstimate([config.contractAddress], { priorityLevel: 'high' } // Higher priority for direct execution
                );
                priorityFee = feeEstimate.priorityFeeEstimate;
                console.log(`[Solana] Using Helius priority fee: ${priorityFee}`);
                // In real implementation, use sendSmartTransaction:
                // const txHash = await this.heliusClient.sendSmartTransaction(
                //   serializedTx,
                //   { skipPreflight: false, maxRetries: 3 }
                // );
            }
            catch (err) {
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
//# sourceMappingURL=multi-chain.js.map