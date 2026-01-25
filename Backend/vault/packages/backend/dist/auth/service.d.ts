/**
 * PQ Authorization Service
 *
 * Off-chain WOTS signature verification and intent authorization
 */
import type { WOTSSignedIntent, WOTSParams, Hash } from '@obscura/crypto';
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
export declare class PQAuthService {
    private registry;
    private registeredPools;
    private scheme;
    constructor(registry?: KeyIndexRegistry);
    /**
     * Register a WOTS key pool
     *
     * This associates a Merkle root with pool metadata
     */
    registerPool(merkleRoot: Hash, params: WOTSParams, totalKeys: number, owner?: string): void;
    /**
     * Verify a WOTS-signed intent
     *
     * Checks:
     * 1. Pool is registered
     * 2. Key index is valid and unused
     * 3. WOTS signature is valid
     * 4. Merkle proof is valid
     */
    verifySignedIntent(signedIntent: WOTSSignedIntent): AuthVerificationResult;
    /**
     * Authorize an intent (verify and mark key as used)
     *
     * This is the main entry point for authorization
     */
    authorizeIntent(shielded: ShieldedIntent, wotsAuth: WOTSSignedIntent): {
        authorized: AuthorizedIntent;
        result: AuthVerificationResult;
    };
    /**
     * Batch verify multiple signed intents
     */
    batchVerify(signedIntents: WOTSSignedIntent[]): AuthVerificationResult[];
    /**
     * Get pool info
     */
    getPool(merkleRoot: Hash): RegisteredPool | undefined;
    /**
     * Get all registered pools
     */
    getAllPools(): RegisteredPool[];
    /**
     * Get pool statistics
     */
    getPoolStats(merkleRoot: Hash): {
        total: number;
        used: number;
        available: number;
    } | undefined;
    /**
     * Get the key index registry
     */
    getRegistry(): KeyIndexRegistry;
    /**
     * Export service state for persistence
     */
    exportState(): {
        pools: RegisteredPool[];
        registry: ReturnType<KeyIndexRegistry['exportState']>;
    };
    /**
     * Import service state from persistence
     */
    importState(state: {
        pools: RegisteredPool[];
        registry: ReturnType<KeyIndexRegistry['exportState']>;
    }): void;
}
export {};
//# sourceMappingURL=service.d.ts.map