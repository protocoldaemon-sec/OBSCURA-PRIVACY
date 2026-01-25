/**
 * ZK Module
 * 
 * Zero-knowledge proof utilities for private claims
 */

export {
  computeCommitment,
  computeNullifier,
  generateNonce,
  hashAddress,
  prepareClaimProof,
  createDepositData,
  verifyCommitment,
  type ClaimProofInputs,
  type ClaimProofOutputs,
} from './claim-prover.js';
