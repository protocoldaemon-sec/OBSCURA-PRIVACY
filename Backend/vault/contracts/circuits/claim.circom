pragma circom 2.1.0;

include "node_modules/circomlib/circuits/poseidon.circom";

/**
 * ClaimProof Circuit
 * 
 * Proves knowledge of commitment preimage without revealing:
 * - Recipient address
 * - Transfer amount
 * - Random nonce
 * 
 * Public inputs (visible on-chain):
 * - commitment: H(recipient || amount || nonce)
 * - nullifier: H(nonce || recipient) - prevents double-claim
 * - withdrawAddress: Where funds should go (can be different from recipient)
 * 
 * Private inputs (hidden):
 * - recipient: Original recipient address hash
 * - amount: Transfer amount
 * - nonce: Random value for uniqueness
 */
template ClaimProof() {
    // Private inputs (hidden from verifier)
    signal input recipient;      // Recipient address as field element
    signal input amount;         // Transfer amount in lamports/wei
    signal input nonce;          // Random nonce for uniqueness
    
    // Public inputs (visible on-chain)
    signal input commitment;     // H(recipient || amount || nonce)
    signal input nullifier;      // H(nonce || recipient) - prevents double-spend
    signal input withdrawAddress; // Where to send funds (can differ from recipient)
    
    // ============ Verify Commitment ============
    // Compute: H(recipient || amount || nonce)
    component commitmentHasher = Poseidon(3);
    commitmentHasher.inputs[0] <== recipient;
    commitmentHasher.inputs[1] <== amount;
    commitmentHasher.inputs[2] <== nonce;
    
    // Constraint: computed commitment must match public commitment
    commitment === commitmentHasher.out;
    
    // ============ Verify Nullifier ============
    // Compute: H(nonce || recipient)
    // This ensures each deposit can only be claimed once
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== nonce;
    nullifierHasher.inputs[1] <== recipient;
    
    // Constraint: computed nullifier must match public nullifier
    nullifier === nullifierHasher.out;
    
    // ============ Withdraw Address ============
    // withdrawAddress is public but not constrained to recipient
    // This allows recipient to claim to any address they control
    // (privacy feature: can claim to fresh address)
    
    // Dummy constraint to ensure withdrawAddress is used
    signal withdrawCheck;
    withdrawCheck <== withdrawAddress * 1;
}

component main {public [commitment, nullifier, withdrawAddress]} = ClaimProof();
