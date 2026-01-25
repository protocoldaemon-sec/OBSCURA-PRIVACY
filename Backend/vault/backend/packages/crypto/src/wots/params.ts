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
export function computeWOTSParams(w: number = 16, n: number = 32): WOTSParams {
  // Validate w is a power of 2
  if (w < 2 || (w & (w - 1)) !== 0) {
    throw new Error('w must be a power of 2 (typically 4, 16, or 256)');
  }

  // log2(w) - bits per chain
  const log2w = Math.log2(w);

  // len1: number of base-w digits in message
  // len1 = ceil(8n / log2(w))
  const len1 = Math.ceil((8 * n) / log2w);

  // len2: number of base-w digits in checksum
  // len2 = floor(log2(len1 * (w-1)) / log2(w)) + 1
  const len2 = Math.floor(Math.log2(len1 * (w - 1)) / log2w) + 1;

  // Total number of chains
  const len = len1 + len2;

  return { w, n, len1, len2, len };
}

/**
 * Validate WOTS parameters
 */
export function validateParams(params: WOTSParams): void {
  const expected = computeWOTSParams(params.w, params.n);
  
  if (params.len1 !== expected.len1) {
    throw new Error(`Invalid len1: expected ${expected.len1}, got ${params.len1}`);
  }
  if (params.len2 !== expected.len2) {
    throw new Error(`Invalid len2: expected ${expected.len2}, got ${params.len2}`);
  }
  if (params.len !== expected.len) {
    throw new Error(`Invalid len: expected ${expected.len}, got ${params.len}`);
  }
}

/**
 * Get recommended parameters for different security/performance tradeoffs
 */
export function getRecommendedParams(profile: 'fast' | 'balanced' | 'compact'): WOTSParams {
  switch (profile) {
    case 'fast':
      // w=4: Fastest signing/verification, largest signatures
      return computeWOTSParams(4, 32);
    case 'balanced':
      // w=16: Good balance (default)
      return computeWOTSParams(16, 32);
    case 'compact':
      // w=256: Smallest signatures, slowest operations
      return computeWOTSParams(256, 32);
    default:
      return computeWOTSParams(16, 32);
  }
}

/**
 * Calculate signature size in bytes
 */
export function signatureSize(params: WOTSParams): number {
  return params.len * params.n;
}

/**
 * Calculate public key size in bytes
 */
export function publicKeySize(params: WOTSParams): number {
  return params.len * params.n;
}

/**
 * Calculate private key size in bytes
 */
export function privateKeySize(params: WOTSParams): number {
  return params.len * params.n;
}
