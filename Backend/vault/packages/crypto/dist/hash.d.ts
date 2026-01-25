/**
 * Hash utilities using @noble/hashes
 *
 * Using SHA-256 as the primary hash function.
 * Can be swapped for SHA-3 or BLAKE2 if needed.
 */
import type { Hash, HexString } from './types.js';
/** Hash output size in bytes */
export declare const HASH_SIZE = 32;
/**
 * SHA-256 hash function
 */
export declare function hash(data: Uint8Array): Hash;
/**
 * Keccak-256 hash (for EVM compatibility)
 */
export declare function keccak256(data: Uint8Array): Hash;
/**
 * Hash with domain separation
 */
export declare function hashWithDomain(domain: string, data: Uint8Array): Hash;
/**
 * Concatenate and hash two values
 */
export declare function hashConcat(a: Uint8Array, b: Uint8Array): Hash;
/**
 * Hash multiple values together
 */
export declare function hashMany(...values: Uint8Array[]): Hash;
/**
 * Convert bytes to hex string
 */
export declare function toHex(bytes: Uint8Array): HexString;
/**
 * Convert hex string to bytes
 */
export declare function fromHex(hex: HexString): Uint8Array;
/**
 * Compare two byte arrays for equality
 */
export declare function bytesEqual(a: Uint8Array, b: Uint8Array): boolean;
/**
 * Generate cryptographically secure random bytes
 */
export declare function randomBytes(length: number): Uint8Array;
/**
 * XOR two byte arrays
 */
export declare function xor(a: Uint8Array, b: Uint8Array): Uint8Array;
/**
 * Convert number to big-endian bytes
 */
export declare function numberToBytes(num: number, length: number): Uint8Array;
/**
 * Convert big-endian bytes to number
 */
export declare function bytesToNumber(bytes: Uint8Array): number;
//# sourceMappingURL=hash.d.ts.map