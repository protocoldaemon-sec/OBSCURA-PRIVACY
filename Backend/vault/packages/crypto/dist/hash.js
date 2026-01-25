/**
 * Hash utilities using @noble/hashes
 *
 * Using SHA-256 as the primary hash function.
 * Can be swapped for SHA-3 or BLAKE2 if needed.
 */
import { sha256 } from '@noble/hashes/sha256';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
/** Hash output size in bytes */
export const HASH_SIZE = 32;
/**
 * SHA-256 hash function
 */
export function hash(data) {
    return sha256(data);
}
/**
 * Keccak-256 hash (for EVM compatibility)
 */
export function keccak256(data) {
    return keccak_256(data);
}
/**
 * Hash with domain separation
 */
export function hashWithDomain(domain, data) {
    const domainBytes = new TextEncoder().encode(domain);
    const combined = new Uint8Array(domainBytes.length + 1 + data.length);
    combined.set(domainBytes, 0);
    combined[domainBytes.length] = 0; // null separator
    combined.set(data, domainBytes.length + 1);
    return hash(combined);
}
/**
 * Concatenate and hash two values
 */
export function hashConcat(a, b) {
    const combined = new Uint8Array(a.length + b.length);
    combined.set(a, 0);
    combined.set(b, a.length);
    return hash(combined);
}
/**
 * Hash multiple values together
 */
export function hashMany(...values) {
    const totalLength = values.reduce((acc, v) => acc + v.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const v of values) {
        combined.set(v, offset);
        offset += v.length;
    }
    return hash(combined);
}
/**
 * Convert bytes to hex string
 */
export function toHex(bytes) {
    return bytesToHex(bytes);
}
/**
 * Convert hex string to bytes
 */
export function fromHex(hex) {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    return hexToBytes(cleanHex);
}
/**
 * Compare two byte arrays for equality
 */
export function bytesEqual(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
/**
 * Generate cryptographically secure random bytes
 */
export function randomBytes(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
}
/**
 * XOR two byte arrays
 */
export function xor(a, b) {
    if (a.length !== b.length) {
        throw new Error('XOR: arrays must have equal length');
    }
    const result = new Uint8Array(a.length);
    for (let i = 0; i < a.length; i++) {
        result[i] = a[i] ^ b[i];
    }
    return result;
}
/**
 * Convert number to big-endian bytes
 */
export function numberToBytes(num, length) {
    const bytes = new Uint8Array(length);
    for (let i = length - 1; i >= 0; i--) {
        bytes[i] = num & 0xff;
        num = num >> 8;
    }
    return bytes;
}
/**
 * Convert big-endian bytes to number
 */
export function bytesToNumber(bytes) {
    let num = 0;
    for (let i = 0; i < bytes.length; i++) {
        num = (num << 8) | bytes[i];
    }
    return num;
}
//# sourceMappingURL=hash.js.map