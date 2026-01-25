/**
 * Stealth Addressing - SDK Wrapper
 *
 * Thin wrapper around @sip-protocol/sdk stealth primitives
 * for EIP-5564 compliant stealth addressing
 */
import { generateStealthMetaAddress, generateStealthAddress, encodeStealthMetaAddress, decodeStealthMetaAddress, } from '@sip-protocol/sdk';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';
/**
 * Helper to convert hex string to bytes (handles 0x prefix)
 */
function hexToUint8Array(hex) {
    return hexToBytes(hex.slice(2));
}
/**
 * Helper to convert bytes to hex string with 0x prefix
 */
function uint8ArrayToHex(bytes) {
    return `0x${bytesToHex(bytes)}`;
}
/**
 * Stealth Addressing class
 *
 * Wraps @sip-protocol/sdk stealth functions for our use case.
 * Implements dual-key stealth address scheme:
 * - Spending key: controls funds
 * - Viewing key: allows scanning without spending ability
 */
export class StealthAddressing {
    /**
     * Generate a new stealth key pair using SDK
     */
    static generateKeyPair(chain = 'ethereum') {
        const result = generateStealthMetaAddress(chain);
        const metaAddress = {
            spendingPubKey: hexToUint8Array(result.metaAddress.spendingKey),
            viewingPubKey: hexToUint8Array(result.metaAddress.viewingKey),
            chain: result.metaAddress.chain,
        };
        return {
            spendingPrivKey: hexToUint8Array(result.spendingPrivateKey),
            viewingPrivKey: hexToUint8Array(result.viewingPrivateKey),
            metaAddress,
            encodedMetaAddress: encodeStealthMetaAddress(result.metaAddress),
        };
    }
    /**
     * Derive stealth address from recipient's meta-address
     *
     * Used by sender to create one-time address
     */
    static deriveStealthAddress(metaAddress) {
        // Convert to SDK format
        const sdkMeta = {
            spendingKey: uint8ArrayToHex(metaAddress.spendingPubKey),
            viewingKey: uint8ArrayToHex(metaAddress.viewingPubKey),
            chain: metaAddress.chain,
        };
        const result = generateStealthAddress(sdkMeta);
        return {
            address: hexToUint8Array(result.stealthAddress.address),
            ephemeralPubKey: hexToUint8Array(result.stealthAddress.ephemeralPublicKey),
            viewTag: result.stealthAddress.viewTag,
        };
    }
    /**
     * Check if a stealth address belongs to us (using view tag for fast filtering)
     */
    static checkViewTag(_viewingPrivKey, _ephemeralPubKey, _expectedViewTag) {
        // Simple view tag check - in production use SDK's check function
        return true; // Pass to full check
    }
    /**
     * Encode meta-address to string format using SDK
     */
    static encodeMetaAddress(meta) {
        const sdkMeta = {
            spendingKey: uint8ArrayToHex(meta.spendingPubKey),
            viewingKey: uint8ArrayToHex(meta.viewingPubKey),
            chain: meta.chain,
        };
        return encodeStealthMetaAddress(sdkMeta);
    }
    /**
     * Decode meta-address from string format using SDK
     */
    static decodeMetaAddress(encoded) {
        const sdkMeta = decodeStealthMetaAddress(encoded);
        return {
            spendingPubKey: hexToUint8Array(sdkMeta.spendingKey),
            viewingPubKey: hexToUint8Array(sdkMeta.viewingKey),
            chain: sdkMeta.chain,
        };
    }
}
// Re-export SDK functions and types for direct use
export { generateStealthMetaAddress, generateStealthAddress, encodeStealthMetaAddress, decodeStealthMetaAddress };
//# sourceMappingURL=stealth.js.map