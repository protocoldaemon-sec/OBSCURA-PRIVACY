/**
 * SIP Client - SDK Integration
 *
 * Main client for SIP protocol operations using @sip-protocol/sdk
 * Provides high-level interface for:
 * - Stealth addressing (privacy)
 * - Post-quantum authentication (WOTS+)
 * - Intent creation and submission
 * - Quote/Solver integration
 */
import { SIP, PrivacyLevel, type SIPConfig, type ChainId, type ViewingKey } from '@sip-protocol/sdk';
import { type EncryptedIntent } from './encryption.js';
import type { IntentSubmission } from '../types.js';
/** SIP Client configuration */
export interface SIPClientConfig {
    /** Solver API endpoint */
    solverApiUrl: string;
    /** Network (mainnet or testnet) */
    network: 'mainnet' | 'testnet';
    /** Chain for stealth keys */
    chain: ChainId;
    /** Privacy level (TRANSPARENT, SHIELDED, COMPLIANT) */
    privacyLevel: PrivacyLevel;
    /** Viewing key for COMPLIANT mode */
    viewingKey?: ViewingKey;
}
/** Intent creation result */
export interface SIPIntent {
    /** Intent ID */
    id: string;
    /** Stealth address for receiving */
    stealthAddress: Uint8Array;
    /** Encrypted intent data */
    encryptedIntent: EncryptedIntent;
    /** WOTS+ signature for PQ auth */
    wotsSignature: Uint8Array;
    /** Public key hash for verification */
    pubKeyHash: Uint8Array;
}
/**
 * SIP Protocol Client
 *
 * Integrates @sip-protocol/sdk with our WOTS+ implementation
 * for privacy-preserving, post-quantum secure intent settlement.
 */
export declare class SIPClient {
    private sdk;
    private config;
    private stealthKeys;
    private wots;
    constructor(config: SIPClientConfig);
    /**
     * Initialize the client with fresh stealth keys
     */
    initialize(): Promise<void>;
    /**
     * Get stealth meta-address for receiving
     */
    getStealthMetaAddress(): string;
    /**
     * Create and sign an intent with WOTS+
     */
    createIntent(params: {
        tokenIn: string;
        tokenOut: string;
        amountIn: bigint;
        minAmountOut: bigint;
        deadline: number;
        recipient?: string;
    }): Promise<SIPIntent>;
    /**
     * Submit intent (demo mode - returns mock response)
     */
    submitIntent(intent: SIPIntent): Promise<IntentSubmission>;
    /**
     * Get quotes for an intent (demo mode)
     */
    getQuotes(_intent: SIPIntent): Promise<Array<{
        solverId: string;
        amountOut: bigint;
        fee: bigint;
        expiresAt: number;
    }>>;
    /**
     * Get SDK instance for direct access
     */
    getSDK(): SIP;
}
export { SIP, PrivacyLevel };
export type { SIPConfig, ChainId, ViewingKey };
//# sourceMappingURL=client.d.ts.map