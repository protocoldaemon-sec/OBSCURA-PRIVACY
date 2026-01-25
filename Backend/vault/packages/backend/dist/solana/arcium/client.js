/**
 * Arcium Client
 *
 * Unified client for Arcium integration combining:
 * - cSPL: Confidential token operations
 * - MXE: Multi-party computation
 * - Settlement: Confidential intent settlement
 */
import { createCSPLClient } from './cspl.js';
import { createMXEClient, MPCComputationType } from './mxe.js';
/**
 * Arcium Client - Main entry point for Arcium integration
 */
export class ArciumClient {
    config;
    cspl;
    mxe;
    connected = false;
    constructor(config) {
        this.config = config;
        this.cspl = createCSPLClient(config);
        this.mxe = createMXEClient(config);
    }
    /**
     * Initialize and connect to Arcium network
     */
    async connect() {
        await this.mxe.connect();
        this.connected = true;
        console.log(`[Arcium] Connected to cluster ${this.config.clusterId}`);
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Get cSPL client for direct token operations
     */
    getCSPLClient() {
        return this.cspl;
    }
    /**
     * Get MXE client for direct MPC operations
     */
    getMXEClient() {
        return this.mxe;
    }
    // ============ Confidential Intent Operations ============
    /**
     * Encrypt an intent for confidential processing
     */
    async encryptIntent(intent) {
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
    async runSolverAuction(quotes) {
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
    async encryptQuote(quote) {
        this.ensureConnected();
        const encryptedOutput = await this.mxe.encryptAmount(quote.outputAmount);
        const encryptedFee = await this.mxe.encryptAmount(quote.fee);
        // Generate commitment
        const commitment = await this.generateCommitment(quote.outputAmount, quote.fee);
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
    async optimizeBatch(intents) {
        this.ensureConnected();
        // Encrypt intent data for MPC
        const encryptedIntents = await Promise.all(intents.map(async (intent) => ({
            intentId: intent.id,
            encryptedData: await this.mxe.encrypt(intent.shielded.encryptedIntent),
        })));
        return this.mxe.optimizeBatch(encryptedIntents);
    }
    // ============ Confidential Token Operations ============
    /**
     * Create confidential token account
     */
    async createConfidentialAccount(mint, owner) {
        return this.cspl.initializeAccount(mint, owner);
    }
    /**
     * Deposit tokens to confidential account
     */
    async depositToConfidential(account, amount, sourceTokenAccount) {
        return this.cspl.deposit(account, amount, sourceTokenAccount);
    }
    /**
     * Transfer tokens confidentially
     */
    async confidentialTransfer(source, destination, amount) {
        // Get source account to access encrypted balance
        const sourceAccount = await this.cspl.getAccount(source);
        if (!sourceAccount) {
            throw new Error('Source account not found');
        }
        // Encrypt the transfer amount for both parties
        const encryptedAmount = await this.mxe.encryptAmount(amount);
        // Generate proofs
        const rangeProof = await this.cspl.generateRangeProof(source, amount, sourceAccount.encryptedBalance);
        // For equality proof, we need to re-encrypt for destination
        const destEncrypted = await this.mxe.encryptAmount(amount);
        const equalityProof = await this.cspl.generateEqualityProof(encryptedAmount, destEncrypted);
        // Build transfer
        const transfer = await this.cspl.transfer(source, destination, encryptedAmount, { rangeProof, equalityProof });
        return {
            instruction: await this.cspl.buildTransferInstruction(transfer),
        };
    }
    /**
     * Create viewing key for selective disclosure
     */
    async createViewingKey(account, viewerPubKey, permissions, expiresAt) {
        return this.cspl.createViewingKey(account, viewerPubKey, permissions, expiresAt);
    }
    /**
     * Decrypt balance using viewing key
     */
    async decryptBalance(account, viewingKey) {
        return this.cspl.decryptBalance(account, viewingKey);
    }
    // ============ Settlement Operations ============
    /**
     * Settle a batch using confidential computation
     *
     * Uses MPC to verify batch validity without revealing
     * individual intent details
     */
    async settleConfidentialBatch(batch, encryptedIntents) {
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
    ensureConnected() {
        if (!this.connected) {
            throw new Error('Not connected to Arcium network. Call connect() first.');
        }
    }
    async generateCommitment(outputAmount, fee) {
        const encoder = new TextEncoder();
        const data = encoder.encode(`${outputAmount}:${fee}:${Date.now()}`);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return new Uint8Array(hash);
    }
}
/**
 * Create Arcium client from environment variables
 */
export function createArciumClient() {
    const mxeEndpoint = process.env.ARCIUM_MXE_ENDPOINT;
    const clusterId = process.env.ARCIUM_CLUSTER_ID;
    if (!mxeEndpoint || !clusterId) {
        console.warn('[Arcium] ARCIUM_MXE_ENDPOINT or ARCIUM_CLUSTER_ID not set');
        return null;
    }
    return new ArciumClient({
        rpcUrl: process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com',
        mxeEndpoint,
        clusterId,
        appId: process.env.ARCIUM_APP_ID ?? 'winternitz-sip',
        solanaCluster: process.env.SOLANA_CLUSTER ?? 'devnet',
    });
}
/**
 * Create Arcium client with explicit config
 */
export function createArciumClientWithConfig(config) {
    return new ArciumClient(config);
}
//# sourceMappingURL=client.js.map