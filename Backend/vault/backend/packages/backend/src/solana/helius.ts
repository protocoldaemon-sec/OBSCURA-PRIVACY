/**
 * Helius Integration
 * 
 * Enhanced Solana RPC provider with:
 * - Priority fee estimation
 * - Transaction webhooks
 * - DAS API for compressed NFTs
 * - Enhanced transaction APIs
 * - Orb block explorer URL generation
 */

/** Helius configuration */
export interface HeliusConfig {
  apiKey: string;
  cluster?: 'mainnet-beta' | 'devnet';
}

/** Solana cluster type */
export type SolanaCluster = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';

// ============ Orb Block Explorer URLs ============

/** Orb explorer base URLs */
export const ORB_EXPLORER_URLS = {
  'mainnet-beta': 'https://orb.helius.dev',
  'devnet': 'https://orb.helius.dev',
  'testnet': 'https://orb.helius.dev',
  'localnet': 'https://orb.helius.dev',
} as const;

/**
 * Generate Orb explorer URL for a transaction
 * 
 * @example
 * ```typescript
 * const url = getTransactionExplorerUrl(signature, 'devnet');
 * // https://orb.helius.dev/tx/5abc...?cluster=devnet
 * ```
 */
export function getTransactionExplorerUrl(
  signature: string,
  cluster: SolanaCluster = 'mainnet-beta'
): string {
  const baseUrl = ORB_EXPLORER_URLS[cluster];
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `${baseUrl}/tx/${signature}${clusterParam}`;
}

/**
 * Generate Orb explorer URL for an account/address
 */
export function getAccountExplorerUrl(
  address: string,
  cluster: SolanaCluster = 'mainnet-beta'
): string {
  const baseUrl = ORB_EXPLORER_URLS[cluster];
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `${baseUrl}/address/${address}${clusterParam}`;
}

/**
 * Generate Orb explorer URL for a block/slot
 */
export function getBlockExplorerUrl(
  slot: number,
  cluster: SolanaCluster = 'mainnet-beta'
): string {
  const baseUrl = ORB_EXPLORER_URLS[cluster];
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `${baseUrl}/block/${slot}${clusterParam}`;
}

/**
 * Generate Orb explorer URL for a program
 */
export function getProgramExplorerUrl(
  programId: string,
  cluster: SolanaCluster = 'mainnet-beta'
): string {
  const baseUrl = ORB_EXPLORER_URLS[cluster];
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `${baseUrl}/address/${programId}${clusterParam}`;
}

/**
 * Generate Orb explorer URL for a token
 */
export function getTokenExplorerUrl(
  mintAddress: string,
  cluster: SolanaCluster = 'mainnet-beta'
): string {
  const baseUrl = ORB_EXPLORER_URLS[cluster];
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
  return `${baseUrl}/token/${mintAddress}${clusterParam}`;
}

/**
 * Explorer URL generator with all entity types
 */
export const orbExplorer = {
  transaction: getTransactionExplorerUrl,
  tx: getTransactionExplorerUrl,
  account: getAccountExplorerUrl,
  address: getAccountExplorerUrl,
  block: getBlockExplorerUrl,
  slot: getBlockExplorerUrl,
  program: getProgramExplorerUrl,
  token: getTokenExplorerUrl,
  
  /**
   * Generate URL for Arcium program on devnet
   */
  arciumProgram: (cluster: SolanaCluster = 'devnet') => 
    getProgramExplorerUrl('arcaborPMqYhZbLqPKPRXpBKyCMgH8kApNoxp4cLKg', cluster),
};

// ============ Priority Fee Types ============

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
export type WebhookType = 
  | 'enhanced'
  | 'raw'
  | 'discord'
  | 'enhancedDevnet'
  | 'rawDevnet';

/** Transaction type for webhooks */
export type TransactionType =
  | 'TRANSFER'
  | 'SWAP'
  | 'NFT_SALE'
  | 'NFT_MINT'
  | 'ANY';

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
export class HeliusClient {
  private apiKey: string;
  private cluster: SolanaCluster;
  private baseUrl: string;
  private rpcUrl: string;

  constructor(config: HeliusConfig) {
    this.apiKey = config.apiKey;
    this.cluster = config.cluster ?? 'mainnet-beta';
    this.baseUrl = `https://api.helius.xyz/v0`;
    this.rpcUrl = `https://${this.cluster}.helius-rpc.com/?api-key=${this.apiKey}`;
  }

  /**
   * Get the RPC URL for Solana connection
   */
  getRpcUrl(): string {
    return this.rpcUrl;
  }

  /**
   * Get the current cluster
   */
  getCluster(): SolanaCluster {
    return this.cluster;
  }

  // ============ Orb Explorer URL Methods ============

  /**
   * Get Orb explorer URL for a transaction
   */
  getTransactionUrl(signature: string): string {
    return getTransactionExplorerUrl(signature, this.cluster);
  }

  /**
   * Get Orb explorer URL for an account
   */
  getAccountUrl(address: string): string {
    return getAccountExplorerUrl(address, this.cluster);
  }

  /**
   * Get Orb explorer URL for a block
   */
  getBlockUrl(slot: number): string {
    return getBlockExplorerUrl(slot, this.cluster);
  }

  /**
   * Get Orb explorer URL for a program
   */
  getProgramUrl(programId: string): string {
    return getProgramExplorerUrl(programId, this.cluster);
  }

  /**
   * Get Orb explorer URL for a token
   */
  getTokenUrl(mintAddress: string): string {
    return getTokenExplorerUrl(mintAddress, this.cluster);
  }

  /**
   * Log transaction with explorer link (useful for debugging)
   */
  logTransaction(signature: string, label?: string): void {
    const url = this.getTransactionUrl(signature);
    const prefix = label ? `[${label}] ` : '';
    console.log(`${prefix}Transaction: ${signature}`);
    console.log(`${prefix}Explorer: ${url}`);
  }

  // ============ Priority Fee Methods ============

  /**
   * Get priority fee estimate for a transaction
   */
  async getPriorityFeeEstimate(
    accountKeys: string[],
    options?: {
      priorityLevel?: PriorityLevel;
      includeAllPriorityFeeLevels?: boolean;
      lookbackSlots?: number;
    }
  ): Promise<PriorityFeeEstimate> {
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

    const data = await response.json() as { error?: { message: string }; result: PriorityFeeEstimate };
    if (data.error) {
      throw new Error(`Helius RPC error: ${data.error.message}`);
    }
    return data.result!;
  }

  /**
   * Send a smart transaction with automatic priority fees
   */
  async sendSmartTransaction(
    serializedTransaction: string,
    options?: {
      skipPreflight?: boolean;
      maxRetries?: number;
      lastValidBlockHeightBuffer?: number;
    }
  ): Promise<string> {
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

    const data = await response.json() as { error?: { message: string }; result: string };
    if (data.error) {
      throw new Error(`Helius send error: ${data.error.message}`);
    }
    return data.result!;
  }

  /**
   * Create a webhook for transaction monitoring
   */
  async createWebhook(config: WebhookConfig): Promise<Webhook> {
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
    return response.json() as Promise<Webhook>;
  }

  /**
   * Get all webhooks
   */
  async getWebhooks(): Promise<Webhook[]> {
    const response = await fetch(`${this.baseUrl}/webhooks?api-key=${this.apiKey}`);
    if (!response.ok) {
      throw new Error(`Failed to get webhooks: ${response.statusText}`);
    }
    return response.json() as Promise<Webhook[]>;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/webhooks/${webhookId}?api-key=${this.apiKey}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      throw new Error(`Failed to delete webhook: ${response.statusText}`);
    }
  }

  /**
   * Get parsed transaction history for an address
   */
  async getTransactionHistory(
    address: string,
    options?: {
      before?: string;
      until?: string;
      limit?: number;
      type?: TransactionType;
    }
  ): Promise<any[]> {
    const params = new URLSearchParams({
      'api-key': this.apiKey,
    });
    if (options?.before) params.set('before', options.before);
    if (options?.until) params.set('until', options.until);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.type) params.set('type', options.type);

    const response = await fetch(
      `${this.baseUrl}/addresses/${address}/transactions?${params}`
    );
    if (!response.ok) {
      throw new Error(`Failed to get transaction history: ${response.statusText}`);
    }
    return response.json() as Promise<any[]>;
  }

  /**
   * Parse a transaction by signature
   */
  async parseTransaction(signature: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/transactions/?api-key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: [signature] }),
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to parse transaction: ${response.statusText}`);
    }
    const result = await response.json() as any[];
    return result[0];
  }
}

/**
 * Create Helius client from environment
 */
export function createHeliusClient(): HeliusClient | null {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    console.warn('HELIUS_API_KEY not set, Helius features disabled');
    return null;
  }

  const cluster = process.env.SOLANA_CLUSTER === 'devnet' ? 'devnet' : 'mainnet-beta';
  return new HeliusClient({ apiKey, cluster });
}
