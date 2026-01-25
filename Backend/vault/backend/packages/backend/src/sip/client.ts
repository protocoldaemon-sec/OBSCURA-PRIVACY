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

import {
  SIP,
  PrivacyLevel,
  type SIPConfig,
  type ChainId,
  type HexString,
  type ViewingKey,
} from '@sip-protocol/sdk';
import { WOTSScheme, hash } from '@obscura/crypto';
import type { WOTSSignature } from '@obscura/crypto';
import { StealthAddressing, type StealthKeyPair } from './stealth.js';
import { IntentEncryption, type EncryptedIntent } from './encryption.js';
import type { Intent, IntentSubmission } from '../types.js';

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
export class SIPClient {
  private sdk: SIP;
  private config: SIPClientConfig;
  private stealthKeys: StealthKeyPair | null = null;
  private wots: WOTSScheme;

  constructor(config: SIPClientConfig) {
    this.config = config;
    
    // Initialize SDK with correct config
    const sipConfig: SIPConfig = {
      network: config.network,
      mode: 'demo',
      defaultPrivacy: config.privacyLevel,
    };
    
    this.sdk = new SIP(sipConfig);
    this.wots = new WOTSScheme(); // Uses default w=16, n=32
  }

  /**
   * Initialize the client with fresh stealth keys
   */
  async initialize(): Promise<void> {
    // Generate stealth key pair using SDK wrapper
    this.stealthKeys = StealthAddressing.generateKeyPair(this.config.chain);
    
    // Generate viewing key for COMPLIANT mode
    if (this.config.privacyLevel === PrivacyLevel.COMPLIANT && !this.config.viewingKey) {
      this.config.viewingKey = IntentEncryption.generateViewingKeyPair();
    }
  }

  /**
   * Get stealth meta-address for receiving
   */
  getStealthMetaAddress(): string {
    if (!this.stealthKeys) {
      throw new Error('Client not initialized');
    }
    return this.stealthKeys.encodedMetaAddress;
  }

  /**
   * Create and sign an intent with WOTS+
   */
  async createIntent(params: {
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    minAmountOut: bigint;
    deadline: number;
    recipient?: string;
  }): Promise<SIPIntent> {
    if (!this.stealthKeys) {
      throw new Error('Client not initialized');
    }

    // Generate stealth address for this transaction
    const stealthAddr = StealthAddressing.deriveStealthAddress(this.stealthKeys.metaAddress);

    // Create intent data
    const intentData: Intent = {
      id: crypto.randomUUID(),
      sender: Buffer.from(stealthAddr.address).toString('hex'),
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      amountIn: params.amountIn,
      minAmountOut: params.minAmountOut,
      deadline: params.deadline,
      chainId: 1, // Default to mainnet
    };

    // Serialize intent for signing and hash it
    const intentBytes = new TextEncoder().encode(JSON.stringify(intentData));
    const messageHash = hash(intentBytes);

    // Sign with WOTS+ (generate key pair and sign)
    const privateKey = this.wots.generatePrivateKey();
    const publicKey = this.wots.computePublicKey(privateKey);
    const signature: WOTSSignature = this.wots.sign(privateKey, messageHash);
    
    // Compute public key hash
    const pubKeyHash = hash(new Uint8Array(publicKey.flatMap(pk => [...pk])));

    // Map privacy level to string
    const privacyLevelStr = this.config.privacyLevel === PrivacyLevel.COMPLIANT ? 'COMPLIANT' :
      this.config.privacyLevel === PrivacyLevel.TRANSPARENT ? 'TRANSPARENT' : 'SHIELDED';

    // Encrypt intent
    const encryptedIntent = IntentEncryption.encryptIntent(
      intentBytes,
      this.stealthKeys.metaAddress.viewingPubKey,
      privacyLevelStr,
      this.config.viewingKey
    );

    // Flatten signature for transport
    const flatSignature = new Uint8Array(signature.flatMap(s => [...s]));

    return {
      id: intentData.id,
      stealthAddress: stealthAddr.address,
      encryptedIntent,
      wotsSignature: flatSignature,
      pubKeyHash,
    };
  }

  /**
   * Submit intent (demo mode - returns mock response)
   */
  async submitIntent(intent: SIPIntent): Promise<IntentSubmission> {
    // In demo mode, we just return a mock response
    return {
      intentId: intent.id,
      status: 'pending',
      txHash: `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')}`,
      timestamp: Date.now(),
    };
  }

  /**
   * Get quotes for an intent (demo mode)
   */
  async getQuotes(_intent: SIPIntent): Promise<Array<{
    solverId: string;
    amountOut: bigint;
    fee: bigint;
    expiresAt: number;
  }>> {
    // Demo mode returns mock quotes
    return [
      {
        solverId: 'mock-solver-1',
        amountOut: BigInt(1000000),
        fee: BigInt(1000),
        expiresAt: Date.now() + 60000,
      },
      {
        solverId: 'mock-solver-2',
        amountOut: BigInt(999000),
        fee: BigInt(500),
        expiresAt: Date.now() + 60000,
      },
    ];
  }

  /**
   * Get SDK instance for direct access
   */
  getSDK(): SIP {
    return this.sdk;
  }
}

// Re-export SDK types
export { SIP, PrivacyLevel };
export type { SIPConfig, ChainId, ViewingKey };
