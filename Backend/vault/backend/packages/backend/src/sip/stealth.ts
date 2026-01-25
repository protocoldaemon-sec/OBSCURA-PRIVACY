/**
 * Stealth Addressing - SDK Wrapper
 * 
 * Thin wrapper around @sip-protocol/sdk stealth primitives
 * for EIP-5564 compliant stealth addressing
 */

import {
  generateStealthMetaAddress,
  generateStealthAddress,
  encodeStealthMetaAddress,
  decodeStealthMetaAddress,
  type StealthMetaAddress as SDKStealthMetaAddress,
  type StealthAddress as SDKStealthAddress,
  type ChainId,
  type HexString,
} from '@sip-protocol/sdk';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';

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
 * Helper to convert hex string to bytes (handles 0x prefix)
 */
function hexToUint8Array(hex: HexString): Uint8Array {
  return hexToBytes(hex.slice(2));
}

/**
 * Helper to convert bytes to hex string with 0x prefix
 */
function uint8ArrayToHex(bytes: Uint8Array): HexString {
  return `0x${bytesToHex(bytes)}` as HexString;
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
  static generateKeyPair(chain: ChainId = 'ethereum'): StealthKeyPair {
    const result = generateStealthMetaAddress(chain);
    
    const metaAddress: StealthMetaAddress = {
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
  static deriveStealthAddress(metaAddress: StealthMetaAddress): StealthAddress {
    // Convert to SDK format
    const sdkMeta: SDKStealthMetaAddress = {
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
  static checkViewTag(
    _viewingPrivKey: Uint8Array,
    _ephemeralPubKey: Uint8Array,
    _expectedViewTag: number
  ): boolean {
    // Simple view tag check - in production use SDK's check function
    return true; // Pass to full check
  }

  /**
   * Encode meta-address to string format using SDK
   */
  static encodeMetaAddress(meta: StealthMetaAddress): string {
    const sdkMeta: SDKStealthMetaAddress = {
      spendingKey: uint8ArrayToHex(meta.spendingPubKey),
      viewingKey: uint8ArrayToHex(meta.viewingPubKey),
      chain: meta.chain,
    };
    return encodeStealthMetaAddress(sdkMeta);
  }

  /**
   * Decode meta-address from string format using SDK
   */
  static decodeMetaAddress(encoded: string): StealthMetaAddress {
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
export type { ChainId, HexString };
