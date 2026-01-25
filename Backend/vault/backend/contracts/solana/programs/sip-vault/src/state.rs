//! Vault state definitions

use anchor_lang::prelude::*;

/// Vault state account
#[account]
pub struct VaultState {
    /// Vault authority (owner)
    pub authority: Pubkey,
    
    /// Pending authority for two-step transfer
    pub pending_authority: Pubkey,
    
    /// Settlement contract that can authorize withdrawals
    pub settlement: Pubkey,
    
    /// Total SOL deposited (lamports)
    pub sol_balance: u64,
    
    /// Deposit counter for unique commitments
    pub deposit_nonce: u64,
    
    /// Withdrawal counter
    pub withdrawal_nonce: u64,
    
    /// Pause state for emergency
    pub paused: bool,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl VaultState {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // pending_authority
        32 + // settlement
        8 +  // sol_balance
        8 +  // deposit_nonce
        8 +  // withdrawal_nonce
        1 +  // paused
        1;   // bump

    pub fn is_authorized(&self, pubkey: &Pubkey) -> bool {
        *pubkey == self.authority || *pubkey == self.settlement
    }
}

/// Used commitment account (for replay protection)
#[account]
pub struct UsedCommitment {
    /// The commitment that was used
    pub commitment: [u8; 32],
    
    /// Timestamp when used
    pub used_at: i64,
    
    /// Who executed the withdrawal
    pub executor: Pubkey,
    
    /// Amount withdrawn
    pub amount: u64,
    
    /// Recipient
    pub recipient: Pubkey,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl UsedCommitment {
    pub const LEN: usize = 8 + // discriminator
        32 + // commitment
        8 +  // used_at
        32 + // executor
        8 +  // amount
        32 + // recipient
        1;   // bump
}

/// Deposit record for tracking
#[account]
pub struct DepositRecord {
    /// Deposit commitment
    pub commitment: [u8; 32],
    
    /// Depositor
    pub depositor: Pubkey,
    
    /// Amount deposited (lamports)
    pub amount: u64,
    
    /// Token mint (Pubkey::default() for SOL)
    pub token_mint: Pubkey,
    
    /// Timestamp
    pub deposited_at: i64,
    
    /// Deposit nonce
    pub nonce: u64,
    
    /// Bump seed for PDA
    pub bump: u8,
}

impl DepositRecord {
    pub const LEN: usize = 8 + // discriminator
        32 + // commitment
        32 + // depositor
        8 +  // amount
        32 + // token_mint
        8 +  // deposited_at
        8 +  // nonce
        1;   // bump
}

/// Token vault account for SPL tokens
#[account]
pub struct TokenVault {
    /// Token mint
    pub mint: Pubkey,
    
    /// Token account (PDA)
    pub token_account: Pubkey,
    
    /// Total balance
    pub balance: u64,
    
    /// Bump seed
    pub bump: u8,
}

impl TokenVault {
    pub const LEN: usize = 8 + // discriminator
        32 + // mint
        32 + // token_account
        8 +  // balance
        1;   // bump
}
