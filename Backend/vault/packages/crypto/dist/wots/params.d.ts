/**
 * WOTS parameter computation
 *
 * Based on XMSS RFC 8391
 */
import type { WOTSParams } from '../types.js';
/**
 * Compute WOTS parameters from Winternitz parameter w and hash size n
 *
 * @param w - Winternitz parameter (4, 16, or 256 recommended)
 * @param n - Hash output size in bytes (default 32 for SHA-256)
 */
export declare function computeWOTSParams(w?: number, n?: number): WOTSParams;
/**
 * Validate WOTS parameters
 */
export declare function validateParams(params: WOTSParams): void;
/**
 * Get recommended parameters for different security/performance tradeoffs
 */
export declare function getRecommendedParams(profile: 'fast' | 'balanced' | 'compact'): WOTSParams;
/**
 * Calculate signature size in bytes
 */
export declare function signatureSize(params: WOTSParams): number;
/**
 * Calculate public key size in bytes
 */
export declare function publicKeySize(params: WOTSParams): number;
/**
 * Calculate private key size in bytes
 */
export declare function privateKeySize(params: WOTSParams): number;
//# sourceMappingURL=params.d.ts.map