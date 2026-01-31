import { config } from '../config';
import {
  ObscuraError,
  categorizeError,
  retryWithBackoff,
  CircuitBreaker,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
} from '../utils/errors';

/**
 * Obscura-LLMS Backend Client
 * 
 * This client integrates with the existing Obscura-LLMS backend for:
 * - Balance tracking via Arcium cSPL
 * - Settlement via relayer network
 * - Privacy status monitoring
 * - Relayer statistics
 * 
 * Features:
 * - Automatic retry with exponential backoff for transient failures
 * - Circuit breaker pattern to prevent cascading failures
 * - Comprehensive error categorization
 * - Timeout handling for long-running requests
 * - Detailed error logging (without sensitive data)
 * 
 * Base URL: https://obscura-api.daemonprotocol.com
 * 
 * Requirements: 36.3
 */

export interface DepositParams {
  network: 'solana-devnet' | 'sepolia';
  token: 'native' | 'usdc' | 'usdt';
  amount: string;
}

export interface DepositResponse {
  success: boolean;
  depositNote: {
    commitment: string;
    nullifier: string;
    nullifierHash: string;
    secret: string;
    amount: string;
    token: string;
    chainId: string;
    timestamp: number;
  };
  txHash: string;
  vaultAddress: string;
}

export interface WithdrawParams {
  commitment: string;
  nullifierHash: string;
  recipient: string;
  amount: string;
  token?: string; // Token to withdraw (e.g., 'native', 'USDC', 'USDT')
  chainId: 'solana-devnet' | 'sepolia';
}

export interface WithdrawResponse {
  success: boolean;
  requestId: string;
  txHash: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  zkCompressed: boolean;
  compressionSignature?: string;
}

export interface PrivacyStatusResponse {
  status: 'operational';
  arcium: {
    configured: boolean;
    clusterOffset: string;
    version: string;
    programId: string;
  };
  lightProtocol: {
    configured: boolean;
    zkCompression: boolean;
  };
}

export interface RelayerStatsResponse {
  totalDeposits: number;
  totalWithdrawals: number;
  totalVolume: string;
  pendingRequests: number;
  usedNullifiers: number;
}

export interface WithdrawalRequestResponse {
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  commitment: string;
  recipient: string;
  amount: string;
  chainId: string;
  txHash?: string;
  completedAt?: number;
}

export class ObscuraLLMSClient {
  private baseUrl: string;
  private retryConfig: RetryConfig;
  private circuitBreaker: CircuitBreaker;
  
  constructor(retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG) {
    this.baseUrl = config.obscuraLLMS.baseUrl;
    this.retryConfig = retryConfig;
    this.circuitBreaker = new CircuitBreaker(
      'ObscuraLLMS',
      DEFAULT_CIRCUIT_BREAKER_CONFIG
    );
  }
  
  /**
   * Make HTTP request with error handling, retry, and circuit breaker
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      return retryWithBackoff(
        async () => {
          try {
            const url = `${this.baseUrl}${endpoint}`;
            
            // Log request (without sensitive data)
            console.log(`[ObscuraLLMS] ${options.method || 'GET'} ${endpoint}`);
            
            const response = await fetch(url, {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                ...options.headers,
              },
            });
            
            // Handle non-OK responses
            if (!response.ok) {
              const errorText = await response.text();
              const error = categorizeError(
                new Error(errorText || response.statusText),
                response.status
              );
              
              // Log error (without sensitive data)
              console.error(
                `[ObscuraLLMS] Request failed: ${error.category} - ${error.message}`
              );
              
              throw error;
            }
            
            // Parse response
            const data = await response.json();
            
            // Log success (without sensitive data)
            console.log(`[ObscuraLLMS] Request successful: ${endpoint}`);
            
            return data as T;
          } catch (error) {
            // If error is already categorized, rethrow
            if (error instanceof ObscuraError) {
              throw error;
            }
            
            // Categorize and throw
            throw categorizeError(error);
          }
        },
        this.retryConfig
      );
    });
  }
  
  /**
   * Deposit funds for balance tracking via Arcium cSPL
   * 
   * Includes:
   * - Automatic retry for transient failures
   * - Circuit breaker protection
   * - Timeout handling (30s default)
   * - Comprehensive error categorization
   */
  async deposit(params: DepositParams): Promise<DepositResponse> {
    try {
      return await this.makeRequest<DepositResponse>('/api/v1/deposit', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch (error) {
      // Enhance error message for deposit operations
      if (error instanceof ObscuraError) {
        throw new ObscuraError(
          `Deposit failed: ${error.message}`,
          error.category,
          error.isRetryable,
          error.originalError
        );
      }
      throw error;
    }
  }
  
  /**
   * Withdraw funds via relayer network (settlement)
   * 
   * This handles:
   * - Atomic balance updates (Arcium cSPL)
   * - Relayer submission (direct transfer, NO vault PDA)
   * - ZK compression (Solana only, Light Protocol)
   * 
   * Includes:
   * - Automatic retry for transient failures
   * - Circuit breaker protection
   * - Timeout handling (30s default)
   * - Comprehensive error categorization
   * - Special handling for insufficient balance errors
   */
  async withdraw(params: WithdrawParams): Promise<WithdrawResponse> {
    try {
      return await this.makeRequest<WithdrawResponse>('/api/v1/withdraw', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch (error) {
      // Enhance error message for withdrawal operations
      if (error instanceof ObscuraError) {
        throw new ObscuraError(
          `Withdrawal failed: ${error.message}`,
          error.category,
          error.isRetryable,
          error.originalError
        );
      }
      throw error;
    }
  }
  
  /**
   * Get privacy infrastructure status
   * 
   * Includes:
   * - Automatic retry for transient failures
   * - Circuit breaker protection
   * - Timeout handling (30s default)
   */
  async getPrivacyStatus(): Promise<PrivacyStatusResponse> {
    try {
      return await this.makeRequest<PrivacyStatusResponse>('/api/v1/privacy/status', {
        method: 'GET',
      });
    } catch (error) {
      // Enhance error message
      if (error instanceof ObscuraError) {
        throw new ObscuraError(
          `Failed to get privacy status: ${error.message}`,
          error.category,
          error.isRetryable,
          error.originalError
        );
      }
      throw error;
    }
  }
  
  /**
   * Get relayer network statistics
   * 
   * Includes:
   * - Automatic retry for transient failures
   * - Circuit breaker protection
   * - Timeout handling (30s default)
   */
  async getRelayerStats(): Promise<RelayerStatsResponse> {
    try {
      return await this.makeRequest<RelayerStatsResponse>('/api/v1/relayer/stats', {
        method: 'GET',
      });
    } catch (error) {
      // Enhance error message
      if (error instanceof ObscuraError) {
        throw new ObscuraError(
          `Failed to get relayer stats: ${error.message}`,
          error.category,
          error.isRetryable,
          error.originalError
        );
      }
      throw error;
    }
  }
  
  /**
   * Get withdrawal request status
   * 
   * Includes:
   * - Automatic retry for transient failures
   * - Circuit breaker protection
   * - Timeout handling (30s default)
   */
  async getWithdrawalRequest(requestId: string): Promise<WithdrawalRequestResponse> {
    try {
      return await this.makeRequest<WithdrawalRequestResponse>(
        `/api/v1/relayer/request/${requestId}`,
        {
          method: 'GET',
        }
      );
    } catch (error) {
      // Enhance error message
      if (error instanceof ObscuraError) {
        throw new ObscuraError(
          `Failed to get withdrawal request: ${error.message}`,
          error.category,
          error.isRetryable,
          error.originalError
        );
      }
      throw error;
    }
  }
  
  /**
   * Verify connection to Obscura-LLMS backend
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const status = await this.getPrivacyStatus();
      console.log('[ObscuraLLMS] Connected to Obscura-LLMS BE:', status);
      return status.status === 'operational';
    } catch (error) {
      if (error instanceof ObscuraError) {
        console.error(
          `[ObscuraLLMS] Failed to connect: ${error.category} - ${error.message}`
        );
      } else {
        console.error('[ObscuraLLMS] Failed to connect:', error);
      }
      return false;
    }
  }
  
  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(): string {
    return this.circuitBreaker.getState();
  }
  
  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
  
  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = {
      ...this.retryConfig,
      ...config,
    };
  }
}

export const obscuraLLMSClient = new ObscuraLLMSClient();
