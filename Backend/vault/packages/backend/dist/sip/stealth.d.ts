/**
 * Stealth Addressing - SDK Wrapper
 *
 * Thin wrapper around @sip-protocol/sdk stealth primitives
 * for EIP-5564 compliant stealth addressing
 */
import { generateStealthMetaAddress, generateStealthAddress, encodeStealthMetaAddress, decodeStealthMetaAddress, type ChainId, type HexString } from '@sip-protocol/sdk';
/** Stealth meta-address (spending key + viewing key) */
export interface StealthMetaAddress {
    /** Spending public key */
    spendingPubKey: Uint8Array;
    /** Viewing public key */
    viewingPubKey: Uint8Array;
    /** Chain ID */
    chain: ChainId;
}
/** Stealth address with ephemeral key */
export interface StealthAddress {
    /** Derived stealth address */
    address: Uint8Array;
    /** Ephemeral public key (to be published) */
    ephemeralPubKey: Uint8Array;
    /** View tag for efficient scanning */
    viewTag: number;
}
/** Keys for recipient */
export interface StealthKeyPair {
    /** Spending private key */
    spendingPrivKey: Uint8Array;
    /** Viewing private key */
    viewingPrivKey: Uint8Array;
    /** Meta-address */
    metaAddress: StealthMetaAddress;
    /** Encoded meta-address string */
    encodedMetaAddress: string;
}
/**
 * Stealth Addressing class
 *
 * Wraps @sip-protocol/sdk stealth functions for our use case.
 * Implements dual-key stealth address scheme:
 * - Spending key: controls funds
 * - Viewing key: allows scanning without spending ability
 */
export declare class StealthAddressing {
    /**
     * Generate a new stealth key pair using SDK
     */
    static generateKeyPair(chain?: ChainId): StealthKeyPair;
    /**
     * Derive stealth address from recipient's meta-address
     *
     * Used by sender to create one-time address
     */
    static deriveStealthAddress(metaAddress: StealthMetaAddress): StealthAddress;
    /**
     * Check if a stealth address belongs to us (using view tag for fast filtering)
     */
    static checkViewTag(_viewingPrivKey: Uint8Array, _ephemeralPubKey: Uint8Array, _expectedViewTag: number): boolean;
    /**
     * Encode meta-address to string format using SDK
     */
    static encodeMetaAddress(meta: StealthMetaAddress): string;
    /**
     * Decode meta-address from string format using SDK
     */
    static decodeMetaAddress(encoded: string): StealthMetaAddress;
}
export { generateStealthMetaAddress, generateStealthAddress, encodeStealthMetaAddress, decodeStealthMetaAddress };
export type { ChainId, HexString };
//# sourceMappingURL=stealth.d.ts.map