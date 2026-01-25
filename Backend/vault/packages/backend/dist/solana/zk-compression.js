/**
 * ZK Compression Integration
 *
 * Compressed account storage for Solana:
 * - ~1000x cheaper storage costs
 * - Ideal for settlement records and audit trails
 * - Uses state compression with concurrent Merkle trees
 */
/**
 * ZK Compression client for compressed account storage
 *
 * Uses Light Protocol's ZK Compression for efficient on-chain storage
 */
export class ZKCompressionClient {
    rpcUrl;
    compressionApiUrl;
    constructor(config) {
        this.rpcUrl = config.rpcUrl;
        this.compressionApiUrl = config.compressionApiUrl ??
            'https://zk-compression-devnet.helius-rpc.com';
    }
    /**
     * Compress a settlement record for on-chain storage
     */
    async compressSettlementRecord(record) {
        // Serialize the record to bytes
        const recordBytes = this.serializeSettlementRecord(record);
        // Hash the record data
        const dataHash = await this.hashData(recordBytes);
        // Create compressed account via RPC
        const response = await fetch(this.compressionApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'compress-record',
                method: 'createCompressedAccount',
                params: [{
                        data: Buffer.from(recordBytes).toString('base64'),
                        owner: 'SIPSettlement111111111111111111111111111111',
                    }],
            }),
        });
        const result = await response.json();
        if (result.error) {
            throw new Error(`Compression failed: ${result.error.message}`);
        }
        return {
            dataHash,
            treeAddress: result.result.treeAddress,
            leafIndex: result.result.leafIndex,
            slot: result.result.slot,
            seq: result.result.seq,
        };
    }
    /**
     * Compress multiple settlement records in a batch
     */
    async compressBatch(records) {
        const results = [];
        // Batch compression for efficiency
        const batchData = records.map(r => ({
            data: Buffer.from(this.serializeSettlementRecord(r)).toString('base64'),
            owner: 'SIPSettlement111111111111111111111111111111',
        }));
        const response = await fetch(this.compressionApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'compress-batch',
                method: 'createCompressedAccountBatch',
                params: [{ accounts: batchData }],
            }),
        });
        const result = await response.json();
        if (result.error) {
            throw new Error(`Batch compression failed: ${result.error.message}`);
        }
        for (let i = 0; i < records.length; i++) {
            const recordBytes = this.serializeSettlementRecord(records[i]);
            results.push({
                dataHash: await this.hashData(recordBytes),
                treeAddress: result.result.accounts[i].treeAddress,
                leafIndex: result.result.accounts[i].leafIndex,
                slot: result.result.accounts[i].slot,
                seq: result.result.accounts[i].seq,
            });
        }
        return results;
    }
    /**
     * Compress an audit entry for compliant mode
     */
    async compressAuditEntry(entry) {
        const entryBytes = this.serializeAuditEntry(entry);
        const dataHash = await this.hashData(entryBytes);
        const response = await fetch(this.compressionApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'compress-audit',
                method: 'createCompressedAccount',
                params: [{
                        data: Buffer.from(entryBytes).toString('base64'),
                        owner: 'SIPAudit1111111111111111111111111111111111',
                    }],
            }),
        });
        const result = await response.json();
        if (result.error) {
            throw new Error(`Audit compression failed: ${result.error.message}`);
        }
        return {
            dataHash,
            treeAddress: result.result.treeAddress,
            leafIndex: result.result.leafIndex,
            slot: result.result.slot,
            seq: result.result.seq,
        };
    }
    /**
     * Get proof for a compressed record
     */
    async getProof(treeAddress, leafIndex) {
        const response = await fetch(this.compressionApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'get-proof',
                method: 'getCompressedAccountProof',
                params: [{ treeAddress, leafIndex }],
            }),
        });
        const result = await response.json();
        if (result.error) {
            throw new Error(`Get proof failed: ${result.error.message}`);
        }
        return {
            root: new Uint8Array(Buffer.from(result.result.root, 'base64')),
            proof: result.result.proof.map((p) => new Uint8Array(Buffer.from(p, 'base64'))),
            leafIndex: result.result.leafIndex,
            leaf: new Uint8Array(Buffer.from(result.result.leaf, 'base64')),
        };
    }
    /**
     * Verify a compressed record exists
     */
    async verifyRecord(treeAddress, leafIndex, expectedHash) {
        try {
            const proof = await this.getProof(treeAddress, leafIndex);
            const leafHash = await this.hashData(proof.leaf);
            // Compare hashes
            if (leafHash.length !== expectedHash.length)
                return false;
            for (let i = 0; i < leafHash.length; i++) {
                if (leafHash[i] !== expectedHash[i])
                    return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get compression statistics
     */
    async getStats() {
        const response = await fetch(this.compressionApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'get-stats',
                method: 'getCompressionStats',
                params: [],
            }),
        });
        const result = await response.json();
        if (result.error) {
            // Return default stats if not available
            return {
                totalRecords: 0,
                compressedSize: 0,
                uncompressedSize: 0,
                savingsPercent: 0,
                treesUsed: 0,
            };
        }
        return result.result;
    }
    /**
     * Serialize settlement record to bytes
     */
    serializeSettlementRecord(record) {
        const encoder = new TextEncoder();
        const json = JSON.stringify({
            batchId: record.batchId,
            chain: record.chain,
            txHash: record.txHash,
            blockNumber: record.blockNumber,
            status: record.status,
            gasUsed: record.gasUsed.toString(),
            settledAt: record.settledAt,
        });
        return encoder.encode(json);
    }
    /**
     * Serialize audit entry to bytes
     */
    serializeAuditEntry(entry) {
        const encoder = new TextEncoder();
        const json = JSON.stringify({
            intentCommitment: Buffer.from(entry.intentCommitment).toString('hex'),
            encryptedData: Buffer.from(entry.encryptedData).toString('base64'),
            auditorPubKey: Buffer.from(entry.auditorPubKey).toString('hex'),
            timestamp: entry.timestamp,
            chain: entry.chain,
        });
        return encoder.encode(json);
    }
    /**
     * Hash data using SHA-256
     */
    async hashData(data) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return new Uint8Array(hashBuffer);
    }
}
/**
 * Create ZK Compression client from environment
 */
export function createZKCompressionClient() {
    const rpcUrl = process.env.SOLANA_RPC_URL || process.env.HELIUS_RPC_URL;
    if (!rpcUrl) {
        console.warn('SOLANA_RPC_URL not set, ZK Compression disabled');
        return null;
    }
    const compressionApiUrl = process.env.ZK_COMPRESSION_API_URL;
    return new ZKCompressionClient({ rpcUrl, compressionApiUrl });
}
//# sourceMappingURL=zk-compression.js.map