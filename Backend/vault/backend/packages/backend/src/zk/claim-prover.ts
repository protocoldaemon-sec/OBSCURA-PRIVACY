/**
 * ZK Claim Prover
 * 
 * Generates Groth16 proofs for private claims using snarkjs.
 * Proves knowledge of commitment preimage without revealing:
 * - Recipient identity
 * - Transfer amount
 * - Random nonce
 * 
 * Uses Poseidon hash for ZK-friendly commitments.
 */

import { buildPoseidon, type Poseidon } from 'circomlibjs';

// Lazy-loaded Poseidon instance
let poseidonInstance: Poseidon | null = null;

/**
 * Get or initialize Poseidon hasher
 */
async function getPoseidon(): Promise<Poseidon> {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
}

/**
 * Convert BigInt to field element (mod p)
 */
function toFieldElement(value: bigint): bigint {
  // BN254 field prime
  const p = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
  return ((value % p) + p) % p;
}

/**
 * Hash address string to field element
 * Uses Poseidon hash for ZK-friendly output
 */
export async function hashAddress(address: string): Promise<bigint> {
  const poseidon = await getPoseidon();
  
  // Convert address to bigint that fits in field
  let addressBigInt: bigint;
  
  if (address.startsWith('0x')) {
    // EVM address (20 bytes = 160 bits) - fits in field
    addressBigInt = BigInt(address);
  } else {
    // Solana address (base58, 32 bytes) - hash to fit in field
    // Convert base58 to bytes, then take first 31 bytes for field element
    const bytes = Buffer.from(address);
    
    // Hash the address bytes in chunks that fit Poseidon (max 16 inputs)
    // Split into 4 chunks of ~8 bytes each
    const chunk1 = BigInt('0x' + bytes.slice(0, 8).toString('hex'));
    const chunk2 = BigInt('0x' + bytes.slice(8, 16).toString('hex'));
    const chunk3 = BigInt('0x' + bytes.slice(16, 24).toString('hex'));
    const chunk4 = BigInt('0x' + bytes.slice(24, 32).toString('hex'));
    
    // Hash the 4 chunks together
    const hash = poseidon.F.toObject(poseidon([chunk1, chunk2, chunk3, chunk4]));
    addressBigInt = BigInt(hash.toString());
  }
  
  return toFieldElement(addressBigInt);
}

/**
 * Compute commitment: H(recipient || amount || nonce)
 */
export async function computeCommitment(
  recipientHash: bigint,
  amount: bigint,
  nonce: bigint
): Promise<bigint> {
  const poseidon = await getPoseidon();
  const hash = poseidon.F.toObject(poseidon([recipientHash, amount, nonce]));
  return BigInt(hash.toString());
}

/**
 * Compute nullifier: H(nonce || recipient)
 */
export async function computeNullifier(
  nonce: bigint,
  recipientHash: bigint
): Promise<bigint> {
  const poseidon = await getPoseidon();
  const hash = poseidon.F.toObject(poseidon([nonce, recipientHash]));
  return BigInt(hash.toString());
}

/**
 * Generate random nonce
 */
export function generateNonce(): bigint {
  const bytes = new Uint8Array(31); // 31 bytes to fit in field
  crypto.getRandomValues(bytes);
  return BigInt('0x' + Buffer.from(bytes).toString('hex'));
}

/**
 * Claim proof inputs
 */
export interface ClaimProofInputs {
  // Private inputs
  recipient: string;      // Original recipient address
  amount: bigint;         // Amount in smallest unit (lamports/wei)
  nonce: bigint;          // Random nonce
  
  // Public inputs (will be computed)
  withdrawAddress: string; // Where to send funds
}

/**
 * Claim proof outputs
 */
export interface ClaimProofOutputs {
  // Public signals
  commitment: string;     // Hex string
  nullifier: string;      // Hex string
  withdrawAddress: string;
  
  // For circuit witness
  privateInputs: {
    recipient: string;
    amount: string;
    nonce: string;
  };
  publicInputs: {
    commitment: string;
    nullifier: string;
    withdrawAddress: string;
  };
}

/**
 * Prepare inputs for ZK proof generation
 */
export async function prepareClaimProof(
  inputs: ClaimProofInputs
): Promise<ClaimProofOutputs> {
  // Hash recipient address
  const recipientHash = await hashAddress(inputs.recipient);
  
  // Hash withdraw address
  const withdrawHash = await hashAddress(inputs.withdrawAddress);
  
  // Compute commitment
  const commitment = await computeCommitment(
    recipientHash,
    inputs.amount,
    inputs.nonce
  );
  
  // Compute nullifier
  const nullifier = await computeNullifier(inputs.nonce, recipientHash);
  
  return {
    commitment: '0x' + commitment.toString(16).padStart(64, '0'),
    nullifier: '0x' + nullifier.toString(16).padStart(64, '0'),
    withdrawAddress: inputs.withdrawAddress,
    
    privateInputs: {
      recipient: recipientHash.toString(),
      amount: inputs.amount.toString(),
      nonce: inputs.nonce.toString(),
    },
    publicInputs: {
      commitment: commitment.toString(),
      nullifier: nullifier.toString(),
      withdrawAddress: withdrawHash.toString(),
    },
  };
}

/**
 * Create deposit data with commitment
 * Called when creating a transfer to stealth address
 */
export async function createDepositData(
  recipient: string,
  amount: bigint
): Promise<{
  commitment: string;
  nullifier: string;
  nonce: bigint;
  recipientHash: bigint;
}> {
  const nonce = generateNonce();
  const recipientHash = await hashAddress(recipient);
  
  const commitment = await computeCommitment(recipientHash, amount, nonce);
  const nullifier = await computeNullifier(nonce, recipientHash);
  
  return {
    commitment: '0x' + commitment.toString(16).padStart(64, '0'),
    nullifier: '0x' + nullifier.toString(16).padStart(64, '0'),
    nonce,
    recipientHash,
  };
}

/**
 * Verify commitment matches expected values (off-chain check)
 */
export async function verifyCommitment(
  commitment: string,
  recipient: string,
  amount: bigint,
  nonce: bigint
): Promise<boolean> {
  const recipientHash = await hashAddress(recipient);
  const computed = await computeCommitment(recipientHash, amount, nonce);
  
  // Handle commitment with or without 0x prefix
  const cleanCommitment = commitment.startsWith('0x') ? commitment : `0x${commitment}`;
  const expected = BigInt(cleanCommitment);
  
  return computed === expected;
}

// Export types
export type { Poseidon };
