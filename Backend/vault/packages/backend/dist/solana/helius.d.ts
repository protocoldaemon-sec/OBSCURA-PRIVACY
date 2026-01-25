/**
 * Helius Integration
 *
 * Enhanced Solana RPC provider with:
 * - Priority fee estimation
 * - Transaction webhooks
 * - DAS API for compressed NFTs
 * - Enhanced transaction APIs
 */
/** Helius configuration */
export interface HeliusConfig {
    apiKey: string;
    cluster?: 'mainnet-beta' | 'devnet';
}
/** Priority fee levels */
export type PriorityLevel = 'min' | 'low' | 'medium' | 'high' | 'veryHigh' | 'unsafeMax';
/** Priority fee estimate */
export interface PriorityFeeEstimate {
    priorityFeeEstimate: number;
    priorityFeeLevels: {
        min: number;
        low: number;
        medium: number;
        high: number;
        veryHigh: number;
        unsafeMax: number;
    };
}
/** Webhook event types */
export type WebhookType = 'enhanced' | 'raw' | 'discord' | 'enhancedDevnet' | 'rawDevnet';
/** Transaction type for webhooks */
export type TransactionType = 'TRANSFER' | 'SWAP' | 'NFT_SALE' | 'NFT_MINT' | 'ANY';
/** Webhook configuration */
export interface WebhookConfig {
    webhookURL: string;
    transactionTypes: TransactionType[];
    accountAddresses: string[];
    webhookType?: WebhookType;
}
/** Webhook response */
export interface Webhook {
    webhookID: string;
    wallet: string;
    webhookURL: string;
    transactionTypes: TransactionType[];
    accountAddresses: string[];
    webhookType: WebhookType;
}
/**
 * Helius client for enhanced Solana RPC
 */
export declare class HeliusClient {
    private apiKey;
    private cluster;
    private baseUrl;
    private rpcUrl;
    constructor(config: HeliusConfig);
    /**
     * Get the RPC URL for Solana connection
     */
    getRpcUrl(): string;
    /**
     * Get priority fee estimate for a transaction
     */
    getPriorityFeeEstimate(accountKeys: string[], options?: {
        priorityLevel?: PriorityLevel;
        includeAllPriorityFeeLevels?: boolean;
        lookbackSlots?: number;
    }): Promise<PriorityFeeEstimate>;
    /**
     * Send a smart transaction with automatic priority fees
     */
    sendSmartTransaction(serializedTransaction: string, options?: {
        skipPreflight?: boolean;
        maxRetries?: number;
        lastValidBlockHeightBuffer?: number;
    }): Promise<string>;
    /**
     * Create a webhook for transaction monitoring
     */
    createWebhook(config: WebhookConfig): Promise<Webhook>;
    /**
     * Get all webhooks
     */
    getWebhooks(): Promise<Webhook[]>;
    /**
     * Delete a webhook
     */
    deleteWebhook(webhookId: string): Promise<void>;
    /**
     * Get parsed transaction history for an address
     */
    getTransactionHistory(address: string, options?: {
        before?: string;
        until?: string;
        limit?: number;
        type?: TransactionType;
    }): Promise<any[]>;
    /**
     * Parse a transaction by signature
     */
    parseTransaction(signature: string): Promise<any>;
}
/**
 * Create Helius client from environment
 */
export declare function createHeliusClient(): HeliusClient | null;
//# sourceMappingURL=helius.d.ts.map