/**
 * Light Protocol Client
 *
 * Unified client for ZK Compression on Solana:
 * - Compressed account management
 * - Compressed token operations
 * - Settlement record storage
 * - Intent commitment storage
 */
import { createPhotonClient } from './photon.js';
import { createCompressedPDAManager } from './compressed-pda.js';
/** Settlement program ID for compressed storage */
const SIP_SETTLEMENT_PROGRAM_ID = 'SIPsettlement111111111111111111111111111111';
/**
 * Light Protocol Client
 *
 * Main entry point for ZK Compression integration
 */
export class LightProtocolClient {
    config;
    photon;
    pdaManager;
    connected = false;
    stateTree = null;
    constructor(config) {
        this.config = config;
        this.photon = createPhotonClient(config);
        this.pdaManager = createCompressedPDAManager(config, this.photon);
    }
    /**
     * Initialize and connect to Light Protocol
     */
    async connect(stateTreePubkey) {
        // Check indexer health
        const health = await this.photon.getHealth();
        if (health.status === 'unhealthy') {
            throw new Error('Photon indexer is unhealthy');
        }
        // Get or use provided state tree
        if (stateTreePubkey) {
            this.stateTree = await this.photon.getStateTree(stateTreePubkey);
            if (!this.stateTree) {
                throw new Error(`State tree not found: ${stateTreePubkey}`);
            }
        }
        this.connected = true;
        console.log(`[Light] Connected to Photon indexer (lag: ${health.lag} slots)`);
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Get Photon client for direct queries
     */
    getPhotonClient() {
        return this.photon;
    }
    /**
     * Get PDA manager for direct operations
     */
    getPDAManager() {
        return this.pdaManager;
    }
    // ============ Settlement Record Storage ============
    /**
     * Store a settlement record in compressed storage
     */
    async storeSettlementRecord(record) {
        this.ensureConnected();
        // Encode settlement data
        const data = this.encodeSettlementData({
            batchId: record.batchId,
            batchRoot: new Uint8Array(32), // Would come from actual batch
            chain: record.chain,
            txHash: record.txHash,
            timestamp: record.settledAt,
            intentCount: 0, // Would come from actual batch
            status: record.status === 'finalized' ? 'finalized' :
                record.status === 'confirmed' ? 'confirmed' : 'pending',
        });
        // Create compressed account with PDA
        const seeds = [
            new TextEncoder().encode('settlement'),
            new TextEncoder().encode(record.batchId),
        ];
        const { instruction, accountHash } = await this.pdaManager.createCompressedAccount(SIP_SETTLEMENT_PROGRAM_ID, data, 0n, seeds);
        // In production, submit transaction to Solana
        // For now, return simulated result
        return {
            hash: accountHash,
            treeAddress: this.stateTree?.pubkey ?? 'unknown',
            leafIndex: 0,
            signature: `sim_${record.batchId}_${Date.now()}`,
        };
    }
    /**
     * Get settlement record by batch ID
     */
    async getSettlementRecord(batchId) {
        this.ensureConnected();
        // Derive PDA for the settlement record
        const seeds = [
            new TextEncoder().encode('settlement'),
            new TextEncoder().encode(batchId),
        ];
        const { address } = await this.pdaManager.deriveCompressedPDA(seeds, SIP_SETTLEMENT_PROGRAM_ID);
        // Query by address hash
        const account = await this.photon.getCompressedAccount(address);
        if (!account) {
            return null;
        }
        return this.decodeSettlementData(account.data);
    }
    /**
     * Update settlement record status
     */
    async updateSettlementStatus(batchId, status) {
        this.ensureConnected();
        // Get existing record with proof
        const seeds = [
            new TextEncoder().encode('settlement'),
            new TextEncoder().encode(batchId),
        ];
        const { address } = await this.pdaManager.deriveCompressedPDA(seeds, SIP_SETTLEMENT_PROGRAM_ID);
        const accountWithProof = await this.photon.getCompressedAccountProof(address);
        if (!accountWithProof) {
            throw new Error(`Settlement record not found: ${batchId}`);
        }
        // Decode, update, and re-encode
        const data = this.decodeSettlementData(accountWithProof.account.data);
        data.status = status;
        const newData = this.encodeSettlementData(data);
        // Update compressed account
        const { instruction } = await this.pdaManager.updateCompressedAccount(accountWithProof, newData);
        // In production, submit transaction
        return { signature: `sim_update_${batchId}_${Date.now()}` };
    }
    // ============ Intent Commitment Storage ============
    /**
     * Store an intent commitment
     */
    async storeIntentCommitment(intentId, commitment, expiresAt, batchId) {
        this.ensureConnected();
        const data = this.encodeIntentCommitment({
            intentId,
            commitment,
            batchId,
            createdAt: Date.now(),
            expiresAt,
            status: 'pending',
        });
        const seeds = [
            new TextEncoder().encode('intent'),
            new TextEncoder().encode(intentId),
        ];
        const { instruction, accountHash } = await this.pdaManager.createCompressedAccount(SIP_SETTLEMENT_PROGRAM_ID, data, 0n, seeds);
        return {
            hash: accountHash,
            treeAddress: this.stateTree?.pubkey ?? 'unknown',
            leafIndex: 0,
            signature: `sim_intent_${intentId}_${Date.now()}`,
        };
    }
    /**
     * Get intent commitment by ID
     */
    async getIntentCommitment(intentId) {
        this.ensureConnected();
        const seeds = [
            new TextEncoder().encode('intent'),
            new TextEncoder().encode(intentId),
        ];
        const { address } = await this.pdaManager.deriveCompressedPDA(seeds, SIP_SETTLEMENT_PROGRAM_ID);
        const account = await this.photon.getCompressedAccount(address);
        if (!account) {
            return null;
        }
        return this.decodeIntentCommitment(account.data);
    }
    /**
     * Mark intent as settled
     */
    async markIntentSettled(intentId, batchId) {
        this.ensureConnected();
        const seeds = [
            new TextEncoder().encode('intent'),
            new TextEncoder().encode(intentId),
        ];
        const { address } = await this.pdaManager.deriveCompressedPDA(seeds, SIP_SETTLEMENT_PROGRAM_ID);
        const accountWithProof = await this.photon.getCompressedAccountProof(address);
        if (!accountWithProof) {
            throw new Error(`Intent commitment not found: ${intentId}`);
        }
        const data = this.decodeIntentCommitment(accountWithProof.account.data);
        data.status = 'settled';
        data.batchId = batchId;
        const newData = this.encodeIntentCommitment(data);
        await this.pdaManager.updateCompressedAccount(accountWithProof, newData);
        return { signature: `sim_settle_${intentId}_${Date.now()}` };
    }
    // ============ Audit Record Storage (Compliant Mode) ============
    /**
     * Store an audit record for compliant mode
     */
    async storeAuditRecord(entry) {
        this.ensureConnected();
        const recordId = Buffer.from(entry.intentCommitment).toString('hex').slice(0, 16);
        const data = this.encodeAuditRecord({
            recordId,
            intentCommitment: entry.intentCommitment,
            encryptedData: entry.encryptedData,
            auditorPubKey: entry.auditorPubKey,
            timestamp: entry.timestamp,
            chain: entry.chain,
        });
        const seeds = [
            new TextEncoder().encode('audit'),
            entry.intentCommitment.slice(0, 16),
        ];
        const { instruction, accountHash } = await this.pdaManager.createCompressedAccount(SIP_SETTLEMENT_PROGRAM_ID, data, 0n, seeds);
        return {
            hash: accountHash,
            treeAddress: this.stateTree?.pubkey ?? 'unknown',
            leafIndex: 0,
            signature: `sim_audit_${recordId}_${Date.now()}`,
        };
    }
    /**
     * Get audit records for an intent
     */
    async getAuditRecord(intentCommitment) {
        this.ensureConnected();
        const seeds = [
            new TextEncoder().encode('audit'),
            intentCommitment.slice(0, 16),
        ];
        const { address } = await this.pdaManager.deriveCompressedPDA(seeds, SIP_SETTLEMENT_PROGRAM_ID);
        const account = await this.photon.getCompressedAccount(address);
        if (!account) {
            return null;
        }
        return this.decodeAuditRecord(account.data);
    }
    // ============ Compressed Token Operations ============
    /**
     * Get compressed token balance
     */
    async getCompressedTokenBalance(owner, mint) {
        const accounts = await this.photon.getCompressedTokenAccountsByOwner(owner, mint);
        return accounts.items.reduce((sum, acc) => sum + acc.amount, 0n);
    }
    /**
     * Get all compressed token accounts for owner
     */
    async getCompressedTokenAccounts(owner, mint) {
        const response = await this.photon.getCompressedTokenAccountsByOwner(owner, mint);
        return response.items;
    }
    // ============ Batch Operations ============
    /**
     * Store multiple settlement records in batch
     */
    async storeSettlementRecordsBatch(records) {
        const results = [];
        for (const record of records) {
            const result = await this.storeSettlementRecord(record);
            results.push(result);
        }
        return results;
    }
    /**
     * Store multiple intent commitments in batch
     */
    async storeIntentCommitmentsBatch(intents) {
        const results = [];
        for (const intent of intents) {
            const result = await this.storeIntentCommitment(intent.intentId, intent.commitment, intent.expiresAt);
            results.push(result);
        }
        return results;
    }
    // ============ Private Methods ============
    ensureConnected() {
        if (!this.connected) {
            throw new Error('Not connected to Light Protocol. Call connect() first.');
        }
    }
    encodeSettlementData(data) {
        const encoder = new TextEncoder();
        return encoder.encode(JSON.stringify({
            ...data,
            batchRoot: Buffer.from(data.batchRoot).toString('base64'),
        }));
    }
    decodeSettlementData(data) {
        const decoder = new TextDecoder();
        const parsed = JSON.parse(decoder.decode(data));
        return {
            ...parsed,
            batchRoot: new Uint8Array(Buffer.from(parsed.batchRoot, 'base64')),
        };
    }
    encodeIntentCommitment(data) {
        const encoder = new TextEncoder();
        return encoder.encode(JSON.stringify({
            ...data,
            commitment: Buffer.from(data.commitment).toString('base64'),
        }));
    }
    decodeIntentCommitment(data) {
        const decoder = new TextDecoder();
        const parsed = JSON.parse(decoder.decode(data));
        return {
            ...parsed,
            commitment: new Uint8Array(Buffer.from(parsed.commitment, 'base64')),
        };
    }
    encodeAuditRecord(data) {
        const encoder = new TextEncoder();
        return encoder.encode(JSON.stringify({
            ...data,
            intentCommitment: Buffer.from(data.intentCommitment).toString('base64'),
            encryptedData: Buffer.from(data.encryptedData).toString('base64'),
            auditorPubKey: Buffer.from(data.auditorPubKey).toString('base64'),
        }));
    }
    decodeAuditRecord(data) {
        const decoder = new TextDecoder();
        const parsed = JSON.parse(decoder.decode(data));
        return {
            ...parsed,
            intentCommitment: new Uint8Array(Buffer.from(parsed.intentCommitment, 'base64')),
            encryptedData: new Uint8Array(Buffer.from(parsed.encryptedData, 'base64')),
            auditorPubKey: new Uint8Array(Buffer.from(parsed.auditorPubKey, 'base64')),
        };
    }
}
/**
 * Create Light Protocol client from environment
 */
export function createLightProtocolClient() {
    const rpcUrl = process.env.SOLANA_RPC_URL;
    const photonUrl = process.env.PHOTON_URL;
    if (!rpcUrl || !photonUrl) {
        console.warn('[Light] SOLANA_RPC_URL or PHOTON_URL not set');
        return null;
    }
    return new LightProtocolClient({
        rpcUrl,
        photonUrl,
        proverUrl: process.env.LIGHT_PROVER_URL,
        cluster: process.env.SOLANA_CLUSTER ?? 'devnet',
    });
}
/**
 * Create Light Protocol client with explicit config
 */
export function createLightProtocolClientWithConfig(config) {
    return new LightProtocolClient(config);
}
//# sourceMappingURL=client.js.map