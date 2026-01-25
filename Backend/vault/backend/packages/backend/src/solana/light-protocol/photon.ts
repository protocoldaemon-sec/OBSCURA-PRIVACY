/**
 * Photon Indexer Client
 * 
 * Query interface for compressed accounts on Solana:
 * - Get compressed accounts by owner
 * - Get compressed token accounts
 * - Get account proofs for transactions
 * - Subscribe to account changes
 */

import type {
  LightProtocolConfig,
  CompressedAccount,
  CompressedAccountWithProof,
  CompressedTokenAccount,
  PhotonQueryParams,
  PhotonResponse,
  MerkleProofInfo,
  StateTree,
} from './types.js';

/** Photon RPC methods */
export enum PhotonMethod {
  GetCompressedAccount = 'getCompressedAccount',
  GetCompressedAccountsByOwner = 'getCompressedAccountsByOwner',
  GetCompressedTokenAccountsByOwner = 'getCompressedTokenAccountsByOwner',
  GetCompressedTokenAccountsByDelegate = 'getCompressedTokenAccountsByDelegate',
  GetCompressedAccountProof = 'getCompressedAccountProof',
  GetMultipleCompressedAccountProofs = 'getMultipleCompressedAccountProofs',
  GetValidityProof = 'getValidityProof',
  GetLatestSignatures = 'getLatestSignatures',
  GetIndexerHealth = 'getIndexerHealth',
  GetStateTree = 'getStateTree',
}

/** RPC response type */
interface RpcResponse<T = unknown> {
  result?: T;
  error?: { code: number; message: string };
}

/** Paginated response type */
interface PaginatedResult<T> {
  items: T[];
  cursor?: string;
  total?: number;
}

/** Validity proof result */
interface ValidityProofResult {
  compressedProof: string;
  rootIndices: number[];
  leafIndices: number[];
  roots: string[];
}

/** State tree result */
interface StateTreeResult {
  pubkey: string;
  treeType: 'state' | 'address';
  root: string;
  seq: string;
  height: number;
  leafCount: string;
  canopyDepth: number;
}

/** Health result */
interface HealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latestSlot: string;
  indexedSlot: string;
  lag: number;
}

/** Signature result */
interface SignatureResult {
  signature: string;
  slot: string;
  timestamp: number;
}

/**
 * Photon Indexer Client
 * 
 * Provides read access to compressed account state
 */
export class PhotonClient {
  private config: LightProtocolConfig;

  constructor(config: LightProtocolConfig) {
    this.config = config;
  }

  /**
   * Get a compressed account by hash
   */
  async getCompressedAccount(hash: Uint8Array): Promise<CompressedAccount | null> {
    const response = await this.rpc(PhotonMethod.GetCompressedAccount, {
      hash: this.encodeBytes(hash),
    });

    if (!response.result) {
      return null;
    }

    return this.parseCompressedAccount(response.result);
  }

  /**
   * Get compressed accounts by owner
   */
  async getCompressedAccountsByOwner(
    owner: string,
    params?: PhotonQueryParams
  ): Promise<PhotonResponse<CompressedAccount>> {
    const response = await this.rpc<PaginatedResult<unknown>>(PhotonMethod.GetCompressedAccountsByOwner, {
      owner,
      cursor: params?.cursor,
      limit: params?.limit ?? 100,
    });

    const result = response.result as { items?: unknown[]; cursor?: string; total?: number } | undefined;
    return {
      items: (result?.items ?? []).map((item: unknown) => 
        this.parseCompressedAccount(item)
      ),
      cursor: result?.cursor,
      total: result?.total,
    };
  }

  /**
   * Get compressed token accounts by owner
   */
  async getCompressedTokenAccountsByOwner(
    owner: string,
    mint?: string,
    params?: PhotonQueryParams
  ): Promise<PhotonResponse<CompressedTokenAccount>> {
    const response = await this.rpc<PaginatedResult<unknown>>(PhotonMethod.GetCompressedTokenAccountsByOwner, {
      owner,
      mint,
      cursor: params?.cursor,
      limit: params?.limit ?? 100,
    });

    const result = response.result as { items?: unknown[]; cursor?: string; total?: number } | undefined;
    return {
      items: (result?.items ?? []).map((item: unknown) => 
        this.parseCompressedTokenAccount(item)
      ),
      cursor: result?.cursor,
      total: result?.total,
    };
  }

  /**
   * Get proof for a compressed account
   */
  async getCompressedAccountProof(
    hash: Uint8Array
  ): Promise<CompressedAccountWithProof | null> {
    const response = await this.rpc(PhotonMethod.GetCompressedAccountProof, {
      hash: this.encodeBytes(hash),
    });

    if (!response.result) {
      return null;
    }

    return this.parseCompressedAccountWithProof(response.result);
  }

  /**
   * Get proofs for multiple compressed accounts
   */
  async getMultipleCompressedAccountProofs(
    hashes: Uint8Array[]
  ): Promise<(CompressedAccountWithProof | null)[]> {
    const response = await this.rpc<unknown[]>(PhotonMethod.GetMultipleCompressedAccountProofs, {
      hashes: hashes.map(h => this.encodeBytes(h)),
    });

    const result = response.result as unknown[] | undefined;
    return (result ?? []).map((item: unknown) => 
      item ? this.parseCompressedAccountWithProof(item) : null
    );
  }

  /**
   * Get validity proof for a state transition
   */
  async getValidityProof(
    inputHashes: Uint8Array[],
    newAddresses?: string[]
  ): Promise<{
    compressedProof: Uint8Array;
    rootIndices: number[];
    leafIndices: number[];
    roots: Uint8Array[];
  }> {
    const response = await this.rpc<ValidityProofResult>(PhotonMethod.GetValidityProof, {
      hashes: inputHashes.map(h => this.encodeBytes(h)),
      newAddresses,
    });

    const result = response.result as {
      compressedProof: string;
      rootIndices: number[];
      leafIndices: number[];
      roots: string[];
    };
    return {
      compressedProof: this.decodeBytes(result.compressedProof),
      rootIndices: result.rootIndices,
      leafIndices: result.leafIndices,
      roots: result.roots.map((r: string) => this.decodeBytes(r)),
    };
  }

  /**
   * Get state tree information
   */
  async getStateTree(pubkey: string): Promise<StateTree | null> {
    const response = await this.rpc<StateTreeResult>(PhotonMethod.GetStateTree, { pubkey });

    if (!response.result) {
      return null;
    }

    const result = response.result as {
      pubkey: string;
      treeType: 'state' | 'address';
      root: string;
      seq: string;
      height: number;
      leafCount: string;
      canopyDepth: number;
    };
    return {
      pubkey: result.pubkey,
      treeType: result.treeType,
      root: this.decodeBytes(result.root),
      seq: BigInt(result.seq),
      height: result.height,
      leafCount: BigInt(result.leafCount),
      canopyDepth: result.canopyDepth,
    };
  }

  /**
   * Get indexer health status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latestSlot: bigint;
    indexedSlot: bigint;
    lag: number;
  }> {
    try {
      const response = await this.rpc<HealthResult>(PhotonMethod.GetIndexerHealth, {});

      const result = response.result as {
        status?: 'healthy' | 'degraded' | 'unhealthy';
        latestSlot?: string;
        indexedSlot?: string;
        lag?: number;
      } | undefined;
      
      // Handle missing or undefined response gracefully
      if (!result) {
        console.warn('[Photon] Health check returned empty result, assuming healthy');
        return {
          status: 'healthy',
          latestSlot: 0n,
          indexedSlot: 0n,
          lag: 0,
        };
      }
      
      return {
        status: result.status ?? 'healthy',
        latestSlot: result.latestSlot ? BigInt(result.latestSlot) : 0n,
        indexedSlot: result.indexedSlot ? BigInt(result.indexedSlot) : 0n,
        lag: result.lag ?? 0,
      };
    } catch (error) {
      console.warn('[Photon] Health check failed:', error);
      // Return degraded status on error but don't throw
      return {
        status: 'degraded',
        latestSlot: 0n,
        indexedSlot: 0n,
        lag: 0,
      };
    }
  }

  /**
   * Get latest signatures for compressed transactions
   */
  async getLatestSignatures(
    limit: number = 100
  ): Promise<Array<{ signature: string; slot: bigint; timestamp: number }>> {
    const response = await this.rpc<SignatureResult[]>(PhotonMethod.GetLatestSignatures, { limit });

    const result = response.result as Array<{ signature: string; slot: string; timestamp: number }> | undefined;
    return (result ?? []).map((item) => ({
      signature: item.signature,
      slot: BigInt(item.slot),
      timestamp: item.timestamp,
    }));
  }

  // ============ Private Methods ============

  private async rpc<T = unknown>(method: PhotonMethod, params: Record<string, unknown>): Promise<RpcResponse<T>> {
    const response = await fetch(this.config.photonUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `photon-${Date.now()}`,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Photon RPC error: ${response.statusText}`);
    }

    const data = await response.json() as RpcResponse<T>;

    if (data.error) {
      throw new Error(`Photon error: ${data.error.message}`);
    }

    return data;
  }

  private encodeBytes(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('base64');
  }

  private decodeBytes(encoded: string): Uint8Array {
    return new Uint8Array(Buffer.from(encoded, 'base64'));
  }

  private parseCompressedAccount(data: unknown): CompressedAccount {
    const d = data as {
      hash: string;
      owner: string;
      lamports: string;
      data: string;
      dataHash: string;
      address?: string;
    };

    return {
      hash: this.decodeBytes(d.hash),
      owner: d.owner,
      lamports: BigInt(d.lamports),
      data: this.decodeBytes(d.data),
      dataHash: this.decodeBytes(d.dataHash),
      address: d.address,
    };
  }

  private parseCompressedTokenAccount(data: unknown): CompressedTokenAccount {
    const d = data as {
      hash: string;
      mint: string;
      owner: string;
      amount: string;
      delegate?: string;
      delegatedAmount?: string;
      isFrozen: boolean;
      closeAuthority?: string;
    };

    return {
      hash: this.decodeBytes(d.hash),
      mint: d.mint,
      owner: d.owner,
      amount: BigInt(d.amount),
      delegate: d.delegate,
      delegatedAmount: d.delegatedAmount ? BigInt(d.delegatedAmount) : undefined,
      isFrozen: d.isFrozen,
      closeAuthority: d.closeAuthority,
    };
  }

  private parseCompressedAccountWithProof(data: unknown): CompressedAccountWithProof {
    const d = data as {
      account: unknown;
      proof: {
        proof: string[];
        root: string;
        leaf: string;
        leafIndex: number;
      };
      rootIndex: number;
      leafIndex: number;
    };

    return {
      account: this.parseCompressedAccount(d.account),
      proof: {
        proof: d.proof.proof.map(p => this.decodeBytes(p)),
        root: this.decodeBytes(d.proof.root),
        leaf: this.decodeBytes(d.proof.leaf),
        leafIndex: d.proof.leafIndex,
      },
      rootIndex: d.rootIndex,
      leafIndex: d.leafIndex,
    };
  }
}

/**
 * Create Photon client from config
 */
export function createPhotonClient(config: LightProtocolConfig): PhotonClient {
  return new PhotonClient(config);
}
