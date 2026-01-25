/**
 * WOTS (Winternitz One-Time Signature) implementation
 * 
 * Based on RFC 8391 (XMSS) WOTS+ variant
 * 
 * Key properties:
 * - Post-quantum secure (hash-based)
 * - One-time use only (key reuse breaks security)
 * - Configurable w parameter for size/speed tradeoff
 */

export { WOTSScheme, createWOTS } from './scheme.js';
export { WOTSKeyManager } from './key-manager.js';
export { computeWOTSParams, validateParams } from './params.js';
export type { WOTSParams, WOTSPublicKey, WOTSPrivateKey, WOTSSignature } from '../types.js';
