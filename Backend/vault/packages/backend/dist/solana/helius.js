/**
 * Helius Integration
 *
 * Enhanced Solana RPC provider with:
 * - Priority fee estimation
 * - Transaction webhooks
 * - DAS API for compressed NFTs
 * - Enhanced transaction APIs
 */
/**
 * Helius client for enhanced Solana RPC
 */
export class HeliusClient {
    apiKey;
    cluster;
    baseUrl;
    rpcUrl;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.cluster = config.cluster ?? 'mainnet-beta';
        this.baseUrl = `https://api.helius.xyz/v0`;
        this.rpcUrl = `https://${this.cluster}.helius-rpc.com/?api-key=${this.apiKey}`;
    }
    /**
     * Get the RPC URL for Solana connection
     */
    getRpcUrl() {
        return this.rpcUrl;
    }
    /**
     * Get priority fee estimate for a transaction
     */
    async getPriorityFeeEstimate(accountKeys, options) {
        const response = await fetch(this.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'priority-fee',
                method: 'getPriorityFeeEstimate',
                params: [{
                        accountKeys,
                        options: {
                            priorityLevel: options?.priorityLevel,
                            includeAllPriorityFeeLevels: options?.includeAllPriorityFeeLevels ?? true,
                            lookbackSlots: options?.lookbackSlots ?? 150,
                        },
                    }],
            }),
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(`Helius RPC error: ${data.error.message}`);
        }
        return data.result;
    }
    /**
     * Send a smart transaction with automatic priority fees
     */
    async sendSmartTransaction(serializedTransaction, options) {
        const response = await fetch(this.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'send-smart-tx',
                method: 'sendSmartTransaction',
                params: [{
                        serializedTransaction,
                        sendOptions: {
                            skipPreflight: options?.skipPreflight ?? false,
                            maxRetries: options?.maxRetries ?? 3,
                        },
                        lastValidBlockHeightBuffer: options?.lastValidBlockHeightBuffer ?? 150,
                    }],
            }),
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(`Helius send error: ${data.error.message}`);
        }
        return data.result;
    }
    /**
     * Create a webhook for transaction monitoring
     */
    async createWebhook(config) {
        const response = await fetch(`${this.baseUrl}/webhooks?api-key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                webhookURL: config.webhookURL,
                transactionTypes: config.transactionTypes,
                accountAddresses: config.accountAddresses,
                webhookType: config.webhookType ?? 'enhanced',
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to create webhook: ${response.statusText}`);
        }
        return response.json();
    }
    /**
     * Get all webhooks
     */
    async getWebhooks() {
        const response = await fetch(`${this.baseUrl}/webhooks?api-key=${this.apiKey}`);
        if (!response.ok) {
            throw new Error(`Failed to get webhooks: ${response.statusText}`);
        }
        return response.json();
    }
    /**
     * Delete a webhook
     */
    async deleteWebhook(webhookId) {
        const response = await fetch(`${this.baseUrl}/webhooks/${webhookId}?api-key=${this.apiKey}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`Failed to delete webhook: ${response.statusText}`);
        }
    }
    /**
     * Get parsed transaction history for an address
     */
    async getTransactionHistory(address, options) {
        const params = new URLSearchParams({
            'api-key': this.apiKey,
        });
        if (options?.before)
            params.set('before', options.before);
        if (options?.until)
            params.set('until', options.until);
        if (options?.limit)
            params.set('limit', options.limit.toString());
        if (options?.type)
            params.set('type', options.type);
        const response = await fetch(`${this.baseUrl}/addresses/${address}/transactions?${params}`);
        if (!response.ok) {
            throw new Error(`Failed to get transaction history: ${response.statusText}`);
        }
        return response.json();
    }
    /**
     * Parse a transaction by signature
     */
    async parseTransaction(signature) {
        const response = await fetch(`${this.baseUrl}/transactions/?api-key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions: [signature] }),
        });
        if (!response.ok) {
            throw new Error(`Failed to parse transaction: ${response.statusText}`);
        }
        const result = await response.json();
        return result[0];
    }
}
/**
 * Create Helius client from environment
 */
export function createHeliusClient() {
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) {
        console.warn('HELIUS_API_KEY not set, Helius features disabled');
        return null;
    }
    const cluster = process.env.SOLANA_CLUSTER === 'devnet' ? 'devnet' : 'mainnet-beta';
    return new HeliusClient({ apiKey, cluster });
}
//# sourceMappingURL=helius.js.map