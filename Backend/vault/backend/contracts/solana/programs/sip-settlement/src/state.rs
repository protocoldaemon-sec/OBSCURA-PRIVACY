//! Program state definitions

use anchor_lang::prelude::*;

/// Maximum number of executors
pub const MAX_EXECUTORS: usize = 10;

/// Maximum proof length (tree depth)
pub const MAX_PROOF_LENGTH: usize = 32;

/// Settlement state account
#[account]
pub struct SettlementState {
    /// Program authority (owner)
    pub authority: Pubkey,
    
    /// Pending authority for two-step transfer
    pub pending_authority: Pubkey,
    
    /// Current Merkle root
    pub current_root: [u8; 32],
    
    /// Current batch ID
    pub batch_id: u64,
    
    /// Number of authorized executors
    pub executor_count: u8,
    
    /// Authorized executors
    pub executors: [Pubkey; MAX_EXECUTORS],
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl SettlementState {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // pending_authority
        32 + // current_root
        8 +  // batch_id
        1 +  // executor_count
        (32 * MAX_EXECUTORS) + // executors
        1;   // bump

    pub fn is_executor(&self, pubkey: &Pubkey) -> bool {
        if *pubkey == self.authority {
            return true;
        }
        for i in 0..self.executor_count as usize {
            if self.executors[i] == *pubkey {
                return true;
            }
        }
        false
    }
}

/// Used commitment account (for replay protection)
#[account]
pub struct UsedCommitment {
    /// The commitment that was used
    pub commitment: [u8; 32],
    
    /// Batch ID when settled
    pub batch_id: u64,
    
    /// Settlement timestamp
    pub settled_at: i64,
    
    /// Executor who settled
    pub executor: Pubkey,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl UsedCommitment {
    pub const LEN: usize = 8 + // discriminator
        32 + // commitment
        8 +  // batch_id
        8 +  // settled_at
        32 + // executor
        1;   // bump
}

/// Batch root historical record
#[account]
pub struct BatchRoot {
    /// Batch ID
    pub batch_id: u64,
    
    /// Merkle root
    pub root: [u8; 32],
    
    /// Timestamp when created
    pub created_at: i64,
    
    /// Executor who submitted
    pub executor: Pubkey,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl BatchRoot {
    pub const LEN: usize = 8 + // discriminator
        8 +  // batch_id
        32 + // root
        8 +  // created_at
        32 + // executor
        1;   // bump
}
