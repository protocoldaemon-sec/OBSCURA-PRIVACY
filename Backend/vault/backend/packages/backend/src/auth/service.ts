/**
 * PQ Authorization Service
 * 
 * Off-chain WOTS signature verification and intent authorization
 */

import { 
  WOTSScheme, 
  createWOTS, 
  verifyMerkleProof,
  toHex,
  bytesEqual
} from '@obscura/crypto';
import type { 
  WOTSSignedIntent, 
  WOTSParams,
  Hash 
} from '@obscura/crypto';
import { KeyIndexRegistry } from './registry.js';
import type { AuthorizedIntent, AuthVerificationResult, ShieldedIntent } from '../types.js';

/** Pool registration info */
interface RegisteredPool {
  /** Merkle root */
  root: string;
  /** Total keys in pool */
  totalKeys: number;
  /** WOTS parameters */
  params: WOTSParams;
  /** Owner identifier (optional) */
  owner?: string;
  /** Registration timestamp */
  registeredAt: number;
}

/**
 * PQ Authorization Service
 * 
 * Validates WOTS signatures and manages key usage off-chain
 */
export class PQAuthService {
  private registry: KeyIndexRegistry;
  private registeredPools: Map<string, RegisteredPool> = new Map();
  private scheme: WOTSScheme;

  constructor(registry?: KeyIndexRegistry) {
    this.registry = registry ?? new KeyIndexRegistry();
    this.scheme = createWOTS(16); // Default w=16
  }

  /**
   * Register a WOTS key pool
   * 
   * This associates a Merkle root with pool metadata
   */
  registerPool(
    merkleRoot: Hash,
    params: WOTSParams,
    totalKeys: number,
    owner?: string
  ): void {
    const rootHex = toHex(merkleRoot);
    
    if (this.registeredPools.has(rootHex)) {
      throw new Error(`Pool ${rootHex.slice(0, 16)}... already registered`);
    }

    this.registeredPools.set(rootHex, {
      root: rootHex,
      totalKeys,
      params,
      owner,
      registeredAt: Date.now()
    });

    this.registry.registerPool(merkleRoot);
  }

  /**
   * Verify a WOTS-signed intent
   * 
   * Checks:
   * 1. Pool is registered
   * 2. Key index is valid and unused
   * 3. WOTS signature is valid
   * 4. Merkle proof is valid
   */
  verifySignedIntent(signedIntent: WOTSSignedIntent): AuthVerificationResult {
    const rootHex = toHex(signedIntent.merkleRoot);

    // Check pool is registered
    const pool = this.registeredPools.get(rootHex);
    if (!pool) {
      return {
        valid: false,
        error: `Unknown pool: ${rootHex.slice(0, 16)}...`
      };
    }

    // Check key index is in range
    if (signedIntent.keyIndex < 0 || signedIntent.keyIndex >= pool.totalKeys) {
      return {
        valid: false,
        error: `Key index ${signedIntent.keyIndex} out of range [0, ${pool.totalKeys})`
      };
    }

    // Check key hasn't been used
    const keyPreviouslySeen = this.registry.isKeyUsed(
      signedIntent.merkleRoot,
      signedIntent.keyIndex
    );

    if (keyPreviouslySeen) {
      return {
        valid: false,
        error: `Key index ${signedIntent.keyIndex} has already been used (CRITICAL: potential key reuse attack!)`,
        keyIndex: signedIntent.keyIndex,
        keyPreviouslySeen: true
      };
    }

    // Use scheme with correct parameters
    const scheme = new WOTSScheme(pool.params);

    // Verify WOTS signature
    const isValidSig = scheme.verifyWithPublicKey(
      signedIntent.signature,
      signedIntent.intentHash,
      signedIntent.publicKey
    );

    if (!isValidSig) {
      return {
        valid: false,
        error: 'Invalid WOTS signature',
        keyIndex: signedIntent.keyIndex
      };
    }

    // Verify public key is in the pool (Merkle proof)
    const publicKeyHash = scheme.hashPublicKey(signedIntent.publicKey);
    const isValidProof = verifyMerkleProof(
      signedIntent.merkleProof,
      publicKeyHash,
      signedIntent.merkleRoot
    );

    if (!isValidProof) {
      return {
        valid: false,
        error: 'Invalid Merkle proof - public key not in pool',
        keyIndex: signedIntent.keyIndex
      };
    }

    return {
      valid: true,
      keyIndex: signedIntent.keyIndex,
      keyPreviouslySeen: false
    };
  }

  /**
   * Authorize an intent (verify and mark key as used)
   * 
   * This is the main entry point for authorization
   */
  authorizeIntent(
    shielded: ShieldedIntent,
    wotsAuth: WOTSSignedIntent
  ): { authorized: AuthorizedIntent; result: AuthVerificationResult } {
    // Verify the signature matches the shielded intent's commitment
    if (!bytesEqual(wotsAuth.intentHash, shielded.commitment)) {
      return {
        authorized: undefined as any,
        result: {
          valid: false,
          error: 'WOTS signature intent hash does not match shielded intent commitment'
        }
      };
    }

    // Verify the WOTS signature
    const result = this.verifySignedIntent(wotsAuth);

    if (!result.valid) {
      return { authorized: undefined as any, result };
    }

    // Mark key as used (burns the key)
    this.registry.markKeyUsed(
      wotsAuth.merkleRoot,
      wotsAuth.keyIndex,
      wotsAuth.intentHash
    );

    const authorized: AuthorizedIntent = {
      shielded,
      wotsAuth,
      authorizedAt: Date.now()
    };

    return { authorized, result };
  }

  /**
   * Batch verify multiple signed intents
   */
  batchVerify(signedIntents: WOTSSignedIntent[]): AuthVerificationResult[] {
    return signedIntents.map(intent => this.verifySignedIntent(intent));
  }

  /**
   * Get pool info
   */
  getPool(merkleRoot: Hash): RegisteredPool | undefined {
    return this.registeredPools.get(toHex(merkleRoot));
  }

  /**
   * Get all registered pools
   */
  getAllPools(): RegisteredPool[] {
    return Array.from(this.registeredPools.values());
  }

  /**
   * Get pool statistics
   */
  getPoolStats(merkleRoot: Hash): { total: number; used: number; available: number } | undefined {
    const pool = this.getPool(merkleRoot);
    if (!pool) return undefined;

    const used = this.registry.getUsedCount(merkleRoot);
    return {
      total: pool.totalKeys,
      used,
      available: pool.totalKeys - used
    };
  }

  /**
   * Get the key index registry
   */
  getRegistry(): KeyIndexRegistry {
    return this.registry;
  }

  /**
   * Export service state for persistence
   */
  exportState(): {
    pools: RegisteredPool[];
    registry: ReturnType<KeyIndexRegistry['exportState']>;
  } {
    return {
      pools: Array.from(this.registeredPools.values()),
      registry: this.registry.exportState()
    };
  }

  /**
   * Import service state from persistence
   */
  importState(state: {
    pools: RegisteredPool[];
    registry: ReturnType<KeyIndexRegistry['exportState']>;
  }): void {
    for (const pool of state.pools) {
      this.registeredPools.set(pool.root, pool);
    }
    this.registry.importState(state.registry);
  }
}
