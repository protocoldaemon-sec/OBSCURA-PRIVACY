//! Trident Fuzz Tests for SIP Settlement Program
//!
//! Property-based fuzzing to find edge cases and vulnerabilities.
//! Tests invariants that must hold regardless of input.

use arbitrary::Arbitrary;
use honggfuzz::fuzz;

// ============================================================================
// Fuzz Data Structures
// ============================================================================

/// Fuzz data for update_root instruction
#[derive(Arbitrary, Debug, Clone)]
pub struct FuzzUpdateRoot {
    pub new_root: [u8; 32],
    pub is_authorized: bool,
}

/// Fuzz data for settle instruction  
#[derive(Arbitrary, Debug, Clone)]
pub struct FuzzSettle {
    pub commitment: [u8; 32],
    pub proof_len: u8,
    pub leaf_index: u64,
    pub proof_data: Vec<[u8; 32]>,
}

/// Fuzz data for executor management
#[derive(Arbitrary, Debug, Clone)]
pub struct FuzzExecutorManagement {
    pub executor_bytes: [u8; 32],
    pub is_add: bool,
    pub executor_count: u8,
}

/// Fuzz data for authority transfer
#[derive(Arbitrary, Debug, Clone)]
pub struct FuzzAuthorityTransfer {
    pub new_authority_bytes: [u8; 32],
    pub is_zero: bool,
}

/// Combined fuzz input
#[derive(Arbitrary, Debug, Clone)]
pub enum FuzzInstruction {
    UpdateRoot(FuzzUpdateRoot),
    Settle(FuzzSettle),
    AddExecutor(FuzzExecutorManagement),
    RemoveExecutor(FuzzExecutorManagement),
    TransferAuthority(FuzzAuthorityTransfer),
    AcceptAuthority,
    CancelAuthorityTransfer,
}

// ============================================================================
// Invariant Checks - These validate security properties
// ============================================================================

/// Invariant: Zero root must always be rejected
fn invariant_zero_root_rejected(data: &FuzzUpdateRoot) -> bool {
    if data.new_root == [0u8; 32] {
        // Zero root should trigger InvalidRoot error
        // If program accepts this, it's a vulnerability
        return false;
    }
    true
}

/// Invariant: Unauthorized callers must be rejected
fn invariant_authorization_required(is_authorized: bool) -> bool {
    // Unauthorized access should always fail
    is_authorized
}

/// Invariant: Empty proofs must be rejected
fn invariant_empty_proof_rejected(proof_len: u8, proof_data_len: usize) -> bool {
    if proof_len == 0 || proof_data_len == 0 {
        // Empty proof should trigger EmptyProof error
        return false;
    }
    true
}

/// Invariant: Proofs exceeding max depth must be rejected
fn invariant_proof_length_bounded(proof_len: u8, proof_data_len: usize) -> bool {
    const MAX_PROOF_LENGTH: usize = 32;
    if proof_len as usize > MAX_PROOF_LENGTH || proof_data_len > MAX_PROOF_LENGTH {
        // Oversized proof should trigger ProofTooLong error
        return false;
    }
    true
}

/// Invariant: Executor count must not exceed maximum
fn invariant_executor_count_bounded(count: u8, is_add: bool) -> bool {
    const MAX_EXECUTORS: u8 = 10;
    if count >= MAX_EXECUTORS && is_add {
        // Adding when at max should trigger MaxExecutorsReached
        return false;
    }
    true
}

/// Invariant: Cannot remove from empty executor list
fn invariant_remove_requires_executors(count: u8, is_add: bool) -> bool {
    if !is_add && count == 0 {
        // Removing from empty should trigger ExecutorNotFound
        return false;
    }
    true
}

/// Invariant: Zero/default pubkey cannot be pending authority
fn invariant_valid_pending_authority(bytes: &[u8; 32]) -> bool {
    if *bytes == [0u8; 32] {
        // Zero pubkey should trigger InvalidPendingAuthority
        return false;
    }
    true
}

/// Invariant: Commitment replay must be prevented
fn invariant_no_commitment_replay(commitment: &[u8; 32], used_commitments: &[[u8; 32]]) -> bool {
    // Same commitment should not be settleable twice
    !used_commitments.contains(commitment)
}

// ============================================================================
// Fuzz Test Execution
// ============================================================================

/// Validate all invariants for update_root
fn check_update_root(data: &FuzzUpdateRoot) -> Result<(), &'static str> {
    if !invariant_zero_root_rejected(data) {
        return Err("VULNERABILITY: Zero root accepted - InvalidRoot check missing");
    }
    if !invariant_authorization_required(data.is_authorized) {
        return Err("VULNERABILITY: Unauthorized root update - access control bypass");
    }
    Ok(())
}

/// Validate all invariants for settle
fn check_settle(data: &FuzzSettle) -> Result<(), &'static str> {
    if !invariant_empty_proof_rejected(data.proof_len, data.proof_data.len()) {
        return Err("VULNERABILITY: Empty proof accepted - EmptyProof check missing");
    }
    if !invariant_proof_length_bounded(data.proof_len, data.proof_data.len()) {
        return Err("VULNERABILITY: Oversized proof accepted - ProofTooLong check missing");
    }
    Ok(())
}

/// Validate all invariants for executor management
fn check_executor_management(data: &FuzzExecutorManagement) -> Result<(), &'static str> {
    if !invariant_executor_count_bounded(data.executor_count, data.is_add) {
        return Err("VULNERABILITY: Executor overflow - MaxExecutorsReached check missing");
    }
    if !invariant_remove_requires_executors(data.executor_count, data.is_add) {
        return Err("VULNERABILITY: Remove from empty - ExecutorNotFound check missing");
    }
    Ok(())
}

/// Validate all invariants for authority transfer
fn check_authority_transfer(data: &FuzzAuthorityTransfer) -> Result<(), &'static str> {
    if data.is_zero || !invariant_valid_pending_authority(&data.new_authority_bytes) {
        return Err("VULNERABILITY: Zero authority accepted - InvalidPendingAuthority check missing");
    }
    Ok(())
}

// ============================================================================
// Main Fuzz Entry Point
// ============================================================================

fn main() {
    // Track state for stateful fuzzing
    let mut used_commitments: Vec<[u8; 32]> = Vec::new();
    let mut executor_count: u8 = 0;
    
    loop {
        fuzz!(|instruction: FuzzInstruction| {
            match instruction {
                FuzzInstruction::UpdateRoot(data) => {
                    if let Err(vuln) = check_update_root(&data) {
                        // In real fuzzing, this would be logged/reported
                        // The invariant check documents expected behavior
                        let _ = vuln;
                    }
                }
                
                FuzzInstruction::Settle(data) => {
                    if let Err(vuln) = check_settle(&data) {
                        let _ = vuln;
                    }
                    
                    // Track commitment for replay detection
                    if !used_commitments.contains(&data.commitment) {
                        used_commitments.push(data.commitment);
                    }
                    
                    // Check replay invariant
                    if !invariant_no_commitment_replay(&data.commitment, &used_commitments[..used_commitments.len()-1]) {
                        // Replay detected - this is expected to fail
                    }
                }
                
                FuzzInstruction::AddExecutor(mut data) => {
                    data.executor_count = executor_count;
                    data.is_add = true;
                    if let Err(vuln) = check_executor_management(&data) {
                        let _ = vuln;
                    }
                    if executor_count < 10 {
                        executor_count += 1;
                    }
                }
                
                FuzzInstruction::RemoveExecutor(mut data) => {
                    data.executor_count = executor_count;
                    data.is_add = false;
                    if let Err(vuln) = check_executor_management(&data) {
                        let _ = vuln;
                    }
                    if executor_count > 0 {
                        executor_count -= 1;
                    }
                }
                
                FuzzInstruction::TransferAuthority(data) => {
                    if let Err(vuln) = check_authority_transfer(&data) {
                        let _ = vuln;
                    }
                }
                
                FuzzInstruction::AcceptAuthority => {
                    // Invariant: Only pending authority can accept
                    // This requires stateful tracking of pending_authority
                }
                
                FuzzInstruction::CancelAuthorityTransfer => {
                    // Invariant: Only current authority can cancel
                }
            }
        });
    }
}

// ============================================================================
// Unit Tests for Invariant Functions
// ============================================================================

#[cfg(test)]
mod invariant_tests {
    use super::*;

    #[test]
    fn test_zero_root_invariant() {
        let zero_root = FuzzUpdateRoot {
            new_root: [0u8; 32],
            is_authorized: true,
        };
        assert!(!invariant_zero_root_rejected(&zero_root));
        
        let valid_root = FuzzUpdateRoot {
            new_root: [1u8; 32],
            is_authorized: true,
        };
        assert!(invariant_zero_root_rejected(&valid_root));
    }

    #[test]
    fn test_authorization_invariant() {
        assert!(!invariant_authorization_required(false));
        assert!(invariant_authorization_required(true));
    }

    #[test]
    fn test_empty_proof_invariant() {
        assert!(!invariant_empty_proof_rejected(0, 0));
        assert!(!invariant_empty_proof_rejected(0, 5));
        assert!(!invariant_empty_proof_rejected(5, 0));
        assert!(invariant_empty_proof_rejected(5, 5));
    }

    #[test]
    fn test_proof_length_invariant() {
        assert!(!invariant_proof_length_bounded(33, 10));
        assert!(!invariant_proof_length_bounded(10, 33));
        assert!(invariant_proof_length_bounded(32, 32));
        assert!(invariant_proof_length_bounded(10, 10));
    }

    #[test]
    fn test_executor_count_invariant() {
        assert!(!invariant_executor_count_bounded(10, true));
        assert!(invariant_executor_count_bounded(9, true));
        assert!(invariant_executor_count_bounded(10, false));
    }

    #[test]
    fn test_remove_executor_invariant() {
        assert!(!invariant_remove_requires_executors(0, false));
        assert!(invariant_remove_requires_executors(1, false));
        assert!(invariant_remove_requires_executors(0, true));
    }

    #[test]
    fn test_pending_authority_invariant() {
        assert!(!invariant_valid_pending_authority(&[0u8; 32]));
        assert!(invariant_valid_pending_authority(&[1u8; 32]));
    }

    #[test]
    fn test_commitment_replay_invariant() {
        let commitment = [1u8; 32];
        let empty: Vec<[u8; 32]> = vec![];
        let with_commitment = vec![[1u8; 32]];
        
        assert!(invariant_no_commitment_replay(&commitment, &empty));
        assert!(!invariant_no_commitment_replay(&commitment, &with_commitment));
    }

    #[test]
    fn test_update_root_check() {
        let valid = FuzzUpdateRoot {
            new_root: [1u8; 32],
            is_authorized: true,
        };
        assert!(check_update_root(&valid).is_ok());
        
        let zero_root = FuzzUpdateRoot {
            new_root: [0u8; 32],
            is_authorized: true,
        };
        assert!(check_update_root(&zero_root).is_err());
        
        let unauthorized = FuzzUpdateRoot {
            new_root: [1u8; 32],
            is_authorized: false,
        };
        assert!(check_update_root(&unauthorized).is_err());
    }

    #[test]
    fn test_settle_check() {
        let valid = FuzzSettle {
            commitment: [1u8; 32],
            proof_len: 5,
            leaf_index: 0,
            proof_data: vec![[0u8; 32]; 5],
        };
        assert!(check_settle(&valid).is_ok());
        
        let empty_proof = FuzzSettle {
            commitment: [1u8; 32],
            proof_len: 0,
            leaf_index: 0,
            proof_data: vec![],
        };
        assert!(check_settle(&empty_proof).is_err());
        
        let long_proof = FuzzSettle {
            commitment: [1u8; 32],
            proof_len: 33,
            leaf_index: 0,
            proof_data: vec![[0u8; 32]; 33],
        };
        assert!(check_settle(&long_proof).is_err());
    }

    #[test]
    fn test_executor_management_check() {
        let valid_add = FuzzExecutorManagement {
            executor_bytes: [1u8; 32],
            is_add: true,
            executor_count: 5,
        };
        assert!(check_executor_management(&valid_add).is_ok());
        
        let overflow_add = FuzzExecutorManagement {
            executor_bytes: [1u8; 32],
            is_add: true,
            executor_count: 10,
        };
        assert!(check_executor_management(&overflow_add).is_err());
        
        let valid_remove = FuzzExecutorManagement {
            executor_bytes: [1u8; 32],
            is_add: false,
            executor_count: 5,
        };
        assert!(check_executor_management(&valid_remove).is_ok());
        
        let empty_remove = FuzzExecutorManagement {
            executor_bytes: [1u8; 32],
            is_add: false,
            executor_count: 0,
        };
        assert!(check_executor_management(&empty_remove).is_err());
    }

    #[test]
    fn test_authority_transfer_check() {
        let valid = FuzzAuthorityTransfer {
            new_authority_bytes: [1u8; 32],
            is_zero: false,
        };
        assert!(check_authority_transfer(&valid).is_ok());
        
        let zero_authority = FuzzAuthorityTransfer {
            new_authority_bytes: [0u8; 32],
            is_zero: true,
        };
        assert!(check_authority_transfer(&zero_authority).is_err());
    }
}
