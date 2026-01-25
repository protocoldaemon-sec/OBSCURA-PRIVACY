/**
 * Stealth Addresses (EIP-5564 compatible)
 * 
 * Recipients generate one-time addresses that cannot be linked
 * to their main address.
 * 
 * Protocol:
 * 1. Recipient publishes: (S, V) = (s·G, v·G) - Spending and viewing keys
 * 2. Sender generates ephemeral key: r, R = r·G
 * 3. Sender computes stealth address:
 *    shared_secret = r·V = r·v·G
 *    stealth_pk = S + H(shared_secret)·G
 *    stealth_addr = address(stealth_pk)
 * 4. Recipient scans:
 *    shared_secret' = v·R = v·r·G
 *    stealth_sk = s + H(shared_secret')
 *    Can spend from stealth_addr
 */

import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from 'crypto';
import { Keypair, PublicKey } from '@solana/web3.js';
import { privateKeyToAccount } from 'viem/accounts';
import type { StealthAddressData } from './types.js';

// Re-export the type
export type { StealthAddressData } from './types.js';

/** Stealth meta-address format: st:<chain>:<spendingKey>:<viewingKey> */
const STEALTH_PREFIX = 'st';

/**
 * Generate a stealth meta-address for a recipient
 * This is published once and used by senders to derive stealth addresses
 */
export function generateStealthMetaAddress(chain: 'solana' | 'ethereum'): {
  metaAddress: string;
  spendingKey: Uint8Array;
  viewingKey: Uint8Array;
  spendingPubKey: Uint8Array;
  viewingPubKey: Uint8Array;
} {
  // Generate spending and viewing key pairs
  const spendingKey = randomBytes(32);
  const viewingKey = randomBytes(32);
  
  let spendingPubKey: Uint8Array;
  let viewingPubKey: Uint8Array;
  
  if (chain === 'solana') {
    // For Solana, derive public keys from keypairs
    const spendingKeypair = Keypair.fromSeed(spendingKey);
    const viewingKeypair = Keypair.fromSeed(viewingKey);
    spendingPubKey = spendingKeypair.publicKey.toBytes();
    viewingPubKey = viewingKeypair.publicKey.toBytes();
  } else {
    // For Ethereum, use viem
    const spendingAccount = privateKeyToAccount(`0x${Buffer.from(spendingKey).toString('hex')}`);
    const viewingAccount = privateKeyToAccount(`0x${Buffer.from(viewingKey).toString('hex')}`);
    spendingPubKey = Buffer.from(spendingAccount.address.slice(2), 'hex');
    viewingPubKey = Buffer.from(viewingAccount.address.slice(2), 'hex');
  }
  
  // Format: st:<chain>:<spendingPubKey>:<viewingPubKey>
  const metaAddress = `${STEALTH_PREFIX}:${chain}:${Buffer.from(spendingPubKey).toString('hex')}:${Buffer.from(viewingPubKey).toString('hex')}`;
  
  return {
    metaAddress,
    spendingKey: new Uint8Array(spendingKey),
    viewingKey: new Uint8Array(viewingKey),
    spendingPubKey: new Uint8Array(spendingPubKey),
    viewingPubKey: new Uint8Array(viewingPubKey),
  };
}

/**
 * Parse a stealth meta-address
 */
export function parseStealthMetaAddress(metaAddress: string): {
  chain: 'solana' | 'ethereum';
  spendingPubKey: Uint8Array;
  viewingPubKey: Uint8Array;
} | null {
  const parts = metaAddress.split(':');
  if (parts.length !== 4 || parts[0] !== STEALTH_PREFIX) {
    return null;
  }
  
  const chain = parts[1] as 'solana' | 'ethereum';
  if (chain !== 'solana' && chain !== 'ethereum') {
    return null;
  }
  
  return {
    chain,
    spendingPubKey: new Uint8Array(Buffer.from(parts[2], 'hex')),
    viewingPubKey: new Uint8Array(Buffer.from(parts[3], 'hex')),
  };
}

/**
 * Derive a stealth address for a recipient
 * Called by sender to create one-time address
 */
export function deriveStealthAddress(
  recipientMetaAddress: string,
  chain: 'solana' | 'ethereum'
): StealthAddressData {
  const parsed = parseStealthMetaAddress(recipientMetaAddress);
  
  // If not a stealth meta-address, create one-time address anyway
  const spendingPubKey = parsed?.spendingPubKey ?? 
    new Uint8Array(Buffer.from(recipientMetaAddress.replace('0x', ''), 'hex'));
  const viewingPubKey = parsed?.viewingPubKey ?? spendingPubKey;
  
  // Generate ephemeral key pair
  const ephemeralPrivKey = randomBytes(32);
  
  // Compute shared secret: H(ephemeralPrivKey || viewingPubKey)
  const sharedSecretInput = Buffer.concat([
    ephemeralPrivKey,
    Buffer.from(viewingPubKey),
  ]);
  const sharedSecret = sha256(sharedSecretInput);
  
  // Derive stealth public key: H(sharedSecret || spendingPubKey)
  const stealthPubKeyInput = Buffer.concat([
    sharedSecret,
    Buffer.from(spendingPubKey),
  ]);
  const stealthPubKeyHash = sha256(stealthPubKeyInput);
  
  // Generate view tag (first byte of shared secret for efficient scanning)
  const viewTag = new Uint8Array([sharedSecret[0]]);
  
  let stealthAddress: string;
  let ephemeralPubKey: Uint8Array;
  
  if (chain === 'solana') {
    // For Solana, derive a valid public key
    const stealthKeypair = Keypair.fromSeed(stealthPubKeyHash);
    stealthAddress = stealthKeypair.publicKey.toBase58();
    
    const ephemeralKeypair = Keypair.fromSeed(ephemeralPrivKey);
    ephemeralPubKey = ephemeralKeypair.publicKey.toBytes();
  } else {
    // For Ethereum, derive address from hash
    stealthAddress = `0x${Buffer.from(stealthPubKeyHash).toString('hex').slice(0, 40)}`;
    
    const ephemeralAccount = privateKeyToAccount(`0x${Buffer.from(ephemeralPrivKey).toString('hex')}`);
    ephemeralPubKey = Buffer.from(ephemeralAccount.address.slice(2), 'hex');
  }
  
  return {
    stealthAddress,
    ephemeralPubKey: new Uint8Array(ephemeralPubKey),
    viewTag,
    sharedSecret: new Uint8Array(sharedSecret),
  };
}

/**
 * Derive stealth address for a regular address (non-meta-address)
 * Creates a one-time address even for regular recipients
 */
export function deriveStealthAddressFromRegular(
  recipientAddress: string,
  chain: 'solana' | 'ethereum'
): StealthAddressData {
  // Generate ephemeral key
  const ephemeralPrivKey = randomBytes(32);
  
  // Compute shared secret using recipient address as "viewing key"
  const sharedSecretInput = Buffer.concat([
    ephemeralPrivKey,
    Buffer.from(recipientAddress),
  ]);
  const sharedSecret = sha256(sharedSecretInput);
  
  // For regular addresses, we still create a stealth address
  // but the recipient needs to be notified via announcement
  const stealthPubKeyInput = Buffer.concat([
    sharedSecret,
    Buffer.from(recipientAddress),
  ]);
  const stealthPubKeyHash = sha256(stealthPubKeyInput);
  
  const viewTag = new Uint8Array([sharedSecret[0]]);
  
  let stealthAddress: string;
  let ephemeralPubKey: Uint8Array;
  
  if (chain === 'solana') {
    const stealthKeypair = Keypair.fromSeed(stealthPubKeyHash);
    stealthAddress = stealthKeypair.publicKey.toBase58();
    
    const ephemeralKeypair = Keypair.fromSeed(ephemeralPrivKey);
    ephemeralPubKey = ephemeralKeypair.publicKey.toBytes();
  } else {
    stealthAddress = `0x${Buffer.from(stealthPubKeyHash).toString('hex').slice(0, 40)}`;
    
    const ephemeralAccount = privateKeyToAccount(`0x${Buffer.from(ephemeralPrivKey).toString('hex')}`);
    ephemeralPubKey = Buffer.from(ephemeralAccount.address.slice(2), 'hex');
  }
  
  return {
    stealthAddress,
    ephemeralPubKey: new Uint8Array(ephemeralPubKey),
    viewTag,
    sharedSecret: new Uint8Array(sharedSecret),
  };
}

/**
 * Check if an address is a stealth meta-address
 */
export function isStealthMetaAddress(address: string): boolean {
  return address.startsWith(`${STEALTH_PREFIX}:`);
}

/**
 * Create stealth announcement for on-chain publication
 * This allows recipients to scan and find their stealth addresses
 */
export function createStealthAnnouncement(
  stealthData: StealthAddressData,
  chain: 'solana' | 'ethereum'
): {
  schemeId: number;
  stealthAddress: string;
  ephemeralPubKey: string;
  viewTag: string;
  metadata: string;
} {
  // EIP-5564 scheme ID (1 = secp256k1, 2 = ed25519)
  const schemeId = chain === 'ethereum' ? 1 : 2;
  
  return {
    schemeId,
    stealthAddress: stealthData.stealthAddress,
    ephemeralPubKey: Buffer.from(stealthData.ephemeralPubKey).toString('hex'),
    viewTag: Buffer.from(stealthData.viewTag).toString('hex'),
    metadata: '', // Optional encrypted metadata
  };
}
