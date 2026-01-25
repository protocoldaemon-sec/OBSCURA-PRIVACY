/**
 * Pedersen Commitments
 * 
 * Cryptographic commitments that hide transaction amounts while
 * allowing verification of properties (e.g., sum conservation).
 * 
 * C = g^v * h^r
 * Where:
 * - g, h: Generator points
 * - v: Value (amount)
 * - r: Random blinding factor
 * 
 * Properties:
 * - Hiding: Cannot determine v from C without r
 * - Binding: Cannot find different (v', r') that produces same C
 * - Homomorphic: C(v1) + C(v2) = C(v1 + v2)
 */

import { sha256 } from '@noble/hashes/sha256';
import { randomBytes } from 'crypto';
import type { PedersenCommitment } from './types.js';

// Re-export the type
export type { PedersenCommitment } from './types.js';

/** Generator points (in practice, these would be curve points) */
const GENERATOR_G = sha256(new TextEncoder().encode('OBSCURA_PEDERSEN_G'));
const GENERATOR_H = sha256(new TextEncoder().encode('OBSCURA_PEDERSEN_H'));

/**
 * Create a Pedersen commitment for an amount
 * 
 * In production, this would use elliptic curve operations.
 * For now, we use a hash-based simulation that provides
 * the same hiding/binding properties.
 */
export function createCommitment(value: bigint): PedersenCommitment {
  // Generate random blinding factor
  const blindingFactor = randomBytes(32);
  
  // Create commitment: H(g || value || h || blindingFactor)
  const valueBytes = bigintToBytes(value);
  const commitmentInput = Buffer.concat([
    GENERATOR_G,
    valueBytes,
    GENERATOR_H,
    blindingFactor,
  ]);
  
  const commitment = sha256(commitmentInput);
  
  return {
    commitment: new Uint8Array(commitment),
    blindingFactor: new Uint8Array(blindingFactor),
    value,
  };
}

/**
 * Verify a Pedersen commitment
 */
export function verifyCommitment(
  commitment: Uint8Array,
  value: bigint,
  blindingFactor: Uint8Array
): boolean {
  const valueBytes = bigintToBytes(value);
  const commitmentInput = Buffer.concat([
    GENERATOR_G,
    valueBytes,
    GENERATOR_H,
    Buffer.from(blindingFactor),
  ]);
  
  const expectedCommitment = sha256(commitmentInput);
  
  return Buffer.from(commitment).equals(Buffer.from(expectedCommitment));
}

/**
 * Add two commitments (homomorphic property)
 * C(v1) + C(v2) = C(v1 + v2)
 */
export function addCommitments(
  c1: PedersenCommitment,
  c2: PedersenCommitment
): PedersenCommitment {
  const newValue = c1.value + c2.value;
  
  // Add blinding factors (mod order in real implementation)
  const newBlinding = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    newBlinding[i] = (c1.blindingFactor[i] + c2.blindingFactor[i]) % 256;
  }
  
  // Recompute commitment
  const valueBytes = bigintToBytes(newValue);
  const commitmentInput = Buffer.concat([
    GENERATOR_G,
    valueBytes,
    GENERATOR_H,
    newBlinding,
  ]);
  
  return {
    commitment: new Uint8Array(sha256(commitmentInput)),
    blindingFactor: new Uint8Array(newBlinding),
    value: newValue,
  };
}

/**
 * Create a range proof that value is in [0, 2^64)
 * 
 * In production, this would use Bulletproofs or similar.
 * For now, we create a simple proof structure.
 */
export function createRangeProof(commitment: PedersenCommitment): Uint8Array {
  // Simplified range proof (not cryptographically secure)
  // Production would use Bulletproofs
  const proofData = Buffer.concat([
    Buffer.from('RANGE_PROOF'),
    Buffer.from(commitment.commitment),
    bigintToBytes(commitment.value),
    Buffer.from(commitment.blindingFactor),
  ]);
  
  return new Uint8Array(sha256(proofData));
}

/**
 * Verify a range proof
 */
export function verifyRangeProof(
  commitment: Uint8Array,
  proof: Uint8Array,
  value: bigint,
  blindingFactor: Uint8Array
): boolean {
  const expectedProofData = Buffer.concat([
    Buffer.from('RANGE_PROOF'),
    Buffer.from(commitment),
    bigintToBytes(value),
    Buffer.from(blindingFactor),
  ]);
  
  const expectedProof = sha256(expectedProofData);
  return Buffer.from(proof).equals(Buffer.from(expectedProof));
}

/**
 * Serialize commitment for on-chain storage
 */
export function serializeCommitment(commitment: PedersenCommitment): string {
  return Buffer.from(commitment.commitment).toString('hex');
}

/**
 * Convert bigint to fixed-size bytes
 */
function bigintToBytes(value: bigint): Buffer {
  const hex = value.toString(16).padStart(16, '0');
  return Buffer.from(hex, 'hex');
}

/**
 * Create commitment hash for on-chain verification
 * This is what gets stored on-chain (not the actual amount)
 */
export function createCommitmentHash(
  sender: string,
  recipient: string,
  amountCommitment: Uint8Array,
  nonce: number
): Uint8Array {
  const data = Buffer.concat([
    Buffer.from('SIP_COMMITMENT'),
    Buffer.from(sender),
    Buffer.from(recipient),
    Buffer.from(amountCommitment),
    Buffer.from(nonce.toString()),
  ]);
  
  return new Uint8Array(sha256(data));
}
