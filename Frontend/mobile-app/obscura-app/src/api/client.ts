/**
 * Obscura API Client
 * Connects React Native app to Obscura backend
 */

const API_BASE_URL = 'https://obscurabackend-production.up.railway.app';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TransferRequest {
  recipient: string;
  asset: string;
  amount: string;
  sourceChain: 'ethereum' | 'solana' | 'polygon' | 'arbitrum';
  targetChain?: string;
  privacyLevel?: 'transparent' | 'shielded' | 'compliant';
}

export interface SwapRequest {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  deadline?: number;
  privacyLevel?: 'transparent' | 'shielded' | 'compliant';
}

export interface IntentResponse {
  intentId: string;
  stealthAddress: string;
  commitment: string;
  expiresAt: number;
  type?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  services: {
    auth: string;
    aggregator: string;
  };
}

class ObscuraClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Health check
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Get API info
  async info(): Promise<any> {
    return this.request('/');
  }

  // Create private transfer
  async transfer(params: TransferRequest): Promise<IntentResponse> {
    return this.request<IntentResponse>('/api/v1/transfer', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Create private swap
  async swap(params: SwapRequest): Promise<IntentResponse> {
    return this.request<IntentResponse>('/api/v1/swap', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Get intent status
  async getIntent(intentId: string): Promise<any> {
    return this.request(`/api/v1/intents/${intentId}`);
  }

  // Get quotes
  async getQuotes(params: {
    sourceChain: string;
    targetChain: string;
    inputAsset: string;
    outputAsset: string;
    amount: string;
  }): Promise<any> {
    return this.request('/api/v1/quotes', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Get pending batches
  async getBatches(): Promise<any> {
    return this.request('/api/v1/batches');
  }
}

export const obscuraClient = new ObscuraClient();
export default ObscuraClient;
